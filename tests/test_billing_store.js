'use strict';

const assert = require('node:assert/strict');
const { PostgrestBillingStore, ENTITLEMENTS } = require('../bff/src/billing-store');

const calls = [];
const fakeFetch = async (url, options) => {
  calls.push({ url, options });
  const body = options.body ? JSON.parse(options.body) : null;
  if (options.method === 'POST' && url.includes('dda_billing_deliveries')) return { ok: true, async text() { return JSON.stringify([body]); } };
  if (options.method === 'POST' && url.includes('dda_billing_memberships')) return { ok: true, async text() { return JSON.stringify([body]); } };
  if (options.method === 'PATCH') return { ok: true, async text() { return JSON.stringify([body]); } };
  if (options.method === 'GET') return { ok: true, async text() { return '[]'; } };
  throw new Error(`unexpected fake request: ${options.method} ${url}`);
};

(async () => {
  const store = new PostgrestBillingStore({ supabaseUrl: 'https://project.supabase.co/', serviceRoleKey: 'service-role-secret', fetchImpl: fakeFetch });
  assert.equal(await store.claim('pulse-delivery-1', { event: 'successful.sale' }), true);
  assert.match(calls[0].url, /\/rest\/v1\/dda_billing_deliveries$/);
  assert.equal(calls[0].options.headers.Authorization, 'Bearer service-role-secret');
  assert.match(calls[0].options.headers.Prefer, /ignore-duplicates/);

  const row = await store.applyChariowTransition({
    kind: 'membership_transition', status: 'active', provider: 'chariow', event: 'successful.sale',
    userReference: '11111111-1111-4111-8111-111111111111', productId: 'prd_premium',
    externalId: 'sal_1', saleId: 'sal_1', licenseId: null,
    customer: { externalCustomerId: 'cus_1' }, occurredAt: '2026-10-14T20:00:00.000Z'
  });
  assert.equal(row.status, 'active');
  assert.deepEqual(row.entitlement_snapshot, ENTITLEMENTS);
  assert.match(calls[1].url, /dda_billing_memberships\?on_conflict=provider,external_id/);
  assert.equal(calls[1].options.headers.Prefer, 'resolution=merge-duplicates,return=representation');

  await store.markProcessed('pulse-delivery-1');
  assert.equal(calls[2].options.method, 'PATCH');
  const retryCalls = [];
  const retryStore = new PostgrestBillingStore({
    supabaseUrl: 'https://project.supabase.co/',
    serviceRoleKey: 'service-role-secret',
    fetchImpl: async (url, options) => {
      retryCalls.push({ url, options });
      if (options.method === 'POST') return { ok: true, async text() { return '[]'; } };
      if (options.method === 'GET') return { ok: true, async text() { return JSON.stringify([{ processed_status: 'failed' }]); } };
      if (options.method === 'PATCH') return { ok: true, async text() { return '[]'; } };
      throw new Error(`unexpected retry request: ${options.method} ${url}`);
    }
  });
  assert.equal(await retryStore.claim('pulse-failed-1', { event: 'successful.sale', payloadSha256: 'a'.repeat(64) }), true);
  assert.equal(retryCalls[0].options.method, 'POST');
  assert.equal(retryCalls[1].options.method, 'GET');
  assert.equal(retryCalls[2].options.method, 'PATCH');
  assert.match(retryCalls[2].options.body, /"processed_status":"accepted"/);
  await assert.rejects(() => store.applyChariowTransition({ kind: 'membership_transition', status: 'active', userReference: 'not-a-uuid', productId: 'prd_premium', externalId: 'x' }), /server-owned DDA UUID/);
  console.log('Supabase Chariow billingStore contract: PASS');
})().catch(error => { console.error(error); process.exitCode = 1; });
