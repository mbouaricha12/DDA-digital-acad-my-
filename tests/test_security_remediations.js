'use strict';

const assert = require('node:assert/strict');
const http = require('node:http');
const { createBff, SESSION_COOKIE } = require('../bff/src/app');
const { MemorySessionStore } = require('../bff/src/session-store');
const { acceptsTransition } = require('../bff/src/billing-store');

function request(server, method, path, { body, cookies = {} } = {}) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : '';
    const cookie = Object.entries(cookies).map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join('; ');
    const req = http.request({ ...server.address(), method, path, headers: { Origin: 'http://localhost:8744', ...(body ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {}), ...(cookie ? { Cookie: cookie } : {}) } }, res => {
      let text = '';
      res.on('data', chunk => { text += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: text ? JSON.parse(text) : null }));
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

(async () => {
  let accountStatus = 'active';
  const sessions = new MemorySessionStore();
  const auth = {
    async login() { return { user: { id: '11111111-1111-4111-8111-111111111111' }, access_token: 'access' }; },
    async getUser(userId) { return { user_id: userId, email: 'learner@example.com', email_verified: true, display_name: 'Learner', status: accountStatus, entitlements: [] }; }
  };
  const handler = createBff({
    auth,
    sessions,
    config: { allowedOrigins: ['http://localhost:8744'], secureCookies: false, sessionIdleMs: 60 * 60 * 1000, sessionAbsoluteMs: 24 * 60 * 60 * 1000, authRateLimitWindowMs: 60_000, authRateLimitMax: 2 },
    clock: () => new Date('2026-11-10T00:00:00.000Z')
  });
  const server = http.createServer(handler);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const first = await request(server, 'POST', '/v1/auth/login', { body: { email: 'learner@example.com', password: 'long-enough-password' } });
    assert.equal(first.status, 204);
    const cookies = Object.fromEntries(first.headers['set-cookie'].map(value => value.split(';')[0].split('=')));
    const session = decodeURIComponent(cookies[SESSION_COOKIE]);
    const second = await request(server, 'POST', '/v1/auth/login', { body: { email: 'learner@example.com', password: 'long-enough-password' } });
    assert.equal(second.status, 204);
    const limited = await request(server, 'POST', '/v1/auth/login', { body: { email: 'learner@example.com', password: 'long-enough-password' } });
    assert.equal(limited.status, 429);
    assert.match(String(limited.headers['retry-after']), /^\d+$/);
    accountStatus = 'locked';
    const blocked = await request(server, 'GET', '/v1/me', { cookies: { [SESSION_COOKIE]: session } });
    assert.equal(blocked.status, 401);
    assert.equal((await sessions.findActiveByTokenHash(require('../bff/src/security').sha256(session), new Date('2026-11-10T00:00:00.000Z'))), null);
  } finally { server.close(); }

  const base = { status: 'revoked', provider_event_at: '2026-11-10T10:00:00.000Z' };
  assert.equal(acceptsTransition(base, { status: 'active', occurredAt: '2026-11-10T11:00:00.000Z' }), false, 'revoked license must not reactivate');
  assert.equal(acceptsTransition({ status: 'active', provider_event_at: '2026-11-10T12:00:00.000Z' }, { status: 'active', occurredAt: '2026-11-10T11:00:00.000Z' }), false, 'stale event must be rejected');
  assert.equal(acceptsTransition({ status: 'expired', provider_event_at: '2026-11-10T10:00:00.000Z' }, { status: 'revoked', occurredAt: '2026-11-10T11:00:00.000Z' }), true, 'newer revocation may strengthen terminal state');
  console.log('Security remediation contracts: PASS');
})().catch(error => { console.error(error); process.exitCode = 1; });
