'use strict';

/*
 * Commercial activation mandate (2026-11-14) — contract for
 * POST /v1/billing/checkout, the route that turns "présenter Premium" into
 * "payer réellement": it asks Chariow for a real Checkout session and hands
 * the frontend a real checkout_url. Covers: honest 503 when Chariow isn't
 * configured (today's real production state), auth + CSRF are required,
 * dda_user_id in custom_metadata always comes from the server-side session
 * (never the request body — that field is exactly what the Pulse webhook
 * later trusts to grant premium_track), provider failure is never reported
 * as success, and a simple per-user rate limit exists.
 */
const assert = require('node:assert/strict');
const http = require('node:http');
const { createBff, SESSION_COOKIE, CSRF_COOKIE } = require('../bff/src/app');
const { MemorySessionStore } = require('../bff/src/session-store');

function makeAuth() {
  return {
    async login({ email }) { return { user: { id: '11111111-1111-4111-8111-111111111111' }, access_token: 'a', refresh_token: 'r' }; },
    async getUser(userId) { return { user_id: userId, email: 'ada@example.com', email_verified: true, display_name: 'Ada Lovelace', status: 'active', entitlements: [] }; }
  };
}

function request(server, method, path, { body, headers = {}, cookies = {} } = {}) {
  return new Promise((resolve, reject) => {
    const cookie = Object.entries(cookies).map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join('; ');
    const req = http.request({ ...server.address(), method, path, headers: { Origin: 'http://localhost:8745', ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}), ...headers } }, res => {
      let text = ''; res.on('data', chunk => { text += chunk; }); res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: text ? JSON.parse(text) : null }));
    });
    req.on('error', reject); if (body !== undefined) req.write(JSON.stringify(body)); req.end();
  });
}

const baseConfig = { allowedOrigins: ['http://localhost:8745'], secureCookies: true, sessionIdleMs: 60 * 60 * 1000, sessionAbsoluteMs: 24 * 60 * 60 * 1000, sessionEncryptionKey: null, emailRedirectTo: 'http://localhost:8745/access', passwordRecoveryRedirectTo: 'http://localhost:8745/access?type=recovery' };

(async () => {
  let passed = 0;
  async function test(name, fn) {
    try { await fn(); passed++; console.log(`  ok — ${name}`); }
    catch (error) { console.log(`  FAIL — ${name}\n    ${error.stack}`); process.exitCode = 1; }
  }

  await test('unconfigured Chariow (no API key / no allowlisted product) fails closed with 503 — never a fake checkout URL', async () => {
    const auth = makeAuth();
    const sessions = new MemorySessionStore();
    const handler = createBff({ auth, sessions, config: baseConfig, chariowConfig: { apiKey: null, pulseSecret: null, premiumProductIds: [], apiBaseUrl: 'https://api.chariow.com/v1', checkoutRedirectUrl: null }, clock: () => new Date('2026-11-14T00:00:00.000Z') });
    const server = http.createServer(handler);
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    try {
      const login = await request(server, 'POST', '/v1/auth/login', { body: { email: 'ada@example.com', password: 'long-enough-password' } });
      const setCookies = [].concat(login.headers['set-cookie'] || []);
      const sessionCookie = decodeURIComponent(setCookies.find(v => v.startsWith(`${SESSION_COOKIE}=`)).split(';')[0].split('=')[1]);
      const csrfCookie = decodeURIComponent(setCookies.find(v => v.startsWith(`${CSRF_COOKIE}=`)).split(';')[0].split('=')[1]);

      const response = await request(server, 'POST', '/v1/billing/checkout', { cookies: { [SESSION_COOKIE]: sessionCookie, [CSRF_COOKIE]: csrfCookie }, headers: { 'X-CSRF-Token': csrfCookie } });
      assert.equal(response.status, 503);
      assert.equal(response.body.code, 'billing_not_configured');
    } finally { server.close(); }
  });

  await test('unauthenticated request is rejected before anything else', async () => {
    const auth = makeAuth();
    const sessions = new MemorySessionStore();
    const handler = createBff({ auth, sessions, config: baseConfig, chariowConfig: { apiKey: 'sk_test', pulseSecret: 'whsec_test', premiumProductIds: ['prd_premium'], apiBaseUrl: 'https://api.chariow.com/v1', checkoutRedirectUrl: null } });
    const server = http.createServer(handler);
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    try {
      const response = await request(server, 'POST', '/v1/billing/checkout', {});
      assert.equal(response.status, 401);
    } finally { server.close(); }
  });

  await test('authenticated but missing/invalid CSRF token is rejected', async () => {
    const auth = makeAuth();
    const sessions = new MemorySessionStore();
    const handler = createBff({ auth, sessions, config: baseConfig, chariowConfig: { apiKey: 'sk_test', pulseSecret: 'whsec_test', premiumProductIds: ['prd_premium'], apiBaseUrl: 'https://api.chariow.com/v1', checkoutRedirectUrl: null } });
    const server = http.createServer(handler);
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    try {
      const login = await request(server, 'POST', '/v1/auth/login', { body: { email: 'ada@example.com', password: 'long-enough-password' } });
      const setCookies = [].concat(login.headers['set-cookie'] || []);
      const sessionCookie = decodeURIComponent(setCookies.find(v => v.startsWith(`${SESSION_COOKIE}=`)).split(';')[0].split('=')[1]);
      const response = await request(server, 'POST', '/v1/billing/checkout', { cookies: { [SESSION_COOKIE]: sessionCookie }, headers: { 'X-CSRF-Token': 'wrong' } });
      assert.equal(response.status, 403);
      assert.equal(response.body.code, 'csrf_failed');
    } finally { server.close(); }
  });

  await test('a real checkout: dda_user_id comes from the session, never from the request body (privilege-escalation guard)', async () => {
    const auth = makeAuth();
    const sessions = new MemorySessionStore();
    const providerCalls = [];
    const originalFetch = global.fetch;
    global.fetch = async (url, options) => {
      providerCalls.push({ url, body: JSON.parse(options.body) });
      return { ok: true, status: 200, async json() { return { data: { step: 'payment', purchase: { id: 'sal_1' }, payment: { checkout_url: 'https://pay.chariow.test/checkout/sal_1' } } }; } };
    };
    try {
      const handler = createBff({ auth, sessions, config: baseConfig, chariowConfig: { apiKey: 'sk_test', pulseSecret: 'whsec_test', premiumProductIds: ['prd_premium'], apiBaseUrl: 'https://api.chariow.com/v1', checkoutRedirectUrl: 'https://app.example/academy.html#membership' } });
      const server = http.createServer(handler);
      await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
      try {
        const login = await request(server, 'POST', '/v1/auth/login', { body: { email: 'ada@example.com', password: 'long-enough-password' } });
        const setCookies = [].concat(login.headers['set-cookie'] || []);
        const sessionCookie = decodeURIComponent(setCookies.find(v => v.startsWith(`${SESSION_COOKIE}=`)).split(';')[0].split('=')[1]);
        const csrfCookie = decodeURIComponent(setCookies.find(v => v.startsWith(`${CSRF_COOKIE}=`)).split(';')[0].split('=')[1]);

        const response = await request(server, 'POST', '/v1/billing/checkout', {
          cookies: { [SESSION_COOKIE]: sessionCookie, [CSRF_COOKIE]: csrfCookie },
          headers: { 'X-CSRF-Token': csrfCookie },
          body: { customMetadata: { dda_user_id: '00000000-0000-4000-8000-attacker0000' } }
        });
        assert.equal(response.status, 200);
        assert.equal(response.body.checkout_url, 'https://pay.chariow.test/checkout/sal_1');
        assert.equal(providerCalls.length, 1);
        assert.equal(providerCalls[0].body.custom_metadata.dda_user_id, '11111111-1111-4111-8111-111111111111', 'the real session user_id is used, never a client-supplied one — the request body had no effect');
        assert.equal(providerCalls[0].body.email, 'ada@example.com');
        assert.equal(providerCalls[0].body.product_id, 'prd_premium');
      } finally { server.close(); }
    } finally { global.fetch = originalFetch; }
  });

  await test('a provider/network failure is reported honestly as 502, never a fabricated success', async () => {
    const auth = makeAuth();
    const sessions = new MemorySessionStore();
    const originalFetch = global.fetch;
    global.fetch = async () => { throw new Error('network down'); };
    try {
      const handler = createBff({ auth, sessions, config: baseConfig, chariowConfig: { apiKey: 'sk_test', pulseSecret: 'whsec_test', premiumProductIds: ['prd_premium'], apiBaseUrl: 'https://api.chariow.com/v1', checkoutRedirectUrl: null } });
      const server = http.createServer(handler);
      await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
      try {
        const login = await request(server, 'POST', '/v1/auth/login', { body: { email: 'ada@example.com', password: 'long-enough-password' } });
        const setCookies = [].concat(login.headers['set-cookie'] || []);
        const sessionCookie = decodeURIComponent(setCookies.find(v => v.startsWith(`${SESSION_COOKIE}=`)).split(';')[0].split('=')[1]);
        const csrfCookie = decodeURIComponent(setCookies.find(v => v.startsWith(`${CSRF_COOKIE}=`)).split(';')[0].split('=')[1]);
        const response = await request(server, 'POST', '/v1/billing/checkout', { cookies: { [SESSION_COOKIE]: sessionCookie, [CSRF_COOKIE]: csrfCookie }, headers: { 'X-CSRF-Token': csrfCookie } });
        assert.equal(response.status, 502);
        assert.equal(response.body.code, 'checkout_unavailable');
      } finally { server.close(); }
    } finally { global.fetch = originalFetch; }
  });

  await test('per-user rate limiting applies to checkout attempts', async () => {
    const auth = makeAuth();
    const sessions = new MemorySessionStore();
    const checkoutCalls = [];
    const rateLimiter = { async allow(key) { if (!key.startsWith('billing_checkout:')) return true; checkoutCalls.push(key); return checkoutCalls.length <= 1; } };
    const originalFetch = global.fetch;
    global.fetch = async () => ({ ok: true, status: 200, async json() { return { data: { step: 'payment', purchase: { id: 'sal_2' }, payment: { checkout_url: 'https://pay.chariow.test/x' } } }; } });
    try {
      const handler = createBff({ auth, sessions, rateLimiter, config: baseConfig, chariowConfig: { apiKey: 'sk_test', pulseSecret: 'whsec_test', premiumProductIds: ['prd_premium'], apiBaseUrl: 'https://api.chariow.com/v1', checkoutRedirectUrl: null } });
      const server = http.createServer(handler);
      await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
      try {
        const login = await request(server, 'POST', '/v1/auth/login', { body: { email: 'ada@example.com', password: 'long-enough-password' } });
        const setCookies = [].concat(login.headers['set-cookie'] || []);
        const sessionCookie = decodeURIComponent(setCookies.find(v => v.startsWith(`${SESSION_COOKIE}=`)).split(';')[0].split('=')[1]);
        const csrfCookie = decodeURIComponent(setCookies.find(v => v.startsWith(`${CSRF_COOKIE}=`)).split(';')[0].split('=')[1]);
        let response = await request(server, 'POST', '/v1/billing/checkout', { cookies: { [SESSION_COOKIE]: sessionCookie, [CSRF_COOKIE]: csrfCookie }, headers: { 'X-CSRF-Token': csrfCookie } });
        assert.equal(response.status, 200);
        response = await request(server, 'POST', '/v1/billing/checkout', { cookies: { [SESSION_COOKIE]: sessionCookie, [CSRF_COOKIE]: csrfCookie }, headers: { 'X-CSRF-Token': csrfCookie } });
        assert.equal(response.status, 429);
        assert.equal(response.body.code, 'rate_limited');
      } finally { server.close(); }
    } finally { global.fetch = originalFetch; }
  });

  console.log(`\n${passed}/6 billing checkout contract checks passed`);
  if (passed !== 6) process.exit(1);
})();
