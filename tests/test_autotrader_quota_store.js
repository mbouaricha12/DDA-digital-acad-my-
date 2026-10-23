'use strict';

const assert = require('node:assert/strict');
const { PostgrestQuotaStore } = require('../bff/src/quota-store');
const { quotaPolicyFromEnv } = require('../bff/src/quota-policy');

(async () => {
  const calls = [];
  let responseBody = { allowed: true };
  let responseOk = true;
  const store = new PostgrestQuotaStore({
    supabaseUrl: 'https://project.supabase.co/',
    serviceRoleKey: 'service-role-secret',
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return { ok: responseOk, async text() { return JSON.stringify(responseBody); } };
    }
  });
  const asOf = new Date('2026-10-18T19:30:00.000Z');
  const policy = quotaPolicyFromEnv({ DDA_AUTOTRADER_PROVIDER_ID: 'vendor-a' });
  const userResult = await store.reserveUserAnalysis({ userId: '11111111-1111-4111-8111-111111111111', asOf, policy });
  assert.deepEqual(userResult, { allowed: true });
  assert.match(calls[0].url, /\/rest\/v1\/rpc\/reserve_dda_autotrader_quota$/);
  assert.equal(calls[0].options.method, 'POST');
  assert.equal(calls[0].options.headers.Authorization, 'Bearer service-role-secret');
  const userPayload = JSON.parse(calls[0].options.body).p_reservations;
  assert.equal(userPayload.length, 3);
  assert.deepEqual(userPayload.map(bucket => bucket.limit_units), [10, 50, 200]);

  const providerResult = await store.reserveProviderUsage({ providerId: 'vendor-a', units: 3, asOf, policy });
  assert.deepEqual(providerResult, { allowed: true });
  const providerPayload = JSON.parse(calls[1].options.body).p_reservations;
  assert.equal(providerPayload.length, 3);
  assert.ok(providerPayload.every(bucket => bucket.scope_type === 'provider' && bucket.scope_id === 'vendor-a'));
  assert.deepEqual(providerPayload.map(bucket => bucket.metric), ['provider_request', 'provider_request', 'provider_units']);

  const combinedResult = await store.reserveUserProviderAnalysis({ userId: '11111111-1111-4111-8111-111111111111', providerId: 'vendor-a', units: 1, asOf, policy });
  assert.deepEqual(combinedResult, { allowed: true });
  const combinedPayload = JSON.parse(calls[2].options.body).p_reservations;
  assert.equal(combinedPayload.length, 6);
  assert.deepEqual(combinedPayload.slice(0, 3).map(bucket => bucket.scope_type), ['user', 'user', 'user']);
  assert.deepEqual(combinedPayload.slice(3).map(bucket => bucket.scope_type), ['provider', 'provider', 'provider']);
  assert.deepEqual(combinedPayload.slice(3).map(bucket => bucket.metric), ['provider_request', 'provider_request', 'provider_units']);

  responseBody = { allowed: false, scope_type: 'provider', metric: 'provider_request', retry_at: '2026-10-18T19:31:00.000Z' };
  assert.equal((await store.reserveProviderUsage({ providerId: 'vendor-a', units: 1, asOf, policy })).allowed, false);
  responseOk = false;
  await assert.rejects(() => store.reserveUserAnalysis({ userId: '11111111-1111-4111-8111-111111111111', asOf, policy }), error => error.status === 503);
  await assert.rejects(() => store.reserveProviderUsage({ providerId: 'vendor-b', units: 1, asOf, policy }), error => error.code === 'provider_not_configured');
  console.log('AutoTrader quota store tests: PASS');
})().catch(error => { console.error(error); process.exitCode = 1; });
