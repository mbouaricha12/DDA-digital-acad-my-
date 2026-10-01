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
const raw = Buffer.from('{"event":"successful.sale","product":{"id":"prd_premium"},"customer":{"email":"ada@example.com"},"sale":{"id":"sal_1","custom_metadata":{"dda_user_id":"user-1"}}}');
const signature = `sha256=${crypto.createHmac('sha256', secret).update(raw).digest('hex')}`;
assert.equal(verifyChariowPulse(raw, signature, secret), true);
assert.equal(verifyChariowPulse(Buffer.from(`${raw.toString()}\n`), signature, secret), false, 'HMAC must use untouched raw bytes');
assert.equal(verifyChariowPulse(raw, 'sha256=bad', secret), false);

const config = chariowConfigFromEnv({ CHARIOW_PREMIUM_PRODUCT_IDS: 'prd_premium' });
const active = mapChariowPulse(JSON.parse(raw.toString()), { 'x-pulse-delivery-id': 'del-1' }, config);
assert.equal(active.kind, 'membership_transition');
assert.equal(active.status, 'active');
assert.equal(active.entitlement, 'premium_track');
assert.equal(active.userReference, 'user-1');

const unknownProduct = mapChariowPulse({ event: 'successful.sale', product: { id: 'prd_other' }, customer: { email: 'ada@example.com' }, sale: { id: 'sal-2' } }, {}, config);
assert.equal(unknownProduct.kind, 'ignored');
assert.equal(unknownProduct.reason, 'product_not_mapped');

for (const event of ['failed.sale', 'abandoned.sale']) {
  const result = mapChariowPulse({ event, product: { id: 'prd_premium' }, customer: { email: 'ada@example.com' }, sale: { id: `sal-${event}` } }, {}, config);
  assert.equal(result.kind, 'membership_transition');
  assert.equal(result.entitlement, null, `${event} must never grant Premium`);
  assert.equal(result.status, event === 'failed.sale' ? 'pending' : 'pending');
}

const calls = [];
const checkoutInput = { productId: 'prd_premium', email: 'Ada@Example.com', firstName: 'Ada', lastName: 'Lovelace', phone: { number: '+33 6 12 34 56 78', countryCode: 'fr' }, customMetadata: { dda_user_id: 'user-1' } };
createChariowCheckout({ config: { ...config, apiKey: 'sk_test_server_only' }, input: checkoutInput, fetchImpl: async (url, options) => {
  calls.push({ url, options });
  return { ok: true, status: 200, async json() { return { data: { step: 'payment', purchase: { id: 'sal_checkout' }, payment: { checkout_url: 'https://pay.chariow.test/checkout' } } }; } };
} }).then(result => {
  assert.equal(result.step, 'payment');
  assert.equal(result.checkoutUrl, 'https://pay.chariow.test/checkout');
  assert.equal(calls[0].url, 'https://api.chariow.com/v1/checkout');
  assert.equal(calls[0].options.headers.Authorization, 'Bearer sk_test_server_only');
  const body = JSON.parse(calls[0].options.body);
  assert.equal(body.email, 'ada@example.com');
  assert.equal(body.phone.number, '33612345678');
  assert.equal(body.phone.country_code, 'FR');
  assert.equal(Object.hasOwn(body, 'apiKey'), false);
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
  const first = await req({ event: 'successful.sale', product: { id: 'prd_premium' }, customer: { email: 'ada@example.com' }, sale: { id: 'sal-1' } });
  assert.equal(first.status, 202);
  assert.equal(applied.length, 1);
  const duplicate = await req({ event: 'successful.sale', product: { id: 'prd_premium' }, customer: { email: 'ada@example.com' }, sale: { id: 'sal-1' } });
  assert.equal(duplicate.status, 204);
  assert.equal(applied.length, 1, 'duplicate delivery must not reapply entitlement transition');
  console.log('P4 Chariow billing contract: PASS');
}).catch(error => { console.error(error); process.exitCode = 1; });
