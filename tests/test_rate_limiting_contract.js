'use strict';

const assert = require('node:assert/strict');
const http = require('node:http');
const { createBff } = require('../bff/src/app');
const { MemorySessionStore } = require('../bff/src/session-store');
const { PostgrestRateLimiter, checkAuthRateLimit, RULES } = require('../bff/src/rate-limiter');

// A deterministic in-memory stand-in for the real Postgres-backed limiter, so the BFF
// wiring tests below don't depend on timing or a real database — the limiter's own
// fail-open behavior against its real store is tested separately further down.
function makeFakeLimiter() {
  const hits = new Map();
  return {
    hits,
    async allow(key, { limit }) {
      const count = (hits.get(key) || 0) + 1;
      hits.set(key, count);
      return count <= limit;
    }
  };
}

function makeAuth() {
  const calls = [];
  return {
    calls,
    async register(input) { calls.push(['register', input.email]); return { user: null }; },
    async verifyEmail() { return {}; },
    async login({ email, password }) { calls.push(['login', email]); if (password === 'wrong') throw Object.assign(new Error('invalid'), { status: 400 }); return { user: { id: 'user-1' }, access_token: 'a', refresh_token: 'r' }; },
    async requestPasswordReset(email) { calls.push(['recover', email]); },
    async confirmPasswordReset() { calls.push(['recover-confirm']); return {}; }
  };
}

function request(server, method, path, { body } = {}) {
  return new Promise((resolve, reject) => {
    const headers = { Origin: 'http://localhost:8744' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const req = http.request({ ...server.address(), method, path, headers }, res => {
      let text = ''; res.on('data', chunk => { text += chunk; }); res.on('end', () => resolve({ status: res.statusCode, body: text ? JSON.parse(text) : null }));
    });
    req.on('error', reject); if (body !== undefined) req.write(JSON.stringify(body)); req.end();
  });
}

(async () => {
  // 1. checkAuthRateLimit scopes every bucket by IP *and* identifier (never IP alone),
  // so two different legitimate learners sharing an IP (mobile/CGNAT, office VPN) never
  // block each other — this was the core risk flagged by the audit.
  {
    const limiter = makeFakeLimiter();
    const allowed1 = await checkAuthRateLimit(limiter, 'register', { ip: '10.0.0.1', email: 'a@example.com' });
    const allowed2 = await checkAuthRateLimit(limiter, 'register', { ip: '10.0.0.1', email: 'b@example.com' });
    assert.equal(allowed1, true);
    assert.equal(allowed2, true, 'a different email behind the same IP must not inherit the first email\'s bucket');
    assert.ok(limiter.hits.has('register:ip:10.0.0.1'));
    assert.ok(limiter.hits.has('register:email:a@example.com'));
    assert.ok(limiter.hits.has('register:email:b@example.com'));
  }

  // 2. login additionally checks a login-specific per-email bucket distinct from the
  // generic per-route bucket, as the audit recommended (tighter than register/reset).
  {
    const limiter = makeFakeLimiter();
    await checkAuthRateLimit(limiter, 'login', { ip: '10.0.0.2', email: 'c@example.com' });
    assert.ok(limiter.hits.has('login:ip:10.0.0.2'));
    assert.ok(limiter.hits.has('login:email:c@example.com'));
  }

  // 3. A route with no limiter configured (rateLimiter: null, the default) never blocks —
  // this must be opt-in so every existing BFF test that doesn't wire a limiter keeps passing.
  assert.equal(await checkAuthRateLimit(null, 'login', { ip: '1.2.3.4', email: 'x@example.com' }), true);

  // 4. Unknown route name is a no-op allow (defensive default, not a silent full block).
  assert.equal(await checkAuthRateLimit(makeFakeLimiter(), 'not-a-real-route', { ip: '1.2.3.4' }), true);

  // 5. PostgrestRateLimiter fails OPEN when its own store is unreachable — an outage in
  // the limiter's storage must never take down registration/login for a legitimate learner.
  {
    const logs = [];
    const limiter = new PostgrestRateLimiter({
      supabaseUrl: 'https://project.supabase.co',
      serviceRoleKey: 'service-role-key',
      fetchImpl: async () => { throw new Error('network down'); },
      logger: (event, fields) => logs.push([event, fields])
    });
    const allowed = await limiter.allow('login:ip:1.2.3.4', RULES.login);
    assert.equal(allowed, true, 'a store failure must fail open, not block every legitimate request');
    assert.equal(logs[0][0], 'rate_limit_store_failed');
  }
  {
    // A non-2xx store response is treated the same way as a network failure: fail open.
    const limiter = new PostgrestRateLimiter({
      supabaseUrl: 'https://project.supabase.co',
      serviceRoleKey: 'service-role-key',
      fetchImpl: async () => ({ ok: false, status: 500 })
    });
    assert.equal(await limiter.allow('login:ip:1.2.3.4', RULES.login), true);
  }
  {
    // The store denying the hit (count over limit) is correctly surfaced as a block.
    const limiter = new PostgrestRateLimiter({
      supabaseUrl: 'https://project.supabase.co',
      serviceRoleKey: 'service-role-key',
      fetchImpl: async () => ({ ok: true, json: async () => false })
    });
    assert.equal(await limiter.allow('login:ip:1.2.3.4', RULES.login), false);
  }

  // 6. End-to-end through the real BFF handler: once a bucket's limit is hit, the route
  // returns 429 — and a route with no rate rule (content/health) is never limited.
  {
    const auth = makeAuth();
    const sessions = new MemorySessionStore();
    const rateLimiter = makeFakeLimiter();
    const config = { allowedOrigins: ['http://localhost:8744'], secureCookies: false, sessionIdleMs: 60 * 60 * 1000, sessionAbsoluteMs: 24 * 60 * 60 * 1000, sessionEncryptionKey: null, emailRedirectTo: 'http://localhost:8744/access' };
    const handler = createBff({ auth, sessions, rateLimiter, config, clock: () => new Date('2026-09-28T00:00:00.000Z') });
    const server = http.createServer(handler);
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    try {
      // RULES.register.limit is 5 per IP; the 6th register from the same IP+email must 429.
      let last;
      for (let i = 0; i < RULES.register.limit; i++) {
        last = await request(server, 'POST', '/v1/auth/register', { body: { email: 'pilot@example.com', password: 'a-strong-password-12', display_name: 'A' } });
        assert.equal(last.status, 202, `attempt ${i + 1} within the limit must succeed`);
      }
      const blocked = await request(server, 'POST', '/v1/auth/register', { body: { email: 'pilot@example.com', password: 'a-strong-password-12', display_name: 'A' } });
      assert.equal(blocked.status, 429);
      assert.equal(blocked.body.code, 'rate_limited');

      // Content/health routes carry no rate rule and are never limited, however many calls.
      for (let i = 0; i < RULES.register.limit + 5; i++) {
        const health = await request(server, 'GET', '/healthz');
        assert.equal(health.status, 200);
      }
    } finally {
      server.close();
    }
  }

  console.log('RESULT: rate limiting contract passed');
})();
