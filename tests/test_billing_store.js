'use strict';

const assert = require('node:assert/strict');
const { PostgrestBillingStore, ENTITLEMENTS, AUTOTRADER_ANALYSIS_ENTITLEMENT, DELIVERY_CLAIM_LEASE_MS } = require('../bff/src/billing-store');

const calls = [];
let membershipRows = [];
const fakeFetch = async (url, options) => {
  calls.push({ url, options });
  const body = options.body ? JSON.parse(options.body) : null;
  if (options.method === 'POST' && url.includes('dda_billing_deliveries')) return { ok: true, async text() { return JSON.stringify([body]); } };
  if (options.method === 'POST' && url.includes('dda_billing_memberships')) return { ok: true, async text() { return JSON.stringify([body]); } };
  if (options.method === 'PATCH') return { ok: true, async text() { return JSON.stringify([body]); } };
  if (options.method === 'GET' && url.includes('dda_billing_memberships')) return { ok: true, async text() { return JSON.stringify(membershipRows); } };
  if (options.method === 'GET') return { ok: true, async text() { return '[]'; } };
  if (options.method === 'DELETE') return { ok: true, async text() { return '[]'; } };
  throw new Error(`unexpected fake request: ${options.method} ${url}`);
};

(async () => {
  const asOf = new Date('2026-10-18T19:00:00.000Z');
  const store = new PostgrestBillingStore({
    supabaseUrl: 'https://project.supabase.co/',
    serviceRoleKey: 'service-role-secret',
    fetchImpl: fakeFetch,
    clock: () => asOf
  });
  assert.equal(await store.claim('pulse-delivery-1', { event: 'successful.sale' }), true);
  assert.match(calls[0].url, /\/rest\/v1\/dda_billing_deliveries$/);
  assert.equal(calls[0].options.headers.Authorization, 'Bearer service-role-secret');
  assert.match(calls[0].options.headers.Prefer, /ignore-duplicates/);

  const academyRow = await store.applyChariowTransition({
    kind: 'membership_transition', status: 'active', provider: 'chariow', event: 'successful.sale',
    userReference: '11111111-1111-4111-8111-111111111111', productId: 'prd_premium',
    externalId: 'sal_1', saleId: 'sal_1', licenseId: null,
    customer: { externalCustomerId: 'cus_1' }, occurredAt: '2026-10-14T20:00:00.000Z',
    entitlements: ENTITLEMENTS
  });
  assert.equal(academyRow.status, 'active');
  assert.equal(academyRow.source_occurred_at, '2026-10-14T20:00:00.000Z');
  assert.deepEqual(academyRow.entitlement_snapshot, ENTITLEMENTS);
  assert.match(calls[1].url, /dda_billing_memberships\?on_conflict=provider,external_id/);
  assert.equal(calls[1].options.headers.Prefer, 'resolution=merge-duplicates,return=representation');

  const autoRow = await store.applyChariowTransition({
    kind: 'membership_transition', status: 'active', provider: 'chariow', event: 'successful.sale',
    userReference: '11111111-1111-4111-8111-111111111111', productId: 'prd_autotrader',
    externalId: 'sal_auto', saleId: 'sal_auto', licenseId: null,
    customer: { externalCustomerId: 'cus_1' }, occurredAt: '2026-10-15T20:00:00.000Z',
    entitlements: [AUTOTRADER_ANALYSIS_ENTITLEMENT]
  });
  assert.deepEqual(autoRow.entitlement_snapshot, ['autotrader.analysis']);
  assert.equal(autoRow.entitlement_snapshot.includes('premium_track'), false);

  const revokedAt = '2026-10-18T19:10:00.000Z';
  const revokedRow = await store.applyChariowTransition({
    kind: 'membership_transition', status: 'revoked', provider: 'chariow', event: 'license.revoked',
    userReference: '11111111-1111-4111-8111-111111111111', productId: 'prd_autotrader',
    externalId: 'lic_auto_1', saleId: null, licenseId: 'lic_auto_1',
    customer: { externalCustomerId: 'cus_1' }, occurredAt: revokedAt, entitlements: []
  });
  assert.equal(revokedRow.status, 'revoked');
  assert.deepEqual(revokedRow.entitlement_snapshot, [], 'revoked membership must retain no entitlement snapshot');
  assert.equal(revokedRow.ends_at, revokedAt);
  const expiredRow = await store.applyChariowTransition({
    kind: 'membership_transition', status: 'expired', provider: 'chariow', event: 'license.expired',
    userReference: '11111111-1111-4111-8111-111111111111', productId: 'prd_autotrader',
    externalId: 'lic_auto_2', saleId: null, licenseId: 'lic_auto_2',
    customer: { externalCustomerId: 'cus_1' }, occurredAt: revokedAt, entitlements: []
  });
  assert.equal(expiredRow.status, 'expired');
  assert.deepEqual(expiredRow.entitlement_snapshot, []);
  assert.equal(expiredRow.ends_at, revokedAt);

  await store.markProcessed('pulse-delivery-1');
  assert.equal(calls.at(-1).options.method, 'PATCH');
  await assert.rejects(() => store.applyChariowTransition({ kind: 'membership_transition', status: 'active', userReference: 'not-a-uuid', productId: 'prd_premium', externalId: 'x', entitlements: ['premium_track'] }), /server-owned DDA UUID/);
  await assert.rejects(() => store.applyChariowTransition({ kind: 'membership_transition', status: 'active', userReference: '11111111-1111-4111-8111-111111111111', productId: 'prd_auto', externalId: 'x', entitlements: ['auto_admin'] }), /unknown entitlement/);
  await assert.rejects(() => store.applyChariowTransition({
    kind: 'membership_transition', status: 'active', userReference: '11111111-1111-4111-8111-111111111111',
    productId: 'prd_premium', externalId: 'sal_without_time', entitlements: ENTITLEMENTS
  }), /valid provider event timestamp/);

  membershipRows = [
    { provider: 'chariow', status: 'active', product_id: 'prd_autotrader', external_id: 'sal_auto', starts_at: '2026-10-15T00:00:00.000Z', ends_at: null, updated_at: '2026-10-17T00:00:00.000Z', entitlement_snapshot: ['autotrader.analysis'] },
    { provider: 'chariow', status: 'active', product_id: 'prd_premium', external_id: 'sal_academy', starts_at: '2026-10-14T00:00:00.000Z', ends_at: null, updated_at: '2026-10-16T00:00:00.000Z', entitlement_snapshot: ['premium_track', 'resources_premium'] },
    { provider: 'chariow', status: 'active', product_id: 'prd_expired', external_id: 'sal_expired', starts_at: '2026-10-01T00:00:00.000Z', ends_at: '2026-10-17T00:00:00.000Z', updated_at: '2026-10-17T12:00:00.000Z', entitlement_snapshot: ['certificate_preview'] },
    { provider: 'chariow', status: 'active', product_id: 'prd_future', external_id: 'sal_future', starts_at: '2026-10-19T00:00:00.000Z', ends_at: null, updated_at: '2026-10-18T00:00:00.000Z', entitlement_snapshot: ['advanced_modules'] },
    { provider: 'chariow', status: 'revoked', product_id: 'prd_revoked', external_id: 'lic_revoked', starts_at: '2026-10-01T00:00:00.000Z', ends_at: null, updated_at: '2026-10-18T00:00:00.000Z', entitlement_snapshot: [] }
  ];
  const snapshot = await store.getForUser('11111111-1111-4111-8111-111111111111');
  assert.deepEqual(snapshot.entitlements, ['autotrader.analysis', 'premium_track', 'resources_premium']);
  assert.equal(snapshot.memberships.length, 2, 'all valid active memberships are retained');
  assert.equal(snapshot.membership.external_id, 'sal_auto', 'the latest membership remains available for legacy consumers');
  assert.match(calls.at(-1).url, /status=eq\.active/);
  assert.doesNotMatch(calls.at(-1).url, /limit=1/, 'lookup must not hide separately purchased entitlements');
  await assert.rejects(() => store.getForUser('11111111-1111-4111-8111-111111111111', 'not-a-date'), /valid as-of timestamp/);
  await assert.rejects(() => store.getForUser('not-a-uuid'), /valid DDA UUID/);

  let existingDeliveryStatus = 'accepted';
  let existingReceivedAt = asOf.toISOString();
  const retryStore = new PostgrestBillingStore({
    supabaseUrl: 'https://project.supabase.co',
    serviceRoleKey: 'service-role-secret',
    fetchImpl: async (url, options) => {
      if (options.method === 'POST') return { ok: true, async text() { return '[]'; } };
      if (options.method === 'PATCH') {
        const body = JSON.parse(options.body);
        if (url.includes('processed_status=eq.failed') && existingDeliveryStatus === 'failed') {
          existingDeliveryStatus = 'accepted'; existingReceivedAt = body.received_at;
          return { ok: true, async text() { return JSON.stringify([body]); } };
        }
        if (url.includes('processed_status=eq.accepted')) {
          const cutoff = new URL(url).searchParams.get('received_at');
          if (existingDeliveryStatus === 'accepted' && new Date(existingReceivedAt) < new Date(cutoff.slice(3))) {
            existingReceivedAt = body.received_at;
            return { ok: true, async text() { return JSON.stringify([body]); } };
          }
        }
        return { ok: true, async text() { return '[]'; } };
      }
      throw new Error('unexpected retry test request');
    },
    clock: () => asOf
  });
  assert.equal(await retryStore.claim('stuck-delivery'), false, 'a recent accepted delivery must not be processed concurrently twice');
  existingDeliveryStatus = 'failed';
  const concurrentClaims = await Promise.all([retryStore.claim('stuck-delivery'), retryStore.claim('stuck-delivery')]);
  assert.deepEqual(concurrentClaims.sort(), [false, true], 'only one concurrent delivery retry can claim a failed delivery');
  existingDeliveryStatus = 'processed';
  assert.equal(await retryStore.claim('stuck-delivery'), false, 'processed delivery must remain idempotent');
  existingDeliveryStatus = 'accepted';
  existingReceivedAt = new Date(asOf.getTime() - DELIVERY_CLAIM_LEASE_MS - 1).toISOString();
  assert.equal(await retryStore.claim('stuck-delivery'), true, 'an accepted delivery can be recovered after its processing lease expires');
  assert.equal(existingReceivedAt, asOf.toISOString(), 'claim recovery refreshes the lease timestamp');
  console.log('Supabase Chariow billingStore entitlement contract: PASS');
})().catch(error => { console.error(error); process.exitCode = 1; });
