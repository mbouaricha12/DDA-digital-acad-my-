'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { DEFAULT_QUOTA_POLICY, quotaPolicyFromEnv, validateProviderQuotaBinding, utcWindow, userAnalysisReservations, providerUsageReservations } = require('../bff/src/quota-policy');

const root = path.resolve(__dirname, '..');
const contract = JSON.parse(fs.readFileSync(path.join(root, 'contracts/autotrader/quota-policy-v1.json'), 'utf8'));
const defaultPolicy = quotaPolicyFromEnv({});
assert.deepEqual(defaultPolicy, DEFAULT_QUOTA_POLICY);
assert.deepEqual({ perMinute: contract.userAnalysisLimits.perMinute, perHour: contract.userAnalysisLimits.perHour, perDay: contract.userAnalysisLimits.perDay }, {
  perMinute: defaultPolicy.userAnalysesPerMinute,
  perHour: defaultPolicy.userAnalysesPerHour,
  perDay: defaultPolicy.userAnalysesPerDay
});
assert.deepEqual({ perMinute: contract.providerGlobalLimits.requestsPerMinute, perDay: contract.providerGlobalLimits.requestsPerDay, monthlyUnits: contract.providerGlobalLimits.providerUsageUnitsPerMonth }, {
  perMinute: defaultPolicy.providerRequestsPerMinute,
  perDay: defaultPolicy.providerRequestsPerDay,
  monthlyUnits: defaultPolicy.providerUnitsPerMonth
});

const configured = quotaPolicyFromEnv({
  DDA_AUTOTRADER_USER_ANALYSES_PER_MINUTE: '4',
  DDA_AUTOTRADER_USER_ANALYSES_PER_HOUR: '15',
  DDA_AUTOTRADER_USER_ANALYSES_PER_DAY: '60',
  DDA_AUTOTRADER_PROVIDER_ID: 'market-feed-one',
  DDA_AUTOTRADER_PROVIDER_REQUESTS_PER_MINUTE: '7',
  DDA_AUTOTRADER_PROVIDER_REQUESTS_PER_DAY: '120',
  DDA_AUTOTRADER_PROVIDER_UNITS_PER_MONTH: '2400'
});
assert.equal(configured.providerId, 'market-feed-one');
assert.equal(configured.userAnalysesPerDay, 60);
assert.deepEqual(validateProviderQuotaBinding('twelve-data', configured), ['DDA_AUTOTRADER_PROVIDER_ID must match the configured market data provider']);
assert.deepEqual(validateProviderQuotaBinding('twelve-data', quotaPolicyFromEnv({ DDA_AUTOTRADER_PROVIDER_ID: 'twelve-data' })), []);
assert.deepEqual(validateProviderQuotaBinding(null, defaultPolicy), []);
assert.throws(() => quotaPolicyFromEnv({ DDA_AUTOTRADER_USER_ANALYSES_PER_DAY: '0' }), /positive integer/);
assert.throws(() => quotaPolicyFromEnv({ DDA_AUTOTRADER_PROVIDER_ID: 'not a provider!' }), /invalid format/);
assert.throws(() => quotaPolicyFromEnv({ DDA_AUTOTRADER_USER_ANALYSES_PER_MINUTE: '11', DDA_AUTOTRADER_USER_ANALYSES_PER_HOUR: '10' }), /per-minute <= per-hour <= per-day/);
assert.throws(() => quotaPolicyFromEnv({ DDA_AUTOTRADER_PROVIDER_REQUESTS_PER_MINUTE: '201', DDA_AUTOTRADER_PROVIDER_REQUESTS_PER_DAY: '200' }), /per-minute <= per-day/);

const boundary = new Date('2026-12-31T23:59:59.999Z');
assert.deepEqual(utcWindow(boundary, 'minute'), { window_start: '2026-12-31T23:59:00.000Z', window_end: '2027-01-01T00:00:00.000Z' });
assert.deepEqual(utcWindow(boundary, 'hour'), { window_start: '2026-12-31T23:00:00.000Z', window_end: '2027-01-01T00:00:00.000Z' });
assert.deepEqual(utcWindow(boundary, 'day'), { window_start: '2026-12-31T00:00:00.000Z', window_end: '2027-01-01T00:00:00.000Z' });
assert.deepEqual(utcWindow(boundary, 'month'), { window_start: '2026-12-01T00:00:00.000Z', window_end: '2027-01-01T00:00:00.000Z' });
assert.throws(() => utcWindow('not-a-date', 'day'), /valid timestamp/);

const userId = '11111111-1111-4111-8111-111111111111';
const userBuckets = userAnalysisReservations(userId, boundary, defaultPolicy);
assert.equal(userBuckets.length, 3);
assert.deepEqual(userBuckets.map(item => item.scope_type), ['user', 'user', 'user']);
assert.deepEqual(userBuckets.map(item => item.limit_units), [10, 50, 200]);
assert.throws(() => userAnalysisReservations('not-a-uuid', boundary, defaultPolicy), /authenticated DDA UUID/);

const providerBuckets = providerUsageReservations('market-feed-one', 4, boundary, configured);
assert.equal(providerBuckets.length, 3);
assert.deepEqual(providerBuckets.map(item => item.metric), ['provider_request', 'provider_request', 'provider_units']);
assert.deepEqual(providerBuckets.map(item => item.limit_units), [7, 120, 2400]);
assert.equal(providerBuckets[2].amount, 4);
assert.throws(() => providerUsageReservations('other-provider', 1, boundary, configured), error => error.code === 'provider_not_configured');
assert.throws(() => providerUsageReservations('market-feed-one', 0, boundary, configured), /positive integer/);

const migration = fs.readFileSync(path.join(root, 'supabase/migrations/0007_autotrader_quota_buckets.sql'), 'utf8');
assert.match(migration, /pg_advisory_xact_lock/);
assert.match(migration, /for update/i);
assert.match(migration, /exception subtransaction rolls back/i);
assert.match(migration, /enable row level security/i);
assert.match(migration, /grant execute on function public\.reserve_dda_autotrader_quota\(jsonb\) to service_role/i);
console.log('AutoTrader quota policy tests: PASS');
