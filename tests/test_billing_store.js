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
  await assert.rejects(() => store.applyChariowTransition({ kind: 'membership_transition', status: 'active', userReference: 'not-a-uuid', productId: 'prd_premium', externalId: 'x' }), /server-owned DDA UUID/);
  console.log('Supabase Chariow billingStore contract: PASS');
})().catch(error => { console.error(error); process.exitCode = 1; });

// claim() retry-after-failure semantics (P0 webhook reliability fix). A fake PostgREST that actually
// tracks row state per delivery_id — unlike the always-echo fake above — so the INSERT ignore-duplicates
// conflict path and the conditional retry PATCH (?processed_status=eq.failed) are both exercised for real.
(async () => {
  function makeStatefulFakeFetch() {
    const rows = new Map();
    async function fetchImpl(url, options) {
      const parsed = new URL(url);
      const isDeliveries = parsed.pathname.endsWith('/dda_billing_deliveries');
      if (!isDeliveries) throw new Error(`unexpected fake request: ${options.method} ${url}`);
      const body = options.body ? JSON.parse(options.body) : null;
      if (options.method === 'POST') {
        if (rows.has(body.delivery_id)) return { ok: true, async text() { return '[]'; } };
        rows.set(body.delivery_id, { ...body });
        return { ok: true, async text() { return JSON.stringify([rows.get(body.delivery_id)]); } };
      }
      if (options.method === 'PATCH') {
        const deliveryId = decodeURIComponent(String(parsed.searchParams.get('delivery_id') || '').replace(/^eq\./, ''));
        const requiredStatus = parsed.searchParams.get('processed_status');
        const row = rows.get(deliveryId);
        if (!row) return { ok: true, async text() { return '[]'; } };
        if (requiredStatus && row.processed_status !== requiredStatus.replace(/^eq\./, '')) {
          return { ok: true, async text() { return '[]'; } };
        }
        Object.assign(row, body);
        return { ok: true, async text() { return JSON.stringify([row]); } };
      }
      throw new Error(`unexpected fake request: ${options.method} ${url}`);
    }
    return { fetchImpl, rows };
  }

  const { fetchImpl, rows } = makeStatefulFakeFetch();
  const store = new PostgrestBillingStore({ supabaseUrl: 'https://project.supabase.co/', serviceRoleKey: 'service-role-secret', fetchImpl });

  assert.equal(await store.claim('d-1', { event: 'successful.sale' }), true, 'a brand-new delivery must be claimed');
  assert.equal(await store.claim('d-1', { event: 'successful.sale' }), false, 'a delivery still accepted (in flight / concurrent duplicate) must not be re-claimed');

  await store.markProcessed('d-1', 'failed');
  assert.equal(rows.get('d-1').processed_status, 'failed');
  assert.equal(await store.claim('d-1', { event: 'successful.sale' }), true, 'a previously-failed delivery must be re-claimable after the cause is fixed');
  assert.equal(rows.get('d-1').processed_status, 'accepted', 'a successful retry claim resets the row to accepted for reprocessing');

  await store.markProcessed('d-1', 'processed');
  assert.equal(await store.claim('d-1', { event: 'successful.sale' }), false, 'an already-processed delivery must stay deduplicated forever, never reprocessable');

  const [first, second] = await Promise.all([store.claim('d-2', { event: 'successful.sale' }), store.claim('d-2', { event: 'successful.sale' })]);
  assert.deepEqual([first, second].sort(), [false, true], 'two concurrent claims of a brand-new delivery must not both succeed');

  console.log('Supabase Chariow billingStore — retry-after-failure claim(): PASS');
})().catch(error => { console.error(error); process.exitCode = 1; });
