'use strict';

const assert = require('node:assert/strict');
const http = require('node:http');
const { createBff, SESSION_COOKIE } = require('../bff/src/app');
const { MemorySessionStore } = require('../bff/src/session-store');
const { analyzeMarketSeries } = require('../bff/src/autotrader/market-analysis');

const asOf = new Date('2026-10-18T17:00:00.000Z');
const ORIGIN = 'http://localhost:8744';
function makeSeries({ mode = 'historical', sourceKind = 'historical_import', count = 20, lastAt = new Date(asOf.getTime() - 60_000) } = {}) {
  const bars = [];
  for (let i = 0; i < count; i += 1) {
    const close = 100 + i;
    bars.push({
      timestamp: new Date(lastAt.getTime() - (count - i - 1) * 60_000).toISOString(),
      open: close - 0.2,
      high: close + 0.5,
      low: close - 0.5,
      close,
      volume: 1000 + i
    });
  }
  return {
    contract_version: 'dda.market-series.v1',
    instrument: { symbol: 'TEST', venue: 'TEST-X', asset_class: 'equity', currency: 'USD' },
    timeframe: '1m',
    data_mode: mode,
    source: { id: 'route-test-source', kind: sourceKind },
    retrieved_at: asOf.toISOString(),
    bars
  };
}
function request(server, method, path, { body, rawBody, cookies = {}, headers = {} } = {}) {
  return new Promise((resolve, reject) => {
    const cookie = Object.entries(cookies).map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join('; ');
    const hasBody = body !== undefined || rawBody !== undefined;
    const req = http.request({
      ...server.address(), method, path,
      headers: { Origin: ORIGIN, ...(hasBody ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}), ...headers }
    }, res => {
      let text = '';
      res.on('data', chunk => { text += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: text ? JSON.parse(text) : null, raw: text }));
    });
    req.on('error', reject);
    if (rawBody !== undefined) req.write(rawBody);
    else if (hasBody) req.write(JSON.stringify(body));
    req.end();
  });
}
async function run(name, fn) {
  await fn();
  console.log(`PASS ${name}`);
}

(async () => {
  const calls = [];
  const sessions = new MemorySessionStore();
  let failAnalyzer = false;
  let analysisCalls = 0;
  let grantedEntitlements = ['autotrader.analysis'];
  let membershipEndsAt = null;
  let revokeDuringAnalysis = false;
  let quotaAllowed = true;
  let quotaStoreFails = false;
  let quotaReservationCalls = 0;
  const auth = {
    async login() { return { user: { id: 'user-1' }, access_token: 'access-token', refresh_token: 'refresh-token' }; },
    async getUser(userId) { calls.push(['getUser', userId]); return { user_id: userId, email: 'user@example.test', email_verified: true, display_name: 'Test', status: 'active', entitlements: [] }; }
  };
  const logs = [];
  const handler = createBff({
    auth,
    sessions,
    logger: (...args) => logs.push(args),
    clock: () => new Date(asOf),
    entitlements: {
      async getForUser() {
        const entitlements = [...grantedEntitlements];
        const membership = { status: 'active', starts_at: '2026-10-01T00:00:00.000Z', ends_at: membershipEndsAt, entitlements };
        return { membership, memberships: [membership], entitlements };
      }
    },
    quotaStore: {
      async reserveUserAnalysis({ userId, asOf: reservationTime, policy }) {
        assert.equal(userId, 'user-1');
        assert.equal(reservationTime.toISOString(), asOf.toISOString());
        assert.equal(policy.userAnalysesPerDay, 200);
        quotaReservationCalls += 1;
        if (quotaStoreFails) throw Object.assign(new Error('private quota store details'), { status: 503 });
        return quotaAllowed
          ? { allowed: true }
          : { allowed: false, scope_type: 'user', metric: 'analysis_request', retry_at: new Date(reservationTime.getTime() + 60_000).toISOString() };
      }
    },
    marketSnapshotMaxAgeMs: 5 * 60 * 1000,
    marketAnalyzer(series, options) {
      if (failAnalyzer) throw new Error('internal private details must not escape');
      analysisCalls += 1;
      if (revokeDuringAnalysis) grantedEntitlements = [];
      return analyzeMarketSeries(series, options);
    },
    config: {
      allowedOrigins: [ORIGIN], secureCookies: true, sessionIdleMs: 60 * 60 * 1000,
      sessionAbsoluteMs: 24 * 60 * 60 * 1000, sessionEncryptionKey: null,
      emailRedirectTo: `${ORIGIN}/access`
    }
  });
  const server = http.createServer(handler);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    await run('unauthenticated analysis is denied', async () => {
      const response = await request(server, 'POST', '/v1/autotrader/analyze', { body: { series: makeSeries() } });
      assert.equal(response.status, 401);
      assert.equal(response.body.code, 'unauthenticated');
    });

    const login = await request(server, 'POST', '/v1/auth/login', { body: { email: 'user@example.test', password: 'secure-test-password' } });
    assert.equal(login.status, 204);
    const cookieValue = decodeURIComponent(login.headers['set-cookie'].find(value => value.startsWith(`${SESSION_COOKIE}=`)).split(';')[0].split('=')[1]);
    const cookies = { [SESSION_COOKIE]: cookieValue };

    await run('generic Academy Premium does not authorize AutoTrader analysis', async () => {
      grantedEntitlements = ['premium_track', 'resources_premium'];
      const before = analysisCalls;
      const response = await request(server, 'POST', '/v1/autotrader/analyze', { body: { series: makeSeries() }, cookies });
      assert.equal(response.status, 403);
      assert.equal(response.body.code, 'entitlement_required');
      assert.equal(analysisCalls, before, 'market analysis must not run before the dedicated entitlement check');
      grantedEntitlements = ['autotrader.analysis'];
    });

    await run('expired membership denies analysis even if the entitlement is in its snapshot', async () => {
      membershipEndsAt = '2026-10-18T16:59:59.999Z';
      const before = analysisCalls;
      const response = await request(server, 'POST', '/v1/autotrader/analyze', { body: { series: makeSeries() }, cookies });
      assert.equal(response.status, 403);
      assert.equal(response.body.code, 'entitlement_required');
      assert.equal(analysisCalls, before);
      membershipEndsAt = null;
    });

    await run('GET /v1/me exposes the server entitlement snapshot', async () => {
      const response = await request(server, 'GET', '/v1/me', { cookies });
      assert.equal(response.status, 200);
      assert.deepEqual(response.body.entitlements, ['autotrader.analysis']);
    });

    await run('user quota denial returns 429 before running the analyzer', async () => {
      quotaAllowed = false;
      const before = analysisCalls;
      const response = await request(server, 'POST', '/v1/autotrader/analyze', { body: { series: makeSeries() }, cookies });
      assert.equal(response.status, 429);
      assert.equal(response.body.code, 'quota_exceeded');
      assert.equal(response.headers['retry-after'], '60');
      assert.equal(analysisCalls, before);
      quotaAllowed = true;
    });

    await run('quota store failure returns 503 and fails closed', async () => {
      quotaStoreFails = true;
      const before = analysisCalls;
      const response = await request(server, 'POST', '/v1/autotrader/analyze', { body: { series: makeSeries() }, cookies });
      assert.equal(response.status, 503);
      assert.equal(response.body.code, 'quota_unavailable');
      assert.equal(analysisCalls, before);
      quotaStoreFails = false;
    });

    await run('revocation during analysis suppresses the result before response', async () => {
      grantedEntitlements = ['autotrader.analysis'];
      revokeDuringAnalysis = true;
      const response = await request(server, 'POST', '/v1/autotrader/analyze', { body: { series: makeSeries() }, cookies });
      assert.equal(response.status, 403);
      assert.equal(response.body.code, 'entitlement_required');
      assert.equal(Object.hasOwn(response.body, 'analysis'), false);
      revokeDuringAnalysis = false;
      grantedEntitlements = ['autotrader.analysis'];
    });

    await run('historical series returns versioned descriptive analysis', async () => {
      const response = await request(server, 'POST', '/v1/autotrader/analyze', { body: { series: makeSeries() }, cookies });
      assert.equal(response.status, 200);
      assert.equal(response.body.contract_version, 'dda.autotrader.analysis-response.v1');
      assert.equal(response.body.analyzed_at, asOf.toISOString());
      assert.equal(response.body.analysis.instrument.symbol, 'TEST');
      assert.equal(response.body.analysis.timeframe, '1m');
      assert.equal(response.body.analysis.data_mode, 'historical');
      assert.equal(response.body.analysis.source.id, 'route-test-source');
      assert.equal(response.body.analysis.status, 'analysis_complete');
      assert.equal(response.body.analysis.execution_enabled, false);
      assert.equal(response.body.analysis.order_recommendation, null);
    });

    await run('synthetic input stays explicitly synthetic', async () => {
      const series = makeSeries({ mode: 'synthetic', sourceKind: 'synthetic_fixture' });
      const response = await request(server, 'POST', '/v1/autotrader/analyze', { body: { series }, cookies });
      assert.equal(response.status, 200);
      assert.equal(response.body.analysis.data_mode, 'synthetic');
      assert.equal(response.body.analysis.source.kind, 'synthetic_fixture');
      assert.equal(response.body.analysis.freshness, 'not_applicable');
    });

    await run('invalid OHLCV is rejected with a structured client error', async () => {
      const series = makeSeries();
      series.bars[4].low = series.bars[4].high + 1;
      const response = await request(server, 'POST', '/v1/autotrader/analyze', { body: { series }, cookies });
      assert.equal(response.status, 400);
      assert.equal(response.body.code, 'invalid_market_series');
      assert.ok(response.body.field_errors.issues.some(issue => issue.code === 'invalid_ohlc_range'));
    });

    await run('non-increasing/duplicate timestamps are rejected', async () => {
      const series = makeSeries();
      series.bars[2].timestamp = series.bars[1].timestamp;
      const response = await request(server, 'POST', '/v1/autotrader/analyze', { body: { series }, cookies });
      assert.equal(response.status, 400);
      assert.ok(response.body.field_errors.issues.some(issue => issue.code === 'non_increasing_time'));
    });

    await run('stale provider snapshot is rejected without analysis output', async () => {
      const series = makeSeries({ mode: 'snapshot', sourceKind: 'provider', count: 2, lastAt: new Date(asOf.getTime() - 10 * 60_000) });
      const response = await request(server, 'POST', '/v1/autotrader/analyze', { body: { series }, cookies });
      assert.equal(response.status, 422);
      assert.equal(response.body.code, 'stale_market_data');
    });

    await run('future candle is rejected', async () => {
      const series = makeSeries({ count: 1, lastAt: new Date(asOf.getTime() + 1_000) });
      const response = await request(server, 'POST', '/v1/autotrader/analyze', { body: { series }, cookies });
      assert.equal(response.status, 400);
      assert.ok(response.body.field_errors.issues.some(issue => issue.code === 'future_bar'));
    });

    await run('request body over the BFF 64 KiB limit is rejected', async () => {
      const response = await request(server, 'POST', '/v1/autotrader/analyze', { rawBody: `{"series":${' '.repeat(65_536)}`, cookies });
      assert.equal(response.status, 413);
      assert.equal(response.body.code, 'validation_error');
    });

    await run('internal analysis exception is redacted from HTTP response and logs', async () => {
      failAnalyzer = true;
      const response = await request(server, 'POST', '/v1/autotrader/analyze', { body: { series: makeSeries() }, cookies });
      failAnalyzer = false;
      assert.equal(response.status, 500);
      assert.equal(response.body.code, 'internal_error');
      assert.equal(JSON.stringify(response.body).includes('private details'), false);
      assert.equal(JSON.stringify(logs).includes('private details'), false);
    });

    await run('request shape remains strict', async () => {
      const response = await request(server, 'POST', '/v1/autotrader/analyze', { body: { series: makeSeries(), max_age_ms: 9_999_999 }, cookies });
      assert.equal(response.status, 400);
      assert.equal(response.body.code, 'validation_error');
    });

    assert.ok(calls.some(call => call[0] === 'getUser'), 'analysis route resolves the authenticated user server-side');
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
  console.log('AutoTrader analysis route tests: 16 passed');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
