'use strict';

/*
 * Lot 8 (cahier des charges — instruments de marché) — contract for
 * GET /v1/market/quotes, the public read route behind the "Marchés" view's
 * 6 instruments (XAUUSD, EURUSD, GBPUSD, USDJPY, US30, BTCUSD). Covers: with
 * no provider keys configured (today's real production state) every
 * instrument honestly reports not_configured — never a fabricated price;
 * a configured provider's happy path returns a real price with an asOf
 * timestamp; one provider failure never takes the other instruments down
 * with it (Promise.all isolation) and reports unavailable, never a stale or
 * made-up value; and the route never requires auth or a session (it exposes
 * no secret and no user-specific data, same pattern as /v1/publications/brvm).
 */
const assert = require('node:assert/strict');
const http = require('node:http');
const { createBff } = require('../bff/src/app');
const { MemorySessionStore } = require('../bff/src/session-store');

function makeAuth() {
  return {
    async login({ email }) { return { user: { id: '11111111-1111-4111-8111-111111111111' }, access_token: 'a', refresh_token: 'r' }; },
    async getUser(userId) { return { user_id: userId, email: 'ada@example.com', email_verified: true, display_name: 'Ada Lovelace', status: 'active', entitlements: [] }; }
  };
}

function request(server, method, path) {
  return new Promise((resolve, reject) => {
    const req = http.request({ ...server.address(), method, path, headers: { Origin: 'http://localhost:8745' } }, res => {
      let text = ''; res.on('data', chunk => { text += chunk; }); res.on('end', () => resolve({ status: res.statusCode, body: text ? JSON.parse(text) : null }));
    });
    req.on('error', reject); req.end();
  });
}

const baseConfig = { allowedOrigins: ['http://localhost:8745'], secureCookies: true, sessionIdleMs: 60 * 60 * 1000, sessionAbsoluteMs: 24 * 60 * 60 * 1000, sessionEncryptionKey: null, emailRedirectTo: 'http://localhost:8745/access', passwordRecoveryRedirectTo: 'http://localhost:8745/access?type=recovery' };

(async () => {
  let passed = 0;
  async function test(name, fn) {
    try { await fn(); passed++; console.log(`  ok — ${name}`); }
    catch (error) { console.log(`  FAIL — ${name}\n    ${error.stack}`); process.exitCode = 1; }
  }

  await test('no provider keys configured (today\'s real production state) — every instrument reports not_configured, never a fabricated price', async () => {
    const auth = makeAuth();
    const sessions = new MemorySessionStore();
    const handler = createBff({ auth, sessions, config: baseConfig, marketDataConfig: { twelveDataApiKey: null, coinGeckoApiKey: null, maxAgeMs: 5 * 60 * 1000 } });
    const server = http.createServer(handler);
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    try {
      const response = await request(server, 'GET', '/v1/market/quotes');
      assert.equal(response.status, 200);
      const instruments = response.body.instruments;
      for (const symbol of ['XAUUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'US30', 'BTCUSD']) {
        assert.equal(instruments[symbol].status, 'not_configured', `${symbol} must be honestly not_configured`);
        assert.equal(instruments[symbol].price, undefined, `${symbol} must never carry a price when unconfigured`);
      }
    } finally { server.close(); }
  });

  await test('no auth or session required — the route exposes no secret and no user-specific data', async () => {
    const auth = makeAuth();
    const sessions = new MemorySessionStore();
    const handler = createBff({ auth, sessions, config: baseConfig, marketDataConfig: { twelveDataApiKey: null, coinGeckoApiKey: null, maxAgeMs: 5 * 60 * 1000 } });
    const server = http.createServer(handler);
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    try {
      const response = await request(server, 'GET', '/v1/market/quotes');
      assert.equal(response.status, 200);
    } finally { server.close(); }
  });

  await test('configured provider happy path returns a real, server-verified price with an asOf timestamp', async () => {
    const auth = makeAuth();
    const sessions = new MemorySessionStore();
    const originalFetch = global.fetch;
    global.fetch = async (url) => {
      if (String(url).includes('twelvedata')) return { ok: true, status: 200, async json() { return { price: '1.0875' }; } };
      return { ok: true, status: 200, async json() { return { bitcoin: { usd: 68000 } }; } };
    };
    try {
      const handler = createBff({ auth, sessions, config: baseConfig, marketDataConfig: { twelveDataApiKey: 'td_test', coinGeckoApiKey: 'cg_test', maxAgeMs: 5 * 60 * 1000 }, clock: () => new Date('2026-11-14T10:00:00.000Z') });
      const server = http.createServer(handler);
      await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
      try {
        const response = await request(server, 'GET', '/v1/market/quotes');
        assert.equal(response.status, 200);
        assert.equal(response.body.instruments.EURUSD.status, 'ok');
        assert.equal(response.body.instruments.EURUSD.price, 1.0875);
        assert.equal(response.body.instruments.EURUSD.asOf, '2026-11-14T10:00:00.000Z');
        assert.equal(response.body.instruments.BTCUSD.status, 'ok');
        assert.equal(response.body.instruments.BTCUSD.price, 68000);
      } finally { server.close(); }
    } finally { global.fetch = originalFetch; }
  });

  await test('one provider failure never takes the other instruments down with it, and never reports a stale/fabricated value', async () => {
    const auth = makeAuth();
    const sessions = new MemorySessionStore();
    const originalFetch = global.fetch;
    global.fetch = async (url) => {
      if (String(url).includes('twelvedata')) throw new Error('network down');
      return { ok: true, status: 200, async json() { return { bitcoin: { usd: 68000 } }; } };
    };
    try {
      const handler = createBff({ auth, sessions, config: baseConfig, marketDataConfig: { twelveDataApiKey: 'td_test', coinGeckoApiKey: 'cg_test', maxAgeMs: 5 * 60 * 1000 } });
      const server = http.createServer(handler);
      await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
      try {
        const response = await request(server, 'GET', '/v1/market/quotes');
        assert.equal(response.status, 200);
        assert.equal(response.body.instruments.EURUSD.status, 'unavailable');
        assert.equal(response.body.instruments.EURUSD.price, undefined);
        assert.equal(response.body.instruments.BTCUSD.status, 'ok');
        assert.equal(response.body.instruments.BTCUSD.price, 68000);
      } finally { server.close(); }
    } finally { global.fetch = originalFetch; }
  });

  console.log(`\n${passed}/4 market data contract checks passed`);
  if (passed !== 4) process.exit(1);
})();
