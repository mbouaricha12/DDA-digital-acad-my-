'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { createBff, SESSION_COOKIE } = require('../bff/src/app');
const { MemorySessionStore } = require('../bff/src/session-store');
const { analyzeMarketSeriesV2 } = require('../bff/src/autotrader/market-analysis-v2');

const asOf = new Date('2026-10-20T12:00:00.000Z');
const ORIGIN = 'http://localhost:8744';
const USER_ID = '11111111-1111-4111-8111-111111111111';
const providerResponseSchema = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'contracts', 'autotrader', 'provider-analysis-response-v1.schema.json'), 'utf8'));
function makeSeries() {
  const bars = [];
  for (let i = 0; i < 60; i += 1) {
    const close = 100 + i;
    bars.push({
      timestamp: new Date(asOf.getTime() - (60 - i) * 15 * 60_000).toISOString(),
      open: close - 0.25,
      high: close + 2,
      low: close - 1,
      close,
      volume: { semantic: 'unavailable', reason: 'not_verified' }
    });
  }
  return {
    contract_version: 'dda.market-series.v2',
    instrument: { symbol: 'AAPL', venue: 'NASDAQ', asset_class: 'equity', currency: 'USD' },
    timeframe: '15m', data_mode: 'historical',
    source: { id: 'twelve-data', kind: 'provider', provider_symbol: 'AAPL', license_ref: 'approval:test-fixture' },
    retrieved_at: asOf.toISOString(), bars
  };
}
function request(server, method, path, { body, cookies = {}, headers = {} } = {}) {
  return new Promise((resolve, reject) => {
    const cookie = Object.entries(cookies).map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join('; ');
    const hasBody = body !== undefined;
    const req = http.request({
      ...server.address(), method, path,
      headers: { Origin: ORIGIN, ...(hasBody ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}), ...headers }
    }, res => {
      let text = '';
      res.on('data', chunk => { text += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: text ? JSON.parse(text) : null, raw: text }));
    });
    req.on('error', reject);
    if (hasBody) req.write(JSON.stringify(body));
    req.end();
  });
}
async function run(name, fn) {
  await fn();
  console.log(`PASS ${name}`);
}

(async () => {
  let grantedEntitlements = ['autotrader.analysis'];
  let quotaResult = { allowed: true };
  let quotaFailure = false;
  let providerFailure = null;
  let invalidSeries = false;
  let revokeDuringFetch = false;
  let quotaCalls = 0;
  let providerCalls = 0;
  let analysisCalls = 0;
  const logs = [];
  const sessions = new MemorySessionStore();
  const auth = {
    async login() { return { user: { id: USER_ID }, access_token: 'access-token', refresh_token: 'refresh-token' }; },
    async getUser(userId) { return { user_id: userId, email: 'user@example.test', email_verified: true, display_name: 'Test', status: 'active', entitlements: [] }; }
  };
  const quotaPolicy = {
    providerId: 'twelve-data', userAnalysesPerMinute: 10, userAnalysesPerHour: 50, userAnalysesPerDay: 200,
    providerRequestsPerMinute: 10, providerRequestsPerDay: 200, providerUnitsPerMonth: 5000
  };
  const handler = createBff({
    auth, sessions, clock: () => new Date(asOf), logger: (...args) => logs.push(args), quotaPolicy,
    config: {
      allowedOrigins: [ORIGIN], secureCookies: true, sessionIdleMs: 60 * 60 * 1000,
      sessionAbsoluteMs: 24 * 60 * 60 * 1000, sessionEncryptionKey: null, emailRedirectTo: `${ORIGIN}/access`
    },
    entitlements: {
      async getForUser() {
        const entitlements = [...grantedEntitlements];
        const membership = { status: 'active', starts_at: '2026-10-01T00:00:00.000Z', ends_at: null, entitlements };
        return { membership, memberships: [membership], entitlements };
      }
    },
    quotaStore: {
      async reserveUserProviderAnalysis({ userId, providerId, units, policy }) {
        quotaCalls += 1;
        assert.equal(userId, USER_ID);
        assert.equal(providerId, 'twelve-data');
        assert.equal(units, 1, 'one requested symbol consumes one configured provider unit');
        assert.equal(policy, quotaPolicy);
        if (quotaFailure) throw Object.assign(new Error('private quota details'), { status: 503 });
        return quotaResult;
      }
    },
    providerMarketData: {
      providerId: 'twelve-data',
      hasInstrument(id) { return id === 'aapl-15m'; },
      async getSeries(id) {
        providerCalls += 1;
        assert.equal(id, 'aapl-15m');
        if (revokeDuringFetch) grantedEntitlements = [];
        if (providerFailure) throw providerFailure;
        const series = makeSeries();
        if (invalidSeries) series.bars = [];
        return series;
      }
    },
    marketAnalyzerV2(series, options) {
      analysisCalls += 1;
      return analyzeMarketSeriesV2(series, options);
    }
  });
  const server = http.createServer(handler);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    await run('provider response schema pins historical data and non-execution invariants', async () => {
      assert.equal(providerResponseSchema.$schema, 'https://json-schema.org/draft/2020-12/schema');
      assert.equal(providerResponseSchema.properties.analysis.properties.data_mode.const, 'historical');
      assert.equal(providerResponseSchema.properties.analysis.properties.execution_enabled.const, false);
      assert.equal(providerResponseSchema.properties.analysis.properties.order_recommendation.type, 'null');
      assert.equal(providerResponseSchema.properties.analysis.properties.validation_errors.maxItems, 0);
      assert.equal(providerResponseSchema.properties.analysis.properties.metrics.additionalProperties, false);
      assert.equal(Object.hasOwn(providerResponseSchema.properties, 'series'), false);
    });

    await run('unauthenticated provider analysis is denied before quota or provider access', async () => {
      const response = await request(server, 'POST', '/v1/autotrader/provider-analysis', { body: { instrument_id: 'aapl-15m' } });
      assert.equal(response.status, 401);
      assert.equal(quotaCalls, 0);
      assert.equal(providerCalls, 0);
    });

    const login = await request(server, 'POST', '/v1/auth/login', { body: { email: 'user@example.test', password: 'secure-test-password' } });
    assert.equal(login.status, 204);
    const cookieValue = decodeURIComponent(login.headers['set-cookie'].find(value => value.startsWith(`${SESSION_COOKIE}=`)).split(';')[0].split('=')[1]);
    const cookies = { [SESSION_COOKIE]: cookieValue };

    await run('generic Premium does not authorize a Twelve Data analysis', async () => {
      grantedEntitlements = ['premium_track', 'resources_premium'];
      const response = await request(server, 'POST', '/v1/autotrader/provider-analysis', { body: { instrument_id: 'aapl-15m' }, cookies });
      assert.equal(response.status, 403);
      assert.equal(response.body.code, 'entitlement_required');
      assert.equal(quotaCalls, 0);
      assert.equal(providerCalls, 0);
      grantedEntitlements = ['autotrader.analysis'];
    });

    await run('request accepts only a configured instrument id and rejects arbitrary symbols', async () => {
      const response = await request(server, 'POST', '/v1/autotrader/provider-analysis', { body: { instrument_id: 'aapl-15m', symbol: 'OTHER' }, cookies });
      assert.equal(response.status, 400);
      const unknown = await request(server, 'POST', '/v1/autotrader/provider-analysis', { body: { instrument_id: 'other' }, cookies });
      assert.equal(unknown.status, 404);
      assert.equal(unknown.body.code, 'instrument_unavailable');
      assert.equal(quotaCalls, 0);
      assert.equal(providerCalls, 0);
    });

    await run('user quota denial happens before any Twelve Data request', async () => {
      quotaResult = { allowed: false, scope_type: 'user', metric: 'analysis_request', retry_at: new Date(asOf.getTime() + 60_000).toISOString() };
      const beforeProvider = providerCalls;
      const response = await request(server, 'POST', '/v1/autotrader/provider-analysis', { body: { instrument_id: 'aapl-15m' }, cookies });
      assert.equal(response.status, 429);
      assert.equal(response.body.code, 'quota_exceeded');
      assert.equal(response.headers['retry-after'], '60');
      assert.equal(providerCalls, beforeProvider);
      quotaResult = { allowed: true };
    });

    await run('global provider quota denial is explicit and prevents external access', async () => {
      quotaResult = { allowed: false, scope_type: 'provider', metric: 'provider_request', retry_at: new Date(asOf.getTime() + 60_000).toISOString() };
      const beforeProvider = providerCalls;
      const response = await request(server, 'POST', '/v1/autotrader/provider-analysis', { body: { instrument_id: 'aapl-15m' }, cookies });
      assert.equal(response.status, 429);
      assert.equal(response.body.code, 'provider_quota_exceeded');
      assert.equal(providerCalls, beforeProvider);
      quotaResult = { allowed: true };
    });

    await run('quota store failure fails closed before Twelve Data access', async () => {
      quotaFailure = true;
      const beforeProvider = providerCalls;
      const response = await request(server, 'POST', '/v1/autotrader/provider-analysis', { body: { instrument_id: 'aapl-15m' }, cookies });
      assert.equal(response.status, 503);
      assert.equal(response.body.code, 'quota_unavailable');
      assert.equal(providerCalls, beforeProvider);
      quotaFailure = false;
    });

    await run('configured provider returns descriptive historical v2 analysis and no signal or executable order', async () => {
      const response = await request(server, 'POST', '/v1/autotrader/provider-analysis', { body: { instrument_id: 'aapl-15m' }, cookies });
      assert.equal(response.status, 200);
      assert.equal(response.body.contract_version, 'dda.autotrader.provider-analysis-response.v1');
      assert.equal(response.body.series_summary.data_mode, 'historical');
      assert.equal(response.body.series_summary.bar_count, 60);
      assert.equal(response.body.series_summary.source.provider_symbol, 'AAPL');
      assert.equal(response.body.series_summary.source.license_ref, 'approval:test-fixture');
      assert.equal(response.body.analysis.contract_version, 'dda.market-analysis.v2');
      assert.equal(response.body.analysis.status, 'analysis_complete');
      assert.equal(response.body.analysis.data_mode, 'historical');
      assert.equal(response.body.analysis.execution_enabled, false);
      assert.equal(response.body.analysis.order_recommendation, null);
      assert.equal(Object.hasOwn(response.body.analysis, 'signal'), false);
      assert.equal(Object.hasOwn(response.body, 'series'), false, 'raw provider bars are not redistributed by this endpoint');
    });

    await run('provider failures are redacted and do not leak vendor message into response or logs', async () => {
      providerFailure = Object.assign(new Error('private Twelve Data response'), { code: 'provider_rate_limited', status: 429 });
      const response = await request(server, 'POST', '/v1/autotrader/provider-analysis', { body: { instrument_id: 'aapl-15m' }, cookies });
      assert.equal(response.status, 429);
      assert.equal(response.body.code, 'provider_rate_limited');
      assert.equal(JSON.stringify(response.body).includes('private Twelve Data response'), false);
      assert.equal(JSON.stringify(logs).includes('private Twelve Data response'), false);
      providerFailure = null;
    });

    await run('revocation during provider fetch suppresses the analysis response', async () => {
      revokeDuringFetch = true;
      const response = await request(server, 'POST', '/v1/autotrader/provider-analysis', { body: { instrument_id: 'aapl-15m' }, cookies });
      assert.equal(response.status, 403);
      assert.equal(response.body.code, 'entitlement_required');
      assert.equal(Object.hasOwn(response.body, 'analysis'), false);
      revokeDuringFetch = false;
      grantedEntitlements = ['autotrader.analysis'];
    });

    await run('invalid provider series is rejected without returning computed metrics', async () => {
      invalidSeries = true;
      const response = await request(server, 'POST', '/v1/autotrader/provider-analysis', { body: { instrument_id: 'aapl-15m' }, cookies });
      assert.equal(response.status, 502);
      assert.equal(response.body.code, 'market_data_unavailable');
      assert.equal(Object.hasOwn(response.body, 'analysis'), false);
      invalidSeries = false;
    });

    assert.ok(analysisCalls >= 3);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
  console.log('AutoTrader Twelve Data route tests: 11 passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
