'use strict';

const assert = require('node:assert/strict');
const http = require('node:http');
const { createBff, SESSION_COOKIE, CSRF_COOKIE } = require('../bff/src/app');
const { MemorySessionStore } = require('../bff/src/session-store');
const { MemoryMutationStore } = require('../bff/src/idempotency');

function makeAuth() {
  const users = new Map();
  const calls = [];
  return {
    calls,
    async register(input) { calls.push(['register', input]); users.set(input.email, { id: 'user-1', email: input.email, email_confirmed_at: new Date().toISOString(), user_metadata: { display_name: input.display_name || '' } }); return { user: null }; },
    async verifyEmail(token) { assert.equal(token, 'v'.repeat(32)); return {}; },
    async login({ email, password }) { calls.push(['login', email, password]); if (password === 'wrong' || password === 'wrong-password') throw Object.assign(new Error('invalid'), { status: 400 }); return { user: { id: 'user-1' }, access_token: 'access-token', refresh_token: 'refresh-token' }; },
    async requestPasswordReset(email) { calls.push(['recover', email]); },
    async getUser(userId) { assert.equal(userId, 'user-1'); return { user_id: userId, email: 'a@example.com', email_verified: true, display_name: 'A', status: 'active', entitlements: [] }; },
    async updateUser(userId, patch) { assert.equal(userId, 'user-1'); assert.equal(typeof patch.display_name, 'string'); return { user_id: userId, email: 'a@example.com', email_verified: true, display_name: patch.display_name, status: 'active', entitlements: [] }; },
    async revokeProviderSession(token) { calls.push(['provider-logout', token]); }
  };
}

function request(server, method, path, { body, headers = {}, cookies = {} } = {}) {
  return new Promise((resolve, reject) => {
    const cookie = Object.entries(cookies).map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join('; ');
    const req = http.request({ ...server.address(), method, path, headers: { Origin: 'http://localhost:8744', ...(body ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}), ...headers } }, res => {
      let text = ''; res.on('data', chunk => { text += chunk; }); res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: text ? JSON.parse(text) : null }));
    });
    req.on('error', reject); if (body) req.write(JSON.stringify(body)); req.end();
  });
}

(async () => {
  const auth = makeAuth();
  const sessions = new MemorySessionStore();
  const mutationStore = new MemoryMutationStore();
  const logs = [];
  let membership = { plan: 'free', status: 'active', ends_at: null, revoked_at: null };
  let entitlementNames = [];
  const entitlements = { async getForUser(userId) { assert.equal(userId, 'user-1'); return { membership, entitlements: entitlementNames }; } };
  const handler = createBff({ auth, sessions, mutationStore, entitlements, logger: (...entry) => logs.push(entry), config: { allowedOrigins: ['http://localhost:8744'], secureCookies: false, sessionIdleMs: 60 * 60 * 1000, sessionAbsoluteMs: 24 * 60 * 60 * 1000, sessionEncryptionKey: null, emailRedirectTo: 'http://localhost:8744/access' }, clock: () => new Date('2026-09-28T00:00:00.000Z') });
  const server = http.createServer(handler);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    let response = await request(server, 'GET', '/v1/premium/preview');
    assert.equal(response.status, 401, 'Visitor is denied Premium');
    response = await request(server, 'POST', '/v1/auth/register', { body: { email: 'a@example.com', password: 'long-enough-password', display_name: 'A' } });
    assert.equal(response.status, 202);
    assert.match(response.body.message, /verification/i);

    response = await request(server, 'POST', '/v1/auth/login', { body: { email: 'a@example.com', password: 'long-enough-password' } });
    assert.equal(response.status, 204);
    const setCookies = response.headers['set-cookie'];
    assert.equal(setCookies.length, 2);
    const sessionCookie = setCookies.find(value => value.startsWith(`${SESSION_COOKIE}=`)).split(';')[0].split('=')[1];
    const csrfCookie = setCookies.find(value => value.startsWith(`${CSRF_COOKIE}=`)).split(';')[0].split('=')[1];
    assert.match(setCookies.find(value => value.startsWith(`${SESSION_COOKIE}=`)), /HttpOnly/);
    assert.match(setCookies.find(value => value.startsWith(`${SESSION_COOKIE}=`)), /SameSite=Lax/);

    response = await request(server, 'GET', '/v1/me', { cookies: { [SESSION_COOKIE]: decodeURIComponent(sessionCookie) } });
    assert.equal(response.status, 200);
    assert.equal(response.body.user_id, 'user-1');
    assert.equal(Object.hasOwn(response.body, 'access_token'), false);

    response = await request(server, 'GET', '/v1/premium/preview', { cookies: { [SESSION_COOKIE]: decodeURIComponent(sessionCookie) } });
    assert.equal(response.status, 403, 'Free user is denied Premium');
    membership = { plan: 'premium', status: 'active', ends_at: null, revoked_at: null };
    entitlementNames = ['premium_track'];
    response = await request(server, 'GET', '/v1/premium/preview', { cookies: { [SESSION_COOKIE]: decodeURIComponent(sessionCookie) } });
    assert.equal(response.status, 200, 'Active server membership grants Premium');
    response = await request(server, 'GET', '/v1/premium/preview', { cookies: { [SESSION_COOKIE]: decodeURIComponent(sessionCookie) } });
    assert.equal(response.body.server_authorized, true);
    membership = { plan: 'premium', status: 'active', ends_at: '2026-09-27T00:00:00.000Z', revoked_at: null };
    response = await request(server, 'GET', '/v1/premium/preview', { cookies: { [SESSION_COOKIE]: decodeURIComponent(sessionCookie) } });
    assert.equal(response.status, 403, 'Expired membership is denied');
    membership = { plan: 'premium', status: 'revoked', ends_at: null, revoked_at: '2026-09-27T00:00:00.000Z' };
    response = await request(server, 'GET', '/v1/premium/preview', { cookies: { [SESSION_COOKIE]: decodeURIComponent(sessionCookie) } });
    assert.equal(response.status, 403, 'Revoked membership is denied');
    membership = { plan: 'free', status: 'active', ends_at: null, revoked_at: null };
    entitlementNames = [];

    entitlements.getForUser = async () => { throw new Error('Journal secret <script>alert(1)</script>'); };
    response = await request(server, 'GET', '/v1/premium/preview', { cookies: { [SESSION_COOKIE]: decodeURIComponent(sessionCookie) } });
    assert.equal(response.status, 500);
    const failedLog = logs.find(entry => entry[0] === 'request_failed');
    assert.ok(failedLog, 'request failure is logged with a safe event');
    assert.equal(Object.hasOwn(failedLog[1], 'error'), false, 'raw exception message is not logged');

    response = await request(server, 'PATCH', '/v1/me', { cookies: { [SESSION_COOKIE]: decodeURIComponent(sessionCookie), [CSRF_COOKIE]: decodeURIComponent(csrfCookie) }, headers: { 'X-CSRF-Token': decodeURIComponent(csrfCookie) }, body: { display_name: 'Updated', owner_id: 'attacker' } });
    assert.equal(response.status, 400);

    response = await request(server, 'PATCH', '/v1/me', { cookies: { [SESSION_COOKIE]: decodeURIComponent(sessionCookie), [CSRF_COOKIE]: decodeURIComponent(csrfCookie) }, headers: { 'X-CSRF-Token': decodeURIComponent(csrfCookie) }, body: { display_name: 'Updated' } });
    assert.equal(response.status, 200);
    assert.equal(response.body.display_name, 'Updated');

    const mutationId = '33333333-3333-4333-8333-333333333333';
    response = await request(server, 'PATCH', '/v1/me', { cookies: { [SESSION_COOKIE]: decodeURIComponent(sessionCookie), [CSRF_COOKIE]: decodeURIComponent(csrfCookie) }, headers: { 'X-CSRF-Token': decodeURIComponent(csrfCookie) }, body: { display_name: 'Idempotent', clientMutationId: mutationId } });
    assert.equal(response.status, 200);
    response = await request(server, 'PATCH', '/v1/me', { cookies: { [SESSION_COOKIE]: decodeURIComponent(sessionCookie), [CSRF_COOKIE]: decodeURIComponent(csrfCookie) }, headers: { 'X-CSRF-Token': decodeURIComponent(csrfCookie) }, body: { display_name: 'Idempotent', clientMutationId: mutationId } });
    assert.equal(response.status, 200, 'exact profile mutation retry succeeds');
    response = await request(server, 'PATCH', '/v1/me', { cookies: { [SESSION_COOKIE]: decodeURIComponent(sessionCookie), [CSRF_COOKIE]: decodeURIComponent(csrfCookie) }, headers: { 'X-CSRF-Token': decodeURIComponent(csrfCookie) }, body: { display_name: 'Different', clientMutationId: mutationId } });
    assert.equal(response.status, 409, 'same mutation id with a changed payload is rejected');

    response = await request(server, 'POST', '/v1/auth/logout', { cookies: { [SESSION_COOKIE]: decodeURIComponent(sessionCookie), [CSRF_COOKIE]: decodeURIComponent(csrfCookie) }, headers: { 'X-CSRF-Token': 'wrong' } });
    assert.equal(response.status, 403);
    response = await request(server, 'POST', '/v1/auth/logout', { cookies: { [SESSION_COOKIE]: decodeURIComponent(sessionCookie), [CSRF_COOKIE]: decodeURIComponent(csrfCookie) }, headers: { 'X-CSRF-Token': decodeURIComponent(csrfCookie) } });
    assert.equal(response.status, 204);
    response = await request(server, 'GET', '/v1/me', { cookies: { [SESSION_COOKIE]: decodeURIComponent(sessionCookie) } });
    assert.equal(response.status, 401);

    response = await request(server, 'POST', '/v1/auth/login', { body: { email: 'a@example.com', password: 'wrong-password' } });
    assert.equal(response.status, 401);
    assert.equal(response.body.code, 'authentication_failed');
  } finally { server.close(); }
  console.log('BFF implementation contract: PASS');
})();
