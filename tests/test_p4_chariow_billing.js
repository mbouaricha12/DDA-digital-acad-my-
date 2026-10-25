'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const {
  chariowConfigFromEnv,
  verifyChariowPulse,
  mapChariowPulse,
  createChariowCheckout,
  handleChariowPulse
} = require('../bff/src/chariow');

const root = path.resolve(__dirname, '..');
const contract = JSON.parse(fs.readFileSync(path.join(root, 'contracts', 'p4-chariow-billing-v1.json'), 'utf8'));
assert.equal(contract.contractVersion, 'p4-chariow-billing-v1');
assert.equal(contract.provider.signature.includes('HMAC-SHA256'), true);
assert.equal(contract.provider.idempotencyHeader, 'x-pulse-delivery-id');
assert.equal(contract.membershipModel.localPlanCannotGrantAccess, true);
assert.equal(contract.membershipModel.proofCannotGrantAccess, true);
for (const event of ['successful.sale', 'failed.sale', 'abandoned.sale', 'license.activated', 'license.expired', 'license.revoked']) {
  assert.ok(Object.hasOwn(contract.acceptedPulseEvents, event), `missing Pulse event ${event}`);
}

const secret = 'whsec_test_secret';
const ddaUserId = '11111111-1111-4111-8111-111111111111';
const raw = Buffer.from(`{"event":"successful.sale","product":{"id":"prd_premium"},"customer":{"email":"ada@example.com"},"sale":{"id":"sal_1","custom_metadata":{"dda_user_id":"${ddaUserId}"}}}`);
const signature = `sha256=${crypto.createHmac('sha256', secret).update(raw).digest('hex')}`;
assert.equal(verifyChariowPulse(raw, signature, secret), true);
assert.equal(verifyChariowPulse(Buffer.from(`${raw.toString()}\n`), signature, secret), false, 'HMAC must use untouched raw bytes');
assert.equal(verifyChariowPulse(raw, 'sha256=bad', secret), false);

const config = chariowConfigFromEnv({ CHARIOW_PREMIUM_PRODUCT_IDS: 'prd_premium' });
const active = mapChariowPulse(JSON.parse(raw.toString()), { 'x-pulse-delivery-id': 'del-1' }, config);
assert.equal(active.kind, 'membership_transition');
assert.equal(active.status, 'active');
assert.equal(active.entitlement, 'premium_track');
assert.equal(active.userReference, ddaUserId);

const unknownProduct = mapChariowPulse({ event: 'successful.sale', product: { id: 'prd_other' }, customer: { email: 'ada@example.com' }, sale: { id: 'sal-2' } }, {}, config);
assert.equal(unknownProduct.kind, 'ignored');
assert.equal(unknownProduct.reason, 'product_not_mapped');

const emailOnly = mapChariowPulse({ event: 'successful.sale', product: { id: 'prd_premium' }, customer: { email: 'ada@example.com' }, sale: { id: 'sal-email-only' } }, {}, config);
assert.equal(emailOnly.kind, 'ignored');
assert.equal(emailOnly.reason, 'missing_dda_user_reference', 'a customer email alone must never map to a transition');

const invalidUserId = mapChariowPulse({ event: 'successful.sale', product: { id: 'prd_premium' }, customer: { email: 'ada@example.com' }, sale: { id: 'sal-bad-id', custom_metadata: { dda_user_id: 'not-a-uuid' } } }, {}, config);
assert.equal(invalidUserId.kind, 'ignored');
assert.equal(invalidUserId.reason, 'missing_dda_user_reference', 'a malformed dda_user_id must be rejected, not just a missing one');

const missingProviderReference = mapChariowPulse({ event: 'successful.sale', product: { id: 'prd_premium' }, customer: { email: 'ada@example.com' }, sale: { custom_metadata: { dda_user_id: ddaUserId } } }, {}, config);
assert.equal(missingProviderReference.kind, 'ignored');
assert.equal(missingProviderReference.reason, 'missing_provider_reference', 'a delivery with no sale.id or license.id must be rejected before persistence');

const licenseMetadata = mapChariowPulse({ event: 'license.activated', product: { id: 'prd_premium' }, customer: { email: 'ada@example.com' }, license: { id: 'lic-1', custom_metadata: { dda_user_id: ddaUserId } } }, {}, config);
assert.equal(licenseMetadata.kind, 'membership_transition', 'license.custom_metadata must be read, not only sale.custom_metadata');
assert.equal(licenseMetadata.userReference, ddaUserId);

for (const event of ['failed.sale', 'abandoned.sale']) {
  const result = mapChariowPulse({ event, product: { id: 'prd_premium' }, customer: { email: 'ada@example.com' }, sale: { id: `sal-${event}`, custom_metadata: { dda_user_id: ddaUserId } } }, {}, config);
  assert.equal(result.kind, 'membership_transition');
  assert.equal(result.entitlement, null, `${event} must never grant Premium`);
  assert.equal(result.status, event === 'failed.sale' ? 'pending' : 'pending');
}

const calls = [];
const checkoutInput = { productId: 'prd_premium', email: 'Ada@Example.com', firstName: 'Ada', lastName: 'Lovelace', phone: { number: '+33 6 12 34 56 78', countryCode: 'fr' }, customMetadata: { dda_user_id: ddaUserId } };
createChariowCheckout({ config: { ...config, apiKey: 'sk_test_server_only' }, input: checkoutInput, fetchImpl: async (url, options) => {
  calls.push({ url, options });
  return { ok: true, status: 200, async json() { return { data: { step: 'payment', purchase: { id: 'sal_checkout' }, payment: { checkout_url: 'https://pay.chariow.test/checkout' } } }; } };
} }).then(async result => {
  assert.equal(result.step, 'payment');
  assert.equal(result.checkoutUrl, 'https://pay.chariow.test/checkout');
  assert.equal(calls[0].url, 'https://api.chariow.com/v1/checkout');
  assert.equal(calls[0].options.headers.Authorization, 'Bearer sk_test_server_only');
  const body = JSON.parse(calls[0].options.body);
  assert.equal(body.email, 'ada@example.com');
  assert.equal(body.phone.number, '33612345678');
  assert.equal(body.phone.country_code, 'FR');
  assert.equal(Object.hasOwn(body, 'apiKey'), false);
  await assert.rejects(
    () => createChariowCheckout({ config: { ...config, apiKey: 'sk_test_server_only' }, input: { ...checkoutInput, productId: 'prd_not_allowlisted' }, fetchImpl: async () => { throw new Error('provider must not be called'); } }),
    /product_not_allowlisted/,
    'checkout must reject a non-allowlisted product before calling the provider'
  );
  await assert.rejects(
    () => createChariowCheckout({ config: { ...config, apiKey: 'sk_test_server_only' }, input: { ...checkoutInput, customMetadata: {} }, fetchImpl: async () => { throw new Error('provider must not be called'); } }),
    /dda_user_id_required/,
    'checkout must reject a missing/invalid dda_user_id before calling the provider'
  );
}).then(async () => {
  const seen = new Set();
  const applied = [];
  const req = async body => {
    const payload = Buffer.from(JSON.stringify(body));
    const sig = `sha256=${crypto.createHmac('sha256', secret).update(payload).digest('hex')}`;
    return handleChariowPulse({ headers: { 'x-chariow-signature': sig, 'x-pulse-event': body.event, 'x-pulse-delivery-id': 'delivery-1' }, async *[Symbol.asyncIterator]() { yield payload; } }, {
      secret,
      config,
      idempotencyStore: { async has(id) { return seen.has(id); }, async add(id) { seen.add(id); } },
      applyEvent: async event => applied.push(event)
    });
  };
  const first = await req({ event: 'successful.sale', product: { id: 'prd_premium' }, customer: { email: 'ada@example.com' }, sale: { id: 'sal-1', custom_metadata: { dda_user_id: ddaUserId } } });
  assert.equal(first.status, 202);
  assert.equal(applied.length, 1);
  const duplicate = await req({ event: 'successful.sale', product: { id: 'prd_premium' }, customer: { email: 'ada@example.com' }, sale: { id: 'sal-1', custom_metadata: { dda_user_id: ddaUserId } } });
  assert.equal(duplicate.status, 204);
  assert.equal(applied.length, 1, 'duplicate delivery must not reapply entitlement transition');
  console.log('P4 Chariow billing contract: PASS');
}).catch(error => { console.error(error); process.exitCode = 1; });

// Production wiring (bff/src/handler.js, shared by the local server and the Vercel
// entry point) always passes a claim()/markProcessed() store, never the
// simpler has()/add() one exercised above. The scenarios below mirror that real code path and the
// explicit webhook-reliability invariants from the P0 audit: a failed transition must be recorded,
// the same delivery_id must be retryable after the cause is fixed, a retry must not double-grant,
// and two concurrent deliveries of the same event must not both win the claim.
(async () => {
  // A synchronous fake table: no internal `await` before the state mutation, so two claim() calls
  // issued back-to-back (Promise.all) interleave exactly like two concurrent requests hitting the
  // same Postgres row — only one can observe-and-flip the state first.
  function makeFakeDeliveryStore() {
    const table = new Map();
    return {
      table,
      async claim(deliveryId, metadata = {}) {
        const existing = table.get(deliveryId);
        if (!existing) {
          table.set(deliveryId, { processed_status: 'accepted', event_name: metadata.event || null, processed_at: null });
          return true;
        }
        if (existing.processed_status !== 'failed') return false;
        existing.processed_status = 'accepted';
        existing.processed_at = null;
        return true;
      },
      async markProcessed(deliveryId, status) {
        const row = table.get(deliveryId);
        if (row) { row.processed_status = status; row.processed_at = new Date().toISOString(); }
      }
    };
  }

  function sign(body) {
    const payload = Buffer.from(JSON.stringify(body));
    return { payload, signature: `sha256=${crypto.createHmac('sha256', secret).update(payload).digest('hex')}` };
  }

  function sendPulse(store, body, { deliveryId = 'delivery-reliability-1', applyEvent, badSignature = false } = {}) {
    const { payload, signature } = sign(body);
    return handleChariowPulse({
      headers: {
        'x-chariow-signature': badSignature ? 'sha256=deadbeef' : signature,
        'x-pulse-event': body.event,
        'x-pulse-delivery-id': deliveryId
      },
      async *[Symbol.asyncIterator]() { yield payload; }
    }, { secret, config, idempotencyStore: store, applyEvent });
  }

  const salePayload = (overrides = {}) => ({
    event: 'successful.sale', product: { id: 'prd_premium' }, customer: { email: 'ada@example.com' },
    sale: { id: 'sal-reliability-1', custom_metadata: { dda_user_id: overrides.dda_user_id } }
  });

  // 1 + 8: an invalid signature is rejected before any claim/applyEvent is touched.
  {
    const store = makeFakeDeliveryStore();
    let applyCalls = 0;
    const res = await sendPulse(store, salePayload({ dda_user_id: '11111111-1111-4111-8111-111111111111' }), {
      badSignature: true, applyEvent: async () => { applyCalls += 1; }
    });
    assert.equal(res.status, 401);
    assert.equal(applyCalls, 0, 'an invalid signature must never reach applyEvent');
    assert.equal(store.table.size, 0, 'an invalid signature must never claim a delivery row');
  }

  // An invalid dda_user_id is now rejected as early as the mapping stage (mapChariowPulse), before
  // applyEvent is ever reached — it is accepted-and-ignored (202, kind 'ignored'), not an error.
  {
    const store = makeFakeDeliveryStore();
    let applyCalls = 0;
    const deliveryId = 'delivery-reliability-invalid-metadata';
    const res = await sendPulse(store, salePayload({ dda_user_id: 'not-a-uuid' }), { deliveryId, applyEvent: async () => { applyCalls += 1; } });
    assert.equal(res.status, 202);
    assert.equal(res.body.kind, 'ignored');
    assert.equal(applyCalls, 0, 'an invalid dda_user_id must never reach applyEvent');
    assert.equal(store.table.get(deliveryId).processed_status, 'processed', 'an ignored (non-transition) delivery is marked processed, not failed');
  }

  // 3 + 4: a genuine transition failure (e.g. a transient store conflict unrelated to metadata, since
  // metadata is now validated upstream) must be recorded as 'failed', not left stuck at 'accepted',
  // and the error must still propagate (so the caller answers Chariow with a 5xx).
  {
    const store = makeFakeDeliveryStore();
    const granted = [];
    let attempts = 0;
    const applyEventFlaky = async event => {
      attempts += 1;
      if (attempts === 1) throw new Error('transient_store_conflict');
      granted.push(event);
    };
    const deliveryId = 'delivery-reliability-2';
    const body = salePayload({ dda_user_id: '11111111-1111-4111-8111-111111111111' });
    await assert.rejects(
      () => sendPulse(store, body, { deliveryId, applyEvent: applyEventFlaky }),
      /transient_store_conflict/,
      'a transition failure must propagate, not be swallowed as a successful 2xx'
    );
    assert.equal(store.table.get(deliveryId).processed_status, 'failed', 'a failed transition must be recorded explicitly as failed');
    assert.equal(granted.length, 0, 'no entitlement may be granted on a failed transition');

    // 5 + 6: once the cause is fixed, the SAME delivery_id must be retryable and must grant exactly once.
    const retry = await sendPulse(store, body, { deliveryId, applyEvent: applyEventFlaky });
    assert.equal(retry.status, 202, 'a corrected retry of a previously-failed delivery must be accepted, not deduplicated');
    assert.equal(granted.length, 1, 'the retry must grant the entitlement exactly once');
    assert.equal(store.table.get(deliveryId).processed_status, 'processed', 'a successful retry is marked processed');

    // 2: a further repeat of the now-accepted delivery must still be deduplicated, never reapplied.
    const repeat = await sendPulse(store, body, { deliveryId, applyEvent: applyEventFlaky });
    assert.equal(repeat.status, 204);
    assert.equal(granted.length, 1, 'a delivery already accepted/processed must never be reapplied');
  }

  // 9: an unexpected error distinct from the known invalid-metadata case (e.g. a store outage) must be
  // caught the same way — marked failed, rethrown, no partial/implicit success.
  {
    const store = makeFakeDeliveryStore();
    const deliveryId = 'delivery-reliability-3';
    await assert.rejects(
      () => sendPulse(store, salePayload({ dda_user_id: '22222222-2222-4222-8222-222222222222' }), {
        deliveryId, applyEvent: async () => { throw new Error('temporary_store_unavailable'); }
      }),
      /temporary_store_unavailable/
    );
    assert.equal(store.table.get(deliveryId).processed_status, 'failed', 'an unexpected store error must also be recorded as failed, not silently dropped');
  }

  // A malformed JSON body (after a valid signature and a successful claim) must also be recorded as
  // 'failed' and retryable — not just an applyEvent failure. It must still answer 400, not 5xx.
  {
    const store = makeFakeDeliveryStore();
    const deliveryId = 'delivery-reliability-invalid-json';
    const malformed = Buffer.from('{not valid json');
    const sig = `sha256=${crypto.createHmac('sha256', secret).update(malformed).digest('hex')}`;
    const res = await handleChariowPulse({
      headers: { 'x-chariow-signature': sig, 'x-pulse-event': 'successful.sale', 'x-pulse-delivery-id': deliveryId },
      async *[Symbol.asyncIterator]() { yield malformed; }
    }, { secret, config, idempotencyStore: store, applyEvent: async () => { throw new Error('must not be called for invalid JSON'); } });
    assert.equal(res.status, 400);
    assert.equal(res.body.error, 'invalid_json');
    assert.equal(store.table.get(deliveryId).processed_status, 'failed', 'invalid JSON must still mark the delivery failed and retryable');
  }

  // 7: two concurrent deliveries of a brand-new event must not both win the claim (no double grant).
  {
    const store = makeFakeDeliveryStore();
    const deliveryId = 'delivery-reliability-concurrent';
    let grants = 0;
    const applyEvent = async () => { grants += 1; };
    const body = salePayload({ dda_user_id: '33333333-3333-4333-8333-333333333333' });
    const [first, second] = await Promise.all([
      sendPulse(store, body, { deliveryId, applyEvent }),
      sendPulse(store, body, { deliveryId, applyEvent })
    ]);
    const statuses = [first.status, second.status].sort();
    assert.deepEqual(statuses, [202, 204], 'exactly one concurrent delivery must be accepted, the other deduplicated');
    assert.equal(grants, 1, 'concurrent deliveries of the same event must never grant entitlement twice');
  }

  console.log('P4 Chariow billing — webhook reliability (claim/markProcessed path): PASS');
})().catch(error => { console.error(error); process.exitCode = 1; });
