'use strict';

const assert = require('node:assert/strict');
const http = require('node:http');
const { createBff, configFromEnv, validateRuntimeConfig, SESSION_COOKIE, CSRF_COOKIE } = require('../bff/src/app');
const { MemorySessionStore } = require('../bff/src/session-store');
const { MemoryMutationStore } = require('../bff/src/idempotency');

const encryptionKey = require('node:crypto').randomBytes(32).toString('base64url');
const validEnv = {
  SUPABASE_URL: 'https://project.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'publishable-key',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
  SESSION_ENCRYPTION_KEY: encryptionKey,
  ALLOWED_ORIGINS: 'https://app.example.dda.academy',
  EMAIL_REDIRECT_TO: 'https://app.example.dda.academy/#access',
  BFF_COOKIE_SECURE: 'true'
};
assert.deepEqual(validateRuntimeConfig(configFromEnv(validEnv), validEnv), []);
// EMAIL_REDIRECT_TO carries the #access hash (the SPA route the reset-password
// form lives on); URL serialization always places a derived query string
// before an existing hash, so the auto-derived recovery redirect keeps it too
// — the frontend force-navigates to the access view on recovery regardless.
assert.equal(configFromEnv(validEnv).passwordRecoveryRedirectTo, 'https://app.example.dda.academy/?type=recovery#access');
assert.ok(validateRuntimeConfig(configFromEnv({ ...validEnv, PASSWORD_RECOVERY_REDIRECT_TO: 'https://other.example/?type=recovery' }), { ...validEnv, PASSWORD_RECOVERY_REDIRECT_TO: 'https://other.example/?type=recovery' }).some(issue => /PASSWORD_RECOVERY_REDIRECT_TO/.test(issue)));
assert.ok(validateRuntimeConfig(configFromEnv({ ...validEnv, ALLOWED_ORIGINS: '*' }), { ...validEnv, ALLOWED_ORIGINS: '*' }).some(issue => /exact HTTPS origins/.test(issue)));
assert.ok(validateRuntimeConfig(configFromEnv({ ...validEnv, BFF_COOKIE_SECURE: 'false' }), { ...validEnv, BFF_COOKIE_SECURE: 'false' }).some(issue => /__Host- cookies/.test(issue)));
assert.ok(validateRuntimeConfig(configFromEnv({ ...validEnv, SESSION_ENCRYPTION_KEY: 'short' }), { ...validEnv, SESSION_ENCRYPTION_KEY: 'short' }).some(issue => /32 bytes/.test(issue)));
assert.ok(validateRuntimeConfig(configFromEnv({ ...validEnv, EMAIL_REDIRECT_TO: 'https://other.example/#access' }), { ...validEnv, EMAIL_REDIRECT_TO: 'https://other.example/#access' }).some(issue => /origin listed/.test(issue)));
assert.ok(validateRuntimeConfig(configFromEnv({ ...validEnv, SUPABASE_URL: 'https://project.supabase.co/extra' }), { ...validEnv, SUPABASE_URL: 'https://project.supabase.co/extra' }).some(issue => /root HTTPS URL/.test(issue)));

function makeAuth() {
  const users = new Map();
  const calls = [];
  return {
    calls,
    async register(input) { calls.push(['register', input]); users.set(input.email, { id: 'user-1', email: input.email, email_confirmed_at: new Date().toISOString(), user_metadata: { display_name: input.display_name || '' } }); return { user: null }; },
    async verifyEmail(token) { assert.equal(token, 'v'.repeat(32)); return {}; },
    async login({ email, password }) {
      calls.push(['login', email, password]);
      // Mirrors the real shapes GoTrue returns, so the BFF's error
      // classification (bff/src/app.js classifyLoginError) is exercised the
      // same way it is in production, not a stand-in status code.
      if (password === 'wrong' || password === 'wrong-password') throw Object.assign(new Error('Invalid login credentials'), { status: 400, code: 'invalid_credentials' });
      if (password === 'unconfirmed-account-password') throw Object.assign(new Error('Email not confirmed'), { status: 400, code: 'email_not_confirmed' });
      if (password === 'rate-limited-password') throw Object.assign(new Error('Too many requests'), { status: 429, code: 'over_request_rate_limit' });
      if (password === 'provider-down-password') throw Object.assign(new Error('fetch failed'), { status: undefined, code: undefined });
      return { user: { id: 'user-1' }, access_token: 'access-token', refresh_token: 'refresh-token' };
    },
    async requestPasswordReset(email) { calls.push(['recover', email]); },
    async confirmPasswordReset(token, password) { calls.push(['recover-confirm', token]); if (token !== 'v'.repeat(32)) throw Object.assign(new Error('invalid'), { status: 401 }); return {}; },
    async getUser(userId) { assert.equal(userId, 'user-1'); return { user_id: userId, email: 'a@example.com', email_verified: true, display_name: 'A', status: 'active', entitlements: [] }; },
    async updateUser(userId, patch) { assert.equal(userId, 'user-1'); assert.equal(typeof patch.display_name, 'string'); return { user_id: userId, email: 'a@example.com', email_verified: true, display_name: patch.display_name, status: 'active', entitlements: [] }; },
    async revokeProviderSession(token) { calls.push(['provider-logout', token]); }
  };
}

function request(server, method, path, { body, rawBody, headers = {}, cookies = {} } = {}) {
  return new Promise((resolve, reject) => {
    const cookie = Object.entries(cookies).map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join('; ');
    const hasBody = body !== undefined || rawBody !== undefined;
    const req = http.request({ ...server.address(), method, path, headers: { Origin: 'http://localhost:8744', ...(hasBody ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}), ...headers } }, res => {
      let text = ''; res.on('data', chunk => { text += chunk; }); res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: text ? JSON.parse(text) : null }));
    });
    req.on('error', reject); if (rawBody !== undefined) req.write(rawBody); else if (hasBody) req.write(JSON.stringify(body)); req.end();
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
  const handler = createBff({ auth, sessions, mutationStore, entitlements, logger: (...entry) => logs.push(entry), config: { allowedOrigins: ['http://localhost:8744'], secureCookies: true, sessionIdleMs: 60 * 60 * 1000, sessionAbsoluteMs: 24 * 60 * 60 * 1000, sessionEncryptionKey: null, emailRedirectTo: 'http://localhost:8744/access', passwordRecoveryRedirectTo: 'http://localhost:8744/access?type=recovery' }, clock: () => new Date('2026-09-28T00:00:00.000Z') });
  const server = http.createServer(handler);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    let response = await request(server, 'GET', '/healthz');
    assert.equal(response.status, 200);
    assert.deepEqual(response.body, { status: 'ok' });
    assert.equal(response.headers['set-cookie'], undefined);
    response = await request(server, 'POST', '/v1/auth/register', { rawBody: '{' });
    assert.equal(response.status, 400);
    assert.equal(response.body.code, 'validation_error');
    response = await request(server, 'POST', '/v1/auth/register', { body: { email: 'a@example.com' }, headers: { 'Content-Type': 'text/plain' } });
    assert.equal(response.status, 415);
    response = await request(server, 'POST', '/v1/auth/register', { rawBody: 'null' });
    assert.equal(response.status, 400);
    response = await request(server, 'POST', '/v1/auth/register', { body: { email: 'a@example.com', password: 'long-enough-password', display_name: 'A' } });
    assert.equal(response.status, 202);
    assert.match(response.body.message, /verification/i);
    assert.equal(auth.calls.find(c => c[0] === 'register')[1].ref, null, 'no referral param means no ref is forwarded');

    response = await request(server, 'POST', '/v1/auth/register', { body: { email: 'b@example.com', password: 'long-enough-password', ref: 'Partner-01' } });
    assert.equal(response.status, 202);
    assert.equal(auth.calls.filter(c => c[0] === 'register').pop()[1].ref, 'partner-01', 'a valid ref is forwarded, lowercased');

    response = await request(server, 'POST', '/v1/auth/register', { body: { email: 'c@example.com', password: 'long-enough-password', ref: 'not a valid ref!!' } });
    assert.equal(response.status, 202, 'an invalid ref never blocks account creation');
    assert.equal(auth.calls.filter(c => c[0] === 'register').pop()[1].ref, null, 'an invalid ref is dropped, never forwarded as-is');

    response = await request(server, 'POST', '/v1/auth/login', { body: { email: 'a@example.com', password: 'long-enough-password' } });
    assert.equal(response.status, 204);
    const setCookies = response.headers['set-cookie'];
    assert.equal(setCookies.length, 2);
    const sessionCookie = setCookies.find(value => value.startsWith(`${SESSION_COOKIE}=`)).split(';')[0].split('=')[1];
    const csrfCookie = setCookies.find(value => value.startsWith(`${CSRF_COOKIE}=`)).split(';')[0].split('=')[1];
    assert.match(setCookies.find(value => value.startsWith(`${SESSION_COOKIE}=`)), /HttpOnly/);
    assert.match(setCookies.find(value => value.startsWith(`${SESSION_COOKIE}=`)), /Secure/);
    assert.match(setCookies.find(value => value.startsWith(`${SESSION_COOKIE}=`)), /SameSite=None/);

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

    // Real Premium lesson/lab content (mandate §6 audit, Lot 2) — the fix for
    // the leak this route exists to close: P2.1 is the free-preview lesson
    // and must be served to any authenticated learner regardless of Premium;
    // P2.2/LAB4/LABCAP require the exact same hasActivePremium() check as
    // /v1/premium/preview above.
    response = await request(server, 'GET', '/v1/premium/content/P2.1', { cookies: { [SESSION_COOKIE]: decodeURIComponent(sessionCookie) } });
    assert.equal(response.status, 200, 'P2.1 is a free preview — a Free user can read it');
    assert.equal(response.body.lesson.id, 'P2.1');
    assert.ok(response.body.lesson.blocks.length > 3, 'the real authored content is returned, not a stub');

    response = await request(server, 'GET', '/v1/premium/content/P2.2', { cookies: { [SESSION_COOKIE]: decodeURIComponent(sessionCookie) } });
    assert.equal(response.status, 403, 'Free user is denied the real P2.2 content, same as /v1/premium/preview');
    assert.equal(response.body.code, 'premium_required');
    response = await request(server, 'GET', '/v1/premium/content/LAB4', { cookies: { [SESSION_COOKIE]: decodeURIComponent(sessionCookie) } });
    assert.equal(response.status, 403, 'Free user is denied the real LAB4 content');
    response = await request(server, 'GET', '/v1/premium/content/LABCAP', { cookies: { [SESSION_COOKIE]: decodeURIComponent(sessionCookie) } });
    assert.equal(response.status, 403, 'Free user is denied the real LABCAP content');

    response = await request(server, 'GET', '/v1/premium/content/UNKNOWN-ID', { cookies: { [SESSION_COOKIE]: decodeURIComponent(sessionCookie) } });
    assert.equal(response.status, 404, 'an unknown lesson id is a plain 404, never a 403 that would confirm it exists');

    response = await request(server, 'GET', '/v1/premium/content/P2.2');
    assert.equal(response.status, 401, 'no session at all is rejected before any entitlement check runs');

    membership = { plan: 'premium', status: 'active', ends_at: null, revoked_at: null };
    entitlementNames = ['premium_track'];
    response = await request(server, 'GET', '/v1/premium/content/P2.2', { cookies: { [SESSION_COOKIE]: decodeURIComponent(sessionCookie) } });
    assert.equal(response.status, 200, 'a server-confirmed Premium entitlement unlocks the real P2.2 content');
    assert.equal(response.body.lesson.id, 'P2.2');
    assert.ok(JSON.stringify(response.body.lesson).includes('p22-quiz'), 'the real P2.2 quiz is actually returned');
    response = await request(server, 'GET', '/v1/premium/content/LAB4', { cookies: { [SESSION_COOKIE]: decodeURIComponent(sessionCookie) } });
    assert.equal(response.status, 200);
    assert.equal(response.body.lesson.id, 'LAB4');
    response = await request(server, 'GET', '/v1/premium/content/LABCAP', { cookies: { [SESSION_COOKIE]: decodeURIComponent(sessionCookie) } });
    assert.equal(response.status, 200);
    assert.equal(response.body.lesson.id, 'LABCAP');
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

    // P0 auth reliability audit (2026-11): a wrong password, an unconfirmed
    // email, a provider-side rate limit, and a transient outage must each
    // get their own status/code — collapsing them into one
    // "authentication_failed" 401 is the bug that made real users with a
    // correct password see "Mot de passe incorrect" after signup.
    response = await request(server, 'POST', '/v1/auth/login', { body: { email: 'a@example.com', password: 'wrong-password' } });
    assert.equal(response.status, 401);
    assert.equal(response.body.code, 'invalid_credentials');

    response = await request(server, 'POST', '/v1/auth/login', { body: { email: 'a@example.com', password: 'unconfirmed-account-password' } });
    assert.equal(response.status, 403, 'an unconfirmed email is never reported as a wrong password');
    assert.equal(response.body.code, 'email_not_confirmed');

    response = await request(server, 'POST', '/v1/auth/login', { body: { email: 'a@example.com', password: 'rate-limited-password' } });
    assert.equal(response.status, 429, 'a provider-side rate limit is never reported as a wrong password');
    assert.equal(response.body.code, 'rate_limited');

    response = await request(server, 'POST', '/v1/auth/login', { body: { email: 'a@example.com', password: 'provider-down-password' } });
    assert.equal(response.status, 503, 'a provider outage (no HTTP status at all) is never reported as a wrong password');
    assert.equal(response.body.code, 'server_error');
    const loginFailureLogs = logs.filter(entry => entry[0] === 'login_failed');
    assert.ok(loginFailureLogs.every(entry => !('password' in entry[1]) && !JSON.stringify(entry[1]).toLowerCase().includes('wrong')), 'no password or raw provider error text is ever logged');

    response = await request(server, 'POST', '/v1/auth/password-reset/confirm', { body: { password: 'short' } });
    assert.equal(response.status, 400);
    assert.equal(response.body.code, 'validation_error');
    response = await request(server, 'POST', '/v1/auth/password-reset/confirm', { body: { password: 'long-enough-password' } });
    assert.equal(response.status, 401, 'password update requires a verified recovery session');
  } finally { server.close(); }
  console.log('BFF implementation contract: PASS');
})();
