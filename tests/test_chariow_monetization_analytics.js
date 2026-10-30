'use strict';

// Lot I (DDA Product & Conversion Alignment Audit, §8) — the monetization
// chain (payment_succeeded / subscription_activated / subscription_cancelled)
// had zero analytics instrumentation: a status changed in the billing store,
// but nothing left a trace an external dashboard could measure. This covers
// both the mapping (chariow.js) and the server-side transport (analytics.js).

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { chariowConfigFromEnv, handleChariowPulse, MONETIZATION_EVENT_BY_PULSE } = require('../bff/src/chariow');
const { analyticsConfigFromEnv, trackServerEvent } = require('../bff/src/analytics');

assert.deepEqual(MONETIZATION_EVENT_BY_PULSE, {
  'successful.sale': 'payment_succeeded',
  'license.activated': 'subscription_activated',
  'license.expired': 'subscription_cancelled',
  'license.revoked': 'subscription_cancelled'
});
// No Chariow Pulse event maps to subscription_renewed — fabricating one from
// successful.sale would conflate a first purchase with a real renewal.
assert.equal(Object.values(MONETIZATION_EVENT_BY_PULSE).includes('subscription_renewed'), false);

const secret = 'whsec_test_secret';
const ddaUserId = '22222222-2222-4222-8222-222222222222';
const config = chariowConfigFromEnv({ CHARIOW_PREMIUM_PRODUCT_IDS: 'prd_premium' });

function sendPulse(body, { trackEvent, deliveryId = `delivery-${body.event}` } = {}) {
  const payload = Buffer.from(JSON.stringify(body));
  const sig = `sha256=${crypto.createHmac('sha256', secret).update(payload).digest('hex')}`;
  const seen = new Set();
  const store = {
    async claim(id) { if (seen.has(id)) return false; seen.add(id); return true; },
    async markProcessed() {}
  };
  return handleChariowPulse({
    headers: { 'x-chariow-signature': sig, 'x-pulse-event': body.event, 'x-pulse-delivery-id': deliveryId },
    async *[Symbol.asyncIterator]() { yield payload; }
  }, { secret, config, idempotencyStore: store, applyEvent: async () => {}, trackEvent });
}

function pulseBody(event, { key = 'sale', id = `${key}-1` } = {}) {
  return { event, product: { id: 'prd_premium' }, customer: { email: 'ada@example.com' }, [key]: { id, custom_metadata: { dda_user_id: ddaUserId } } };
}

(async () => {
  for (const [event, expectedName] of Object.entries(MONETIZATION_EVENT_BY_PULSE)) {
    const key = event.startsWith('license.') ? 'license' : 'sale';
    const calls = [];
    const res = await sendPulse(pulseBody(event, { key }), {
      trackEvent: async (name, distinctId, properties) => { calls.push({ name, distinctId, properties }); }
    });
    assert.equal(res.status, 202, `${event} must be accepted`);
    assert.equal(calls.length, 1, `${event} must fire exactly one monetization analytics event`);
    assert.equal(calls[0].name, expectedName);
    assert.equal(calls[0].distinctId, ddaUserId, 'the billing distinct id must be the real dda_user_id, not a pseudonymous visitorId');
    assert.equal(calls[0].properties.productId, 'prd_premium');
  }

  // license.expired and license.revoked share the same external event name
  // but must stay distinguishable by a `reason` property.
  const expiredCalls = [];
  await sendPulse(pulseBody('license.expired', { key: 'license' }), { trackEvent: async (n, d, p) => expiredCalls.push(p) });
  assert.equal(expiredCalls[0].reason, 'expired');

  const revokedCalls = [];
  await sendPulse(pulseBody('license.revoked', { key: 'license' }), { trackEvent: async (n, d, p) => revokedCalls.push(p) });
  assert.equal(revokedCalls[0].reason, 'revoked');

  // Events the Pulse map does not consider monetization-worthy (abandoned/failed
  // sale) must never reach trackEvent at all — no event name would be honest.
  const noMonetizationCalls = [];
  await sendPulse(pulseBody('abandoned.sale'), { trackEvent: async (...args) => noMonetizationCalls.push(args) });
  assert.equal(noMonetizationCalls.length, 0, 'abandoned.sale must never fire a monetization event');

  // trackEvent is entirely optional — existing callers that never pass it
  // (e.g. tests/test_p4_chariow_billing.js) must keep working unchanged.
  const resWithoutTracking = await sendPulse(pulseBody('successful.sale', { id: 'sale-no-tracking' }));
  assert.equal(resWithoutTracking.status, 202);

  // A trackEvent that throws must never affect the webhook's own response —
  // analytics is observational, it cannot be allowed to fail a real payment.
  const resThrowingTracker = await sendPulse(pulseBody('successful.sale', { id: 'sale-throwing-tracker' }), {
    trackEvent: async () => { throw new Error('posthog unreachable'); }
  });
  assert.equal(resThrowingTracker.status, 202, 'a failing analytics call must never turn a real billing event into an error');

  console.log('test_chariow_monetization_analytics.js: all assertions passed');
})();

// --- bff/src/analytics.js: the server-side transport itself ---

(async () => {
  assert.equal(await trackServerEvent('payment_succeeded', ddaUserId, {}, { config: { apiKey: null, host: 'https://example.invalid' } }), false, 'must no-op without an API key');
  assert.equal(await trackServerEvent('payment_succeeded', null, {}, { config: { apiKey: 'phc_test', host: 'https://example.invalid' } }), false, 'must no-op without a distinct id');

  const calls = [];
  const ok = await trackServerEvent('payment_succeeded', ddaUserId, { productId: 'prd_premium' }, {
    config: { apiKey: 'phc_test', host: 'https://posthog.example' },
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return { ok: true };
    }
  });
  assert.equal(ok, true);
  assert.equal(calls[0].url, 'https://posthog.example/capture/');
  const body = JSON.parse(calls[0].options.body);
  assert.equal(body.api_key, 'phc_test');
  assert.equal(body.event, 'payment_succeeded');
  assert.equal(body.distinct_id, ddaUserId);
  assert.deepEqual(body.properties, { productId: 'prd_premium' });

  const afterNetworkFailure = await trackServerEvent('payment_succeeded', ddaUserId, {}, {
    config: { apiKey: 'phc_test', host: 'https://posthog.example' },
    fetchImpl: async () => { throw new Error('network down'); }
  });
  assert.equal(afterNetworkFailure, false, 'a network failure must never throw out of trackServerEvent');

  const defaultConfig = analyticsConfigFromEnv({});
  assert.equal(defaultConfig.apiKey, null);
  assert.equal(defaultConfig.host, 'https://us.i.posthog.com');

  console.log('test_chariow_monetization_analytics.js: analytics transport assertions passed');
})();
