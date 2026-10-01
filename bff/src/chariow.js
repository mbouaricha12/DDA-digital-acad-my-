'use strict';

const crypto = require('node:crypto');
const { normalizeEmail } = require('./security');

const CHARIOW_API_BASE_URL = 'https://api.chariow.com/v1';
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
  const metadata = payload.sale?.custom_metadata;
  return metadata && typeof metadata === 'object' && !Array.isArray(metadata) ? metadata : {};
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
  if (!customer.email && !metadata.dda_user_id) return { kind: 'ignored', reason: 'missing_customer_reference', event, productId, externalId };

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
    userReference: safeText(metadata.dda_user_id, 100) || null,
    entitlement: status === 'active' ? 'premium_track' : null,
    occurredAt: safeText(payload.sale?.completed_at || payload.license?.activated_at || payload.license?.expired_at || payload.license?.revoked_at, 50) || null,
    deliveryId: safeText(headers['x-pulse-delivery-id'], 120) || null
  };
}

async function createChariowCheckout({ config = chariowConfigFromEnv(), fetchImpl = fetch, input }) {
  if (!config.apiKey) throw new Error('CHARIOW_API_KEY is required on the server');
  if (!input || typeof input !== 'object') throw new Error('checkout input is required');
  const body = {
    product_id: safeText(input.productId, 100),
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

async function handleChariowPulse(req, { secret, idempotencyStore, applyEvent, config } = {}) {
  const rawBody = await readRawBody(req);
  const headers = {
    'x-chariow-signature': req.headers['x-chariow-signature'],
    'x-pulse-event': req.headers['x-pulse-event'],
    'x-pulse-delivery-id': req.headers['x-pulse-delivery-id']
  };
  if (!verifyChariowPulse(rawBody, headers['x-chariow-signature'], secret)) return { status: 401, body: { error: 'invalid_signature' } };
  const deliveryId = safeText(headers['x-pulse-delivery-id'], 120);
  if (!deliveryId) return { status: 400, body: { error: 'missing_delivery_id' } };
  if (await idempotencyStore?.has(deliveryId)) return { status: 204, duplicate: true };
  let payload;
  try { payload = JSON.parse(rawBody.toString('utf8')); } catch { return { status: 400, body: { error: 'invalid_json' } }; }
  const mapped = mapChariowPulse(payload, headers, config);
  await idempotencyStore?.add(deliveryId, { event: mapped.event, receivedAt: new Date().toISOString() });
  if (mapped.kind === 'membership_transition') await applyEvent?.(mapped);
  return { status: 202, body: { accepted: true, kind: mapped.kind, event: mapped.event } };
}

module.exports = {
  CHARIOW_API_BASE_URL,
  SUPPORTED_PULSE_EVENTS,
  chariowConfigFromEnv,
  verifyChariowPulse,
  readRawBody,
  mapChariowPulse,
  createChariowCheckout,
  handleChariowPulse
};
