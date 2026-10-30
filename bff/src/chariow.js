'use strict';

const crypto = require('node:crypto');
const { normalizeEmail, sha256 } = require('./security');

const CHARIOW_API_BASE_URL = 'https://api.chariow.com/v1';
// Lot I (DDA Product & Conversion Alignment Audit, §8) — maps each supported
// Chariow Pulse event to the monetization event name the audit's dictionary
// expects. 'successful.sale' is the money event (payment_succeeded);
// 'license.activated' is the entitlement event (subscription_activated).
// There is no distinct Chariow renewal event in SUPPORTED_PULSE_EVENTS below,
// so subscription_renewed is intentionally not fired here — fabricating it
// from 'successful.sale' would conflate a first purchase with a renewal.
// Both 'license.expired' (lapse) and 'license.revoked' (explicit removal)
// end access, so both map to subscription_cancelled, distinguished by a
// `reason` property rather than inventing two different event names.
const MONETIZATION_EVENT_BY_PULSE = Object.freeze({
  'successful.sale': 'payment_succeeded',
  'license.activated': 'subscription_activated',
  'license.expired': 'subscription_cancelled',
  'license.revoked': 'subscription_cancelled'
});
const DDA_USER_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SUPPORTED_PULSE_EVENTS = new Set([
  'successful.sale',
  'abandoned.sale',
  'failed.sale',
  'license.activated',
  'license.expired',
  'license.revoked'
]);

function chariowConfigFromEnv(env = process.env) {
  return {
    apiBaseUrl: String(env.CHARIOW_API_BASE_URL || CHARIOW_API_BASE_URL).replace(/\/+$/, ''),
    apiKey: env.CHARIOW_API_KEY || null,
    pulseSecret: env.CHARIOW_PULSE_SECRET || null,
    premiumProductIds: String(env.CHARIOW_PREMIUM_PRODUCT_IDS || '')
      .split(',').map(value => value.trim()).filter(Boolean),
    checkoutRedirectUrl: env.CHARIOW_CHECKOUT_REDIRECT_URL || null
  };
}

function verifyChariowPulse(rawBody, receivedSignature, secret) {
  if (!Buffer.isBuffer(rawBody) || !secret || typeof receivedSignature !== 'string' || !receivedSignature.startsWith('sha256=')) return false;
  const expected = `sha256=${crypto.createHmac('sha256', secret).update(rawBody).digest('hex')}`;
  const left = Buffer.from(receivedSignature);
  const right = Buffer.from(expected);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

async function readRawBody(req, maxBytes = 256 * 1024) {
  let total = 0;
  const chunks = [];
  for await (const chunk of req) {
    total += chunk.length;
    if (total > maxBytes) throw Object.assign(new Error('payload too large'), { status: 413 });
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

function safeText(value, max = 160) {
  return String(value || '').trim().slice(0, max);
}

function productIdFromPayload(payload) {
  return safeText(payload.product?.id || payload.sale?.product_id || payload.license?.product_id, 100) || null;
}

function customerFromPayload(payload) {
  const customer = payload.customer || {};
  return {
    externalCustomerId: safeText(customer.id, 100) || null,
    email: normalizeEmail(customer.email) || null
  };
}

function metadataFromPayload(payload) {
  const saleMetadata = payload.sale?.custom_metadata;
  const licenseMetadata = payload.license?.custom_metadata;
  return {
    ...(licenseMetadata && typeof licenseMetadata === 'object' && !Array.isArray(licenseMetadata) ? licenseMetadata : {}),
    ...(saleMetadata && typeof saleMetadata === 'object' && !Array.isArray(saleMetadata) ? saleMetadata : {})
  };
}

/**
 * Convert only documented Chariow Pulse events into an internal membership
 * transition. No client-provided proof or local plan participates in this map.
 */
function mapChariowPulse(payload, headers = {}, config = chariowConfigFromEnv()) {
  const event = safeText(payload?.event || headers['x-pulse-event'], 80);
  if (!SUPPORTED_PULSE_EVENTS.has(event)) return { kind: 'ignored', reason: 'unsupported_event', event };

  const productId = productIdFromPayload(payload);
  const isPremiumProduct = Boolean(productId && config.premiumProductIds.includes(productId));
  const customer = customerFromPayload(payload);
  const metadata = metadataFromPayload(payload);
  const saleId = safeText(payload.sale?.id, 100) || null;
  const licenseId = safeText(payload.license?.id, 100) || null;
  const externalId = licenseId || saleId;

  if (!isPremiumProduct) return { kind: 'ignored', reason: 'product_not_mapped', event, productId, externalId };
  if (!externalId) return { kind: 'ignored', reason: 'missing_provider_reference', event, productId, externalId };
  if (!DDA_USER_ID.test(String(metadata.dda_user_id || ''))) {
    return { kind: 'ignored', reason: 'missing_dda_user_reference', event, productId, externalId };
  }

  let status = null;
  if (event === 'successful.sale' || event === 'license.activated') status = 'active';
  if (event === 'failed.sale' || event === 'abandoned.sale') status = 'pending';
  if (event === 'license.expired') status = 'expired';
  if (event === 'license.revoked') status = 'revoked';

  return {
    kind: 'membership_transition',
    provider: 'chariow',
    event,
    status,
    productId,
    externalId,
    saleId,
    licenseId,
    customer,
    userReference: metadata.dda_user_id,
    entitlement: status === 'active' ? 'premium_track' : null,
    occurredAt: safeText(payload.sale?.completed_at || payload.license?.activated_at || payload.license?.expired_at || payload.license?.revoked_at, 50) || null,
    deliveryId: safeText(headers['x-pulse-delivery-id'], 120) || null
  };
}

async function createChariowCheckout({ config = chariowConfigFromEnv(), fetchImpl = fetch, input }) {
  if (!config.apiKey) throw new Error('CHARIOW_API_KEY is required on the server');
  if (!input || typeof input !== 'object') throw new Error('checkout input is required');
  const productId = safeText(input.productId, 100);
  if (!productId || !config.premiumProductIds.includes(productId)) throw new Error('product_not_allowlisted');
  if (!DDA_USER_ID.test(String(input.customMetadata?.dda_user_id || ''))) throw new Error('dda_user_id_required');
  const body = {
    product_id: productId,
    email: normalizeEmail(input.email),
    first_name: safeText(input.firstName, 50),
    last_name: safeText(input.lastName, 50),
    phone: { number: safeText(input.phone?.number, 30).replace(/\D/g, ''), country_code: safeText(input.phone?.countryCode, 10).toUpperCase() },
    ...(input.customMetadata ? { custom_metadata: input.customMetadata } : {}),
    ...(config.checkoutRedirectUrl ? { redirect_url: config.checkoutRedirectUrl } : {})
  };
  const response = await fetchImpl(`${config.apiBaseUrl}/checkout`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${config.apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const result = await response.json();
  if (!response.ok) throw Object.assign(new Error('Chariow checkout request failed'), { status: response.status, details: result });
  const data = result?.data || {};
  return {
    step: data.step,
    checkoutUrl: data.payment?.checkout_url || null,
    saleId: data.purchase?.id || null,
    saleStatus: data.purchase?.status || null,
    raw: result
  };
}

async function handleChariowPulse(req, { secret, idempotencyStore, applyEvent, config, trackEvent } = {}) {
  const rawBody = await readRawBody(req);
  const headers = {
    'x-chariow-signature': req.headers['x-chariow-signature'],
    'x-pulse-event': req.headers['x-pulse-event'],
    'x-pulse-delivery-id': req.headers['x-pulse-delivery-id']
  };
  if (!verifyChariowPulse(rawBody, headers['x-chariow-signature'], secret)) return { status: 401, body: { error: 'invalid_signature' } };
  const deliveryId = safeText(headers['x-pulse-delivery-id'], 120);
  if (!deliveryId) return { status: 400, body: { error: 'missing_delivery_id' } };
  const payloadSha256 = sha256(rawBody);
  if (idempotencyStore?.claim) {
    const claimed = await idempotencyStore.claim(deliveryId, { event: headers['x-pulse-event'] || null, payloadSha256 });
    if (!claimed) return { status: 204, duplicate: true };
  } else if (await idempotencyStore?.has(deliveryId)) return { status: 204, duplicate: true };
  // Everything from here on is wrapped together: a malformed payload, an unmapped/invalid event, or an
  // unexpected store failure must all land in the same place — the delivery marked 'failed' so the same
  // delivery_id can be re-claimed and retried once the cause is fixed, never left stuck at 'accepted'.
  try {
    const payload = JSON.parse(rawBody.toString('utf8'));
    const mapped = mapChariowPulse(payload, headers, config);
    if (!idempotencyStore?.claim) await idempotencyStore?.add(deliveryId, { event: mapped.event, receivedAt: new Date().toISOString(), payloadSha256 });
    if (mapped.kind === 'membership_transition') {
      await applyEvent?.(mapped);
      const monetizationEvent = MONETIZATION_EVENT_BY_PULSE[mapped.event];
      // Analytics is observational only — it must never affect the delivery's
      // outcome, so a failure here is swallowed rather than retried/alerted.
      if (monetizationEvent && trackEvent) {
        try {
          await trackEvent(monetizationEvent, mapped.userReference, {
            productId: mapped.productId,
            ...(mapped.event === 'license.expired' ? { reason: 'expired' } : {}),
            ...(mapped.event === 'license.revoked' ? { reason: 'revoked' } : {})
          });
        } catch { /* analytics must never affect billing */ }
      }
    }
    await idempotencyStore?.markProcessed?.(deliveryId, 'processed');
    return { status: 202, body: { accepted: true, kind: mapped.kind, event: mapped.event } };
  } catch (error) {
    await idempotencyStore?.markProcessed?.(deliveryId, 'failed');
    if (error instanceof SyntaxError) return { status: 400, body: { error: 'invalid_json' } };
    throw error;
  }
}

module.exports = {
  CHARIOW_API_BASE_URL,
  SUPPORTED_PULSE_EVENTS,
  MONETIZATION_EVENT_BY_PULSE,
  chariowConfigFromEnv,
  verifyChariowPulse,
  readRawBody,
  mapChariowPulse,
  createChariowCheckout,
  handleChariowPulse
};
