'use strict';

const assert = require('node:assert/strict');
const http = require('node:http');
const { createBff, CSRF_COOKIE } = require('../bff/src/app');
const { MemorySessionStore } = require('../bff/src/session-store');
const { MemoryAdminRolesStore } = require('../bff/src/admin-roles-store');
const { sha256, randomToken } = require('../bff/src/security');

function request(server, method, path, { body, headers = {}, cookies = {} } = {}) {
  return new Promise((resolve, reject) => {
    const cookie = Object.entries(cookies).map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join('; ');
    const payload = body ? JSON.stringify(body) : '';
    const req = http.request({ ...server.address(), method, path, headers: { Origin: 'http://localhost:8744', ...(body ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {}), ...(cookie ? { Cookie: cookie } : {}), ...headers } }, res => {
      let text = ''; res.on('data', chunk => { text += chunk; }); res.on('end', () => resolve({ status: res.statusCode, body: text ? JSON.parse(text) : null }));
    });
    req.on('error', reject); if (payload) req.write(payload); req.end();
  });
}

// Double-submit CSRF: validateCsrf only checks the cookie and header match
// (plus Origin) — it is never tied to the session, so any token works here
// as long as it is sent both ways, exactly like a real browser would.
function withCsrf(sessionToken, extraCookies = {}) {
  const csrf = randomToken(16);
  return { cookies: { '__Host-dda_session': sessionToken, [CSRF_COOKIE]: csrf, ...extraCookies }, headers: { 'X-CSRF-Token': csrf } };
}

async function loginAs(sessions, userId) {
  const token = randomToken(32);
  const now = new Date('2026-10-24T00:00:00.000Z');
  await sessions.create({
    user_id: userId,
    token_hash: sha256(token),
    created_at: now.toISOString(),
    last_seen_at: now.toISOString(),
    expires_at: new Date(now.getTime() + 60 * 60 * 1000).toISOString()
  });
  return token;
}

function makeAuth(users) {
  return {
    async getUser(userId) {
      const user = users.find(u => u.user_id === userId);
      if (!user) throw Object.assign(new Error('not found'), { status: 404 });
      return user;
    },
    async listUsers({ page, perPage }) {
      const start = (page - 1) * perPage;
      return { total: users.length, users: users.slice(start, start + perPage) };
    }
  };
}

(async () => {
  const OWNER = 'owner-1';
  const ADMIN = 'admin-1';
  const PLAIN = 'plain-1';
  const users = [
    { user_id: OWNER, email: 'owner@dda.academy', email_verified: true, display_name: 'Owner', status: 'active', entitlements: [] },
    { user_id: ADMIN, email: 'admin@dda.academy', email_verified: true, display_name: 'Admin', status: 'active', entitlements: [] },
    { user_id: PLAIN, email: 'learner@example.com', email_verified: true, display_name: 'Learner', status: 'active', entitlements: [] }
  ];
  const auth = makeAuth(users);
  const sessions = new MemorySessionStore();
  const adminRoles = new MemoryAdminRolesStore({ [OWNER]: 'owner', [ADMIN]: 'admin' });
  const billingStore = {
    async countMembershipsByStatus() { return { active: 2, trial: 0, expired: 1, revoked: 0 }; },
    async listMemberships({ page, perPage }) { return [{ user_id: OWNER, provider: 'chariow', status: 'active', product_id: 'prd_premium', starts_at: '2026-10-01T00:00:00.000Z', ends_at: null, updated_at: '2026-10-20T00:00:00.000Z' }].slice((page - 1) * perPage, (page - 1) * perPage + perPage); }
  };
  const baseConfig = { allowedOrigins: ['http://localhost:8744'], secureCookies: true, sessionIdleMs: 60 * 60 * 1000, sessionAbsoluteMs: 24 * 60 * 60 * 1000, sessionEncryptionKey: null, emailRedirectTo: 'http://localhost:8744/access' };

  // --- 1. Fully wired: owner and admin can reach all three routes, a plain user cannot ---
  {
    const handler = createBff({ auth, sessions, adminRoles, billingStore, config: baseConfig, clock: () => new Date('2026-10-24T00:00:00.000Z') });
    const server = http.createServer(handler);
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    try {
      const ownerToken = await loginAs(sessions, OWNER);
      const adminToken = await loginAs(sessions, ADMIN);
      const plainToken = await loginAs(sessions, PLAIN);

      for (const [label, token] of [['owner', ownerToken], ['admin', adminToken]]) {
        let response = await request(server, 'GET', '/v1/admin/overview', { cookies: { __Host__dda_session_stub: token } });
        assert.equal(response.status, 401, `${label}: wrong cookie name must still be unauthenticated`);
      }

      let response = await request(server, 'GET', '/v1/admin/overview', { cookies: { '__Host-dda_session': ownerToken } });
      assert.equal(response.status, 200, 'owner reaches overview');
      assert.equal(response.body.contract, 'dda-admin-overview-v1');
      assert.equal(response.body.caller.role, 'owner');
      assert.deepEqual(response.body.metrics.memberships_by_status, { available: true, value: { active: 2, trial: 0, expired: 1, revoked: 0 }, source: 'dda_billing_memberships' });
      assert.equal(response.body.metrics.active_sessions.available, true);
      assert.equal(response.body.metrics.active_sessions.value, 3, 'owner, admin and plain sessions are all active');
      assert.equal(response.body.metrics.registered_users_total.available, false, 'an indicator that cannot be verified is reported as unavailable, never guessed');
      assert.ok(response.body.metrics.registered_users_total.reason, 'the unavailable indicator explains why');

      response = await request(server, 'GET', '/v1/admin/overview', { cookies: { '__Host-dda_session': adminToken } });
      assert.equal(response.status, 200, 'admin (not just owner) reaches overview');
      assert.equal(response.body.caller.role, 'admin');

      response = await request(server, 'GET', '/v1/admin/overview', { cookies: { '__Host-dda_session': plainToken } });
      assert.equal(response.status, 403, 'a learner with no admin role is refused');
      assert.equal(response.body.code, 'admin_role_required');

      response = await request(server, 'GET', '/v1/admin/overview');
      assert.equal(response.status, 401, 'no session at all is refused, not defaulted to any role');
      assert.equal(response.body.code, 'unauthenticated');

      response = await request(server, 'GET', '/v1/admin/users', { cookies: { '__Host-dda_session': ownerToken } });
      assert.equal(response.status, 200);
      assert.equal(response.body.contract, 'dda-admin-users-v1');
      assert.equal(response.body.total, 3);
      assert.equal(response.body.users.length, 3);
      const ownerRow = response.body.users.find(u => u.user_id === OWNER);
      assert.equal(ownerRow.role, 'owner');
      const plainRow = response.body.users.find(u => u.user_id === PLAIN);
      assert.equal(plainRow.role, null, 'a user with no admin row reports role: null, not a guessed default');
      for (const row of response.body.users) {
        assert.equal(Object.hasOwn(row, 'password'), false);
        assert.equal(Object.hasOwn(row, 'access_token'), false);
        assert.equal(Object.hasOwn(row, 'provider_access_token_enc'), false);
      }

      response = await request(server, 'GET', '/v1/admin/users', { cookies: { '__Host-dda_session': plainToken } });
      assert.equal(response.status, 403, 'users listing refuses a non-admin exactly like overview');

      response = await request(server, 'GET', '/v1/admin/memberships', { cookies: { '__Host-dda_session': adminToken } });
      assert.equal(response.status, 200);
      assert.equal(response.body.contract, 'dda-admin-memberships-v1');
      assert.deepEqual(response.body.items, [{ user_id: OWNER, provider: 'chariow', status: 'active', product_id: 'prd_premium', starts_at: '2026-10-01T00:00:00.000Z', ends_at: null, updated_at: '2026-10-20T00:00:00.000Z' }]);

      response = await request(server, 'GET', '/v1/admin/memberships', { cookies: { '__Host-dda_session': plainToken } });
      assert.equal(response.status, 403);

      // --- Role assignment/revocation: owner-only, CSRF-protected, server-derived ---
      response = await request(server, 'POST', '/v1/admin/roles', { ...withCsrf(adminToken), body: { user_id: PLAIN, role: 'admin' } });
      assert.equal(response.status, 403, 'an admin (not an owner) cannot grant a role, even with valid CSRF');
      assert.equal(response.body.code, 'owner_required');

      response = await request(server, 'POST', '/v1/admin/roles', { cookies: { '__Host-dda_session': ownerToken }, body: { user_id: PLAIN, role: 'admin' } });
      assert.equal(response.status, 403, 'no CSRF token at all is refused even for the real owner');
      assert.equal(response.body.code, 'csrf_failed');

      response = await request(server, 'POST', '/v1/admin/roles', { ...withCsrf(ownerToken), body: { user_id: PLAIN, role: 'superadmin' } });
      assert.equal(response.status, 400, 'an invented role is rejected, never silently coerced');
      assert.equal(response.body.code, 'validation_error');

      response = await request(server, 'POST', '/v1/admin/roles', { ...withCsrf(ownerToken), body: { user_id: PLAIN, role: 'admin' } });
      assert.equal(response.status, 200, 'the owner can grant admin to a plain user');
      assert.equal(response.body.role, 'admin');
      assert.equal(await adminRoles.getRole(PLAIN), 'admin');

      response = await request(server, 'DELETE', `/v1/admin/roles/${encodeURIComponent(ADMIN)}`, { ...withCsrf(adminToken) });
      assert.equal(response.status, 403, 'an admin cannot revoke anyone, including themselves');

      response = await request(server, 'DELETE', `/v1/admin/roles/${encodeURIComponent(PLAIN)}`, { ...withCsrf(ownerToken) });
      assert.equal(response.status, 204, 'the owner can revoke the role they just granted');
      assert.equal(await adminRoles.getRole(PLAIN), null);

      response = await request(server, 'DELETE', `/v1/admin/roles/${encodeURIComponent(OWNER)}`, { ...withCsrf(ownerToken) });
      assert.equal(response.status, 409, 'the last remaining owner cannot revoke themselves via this route either');
      assert.equal(response.body.code, 'last_owner_protected');
    } finally { server.close(); }
  }

  // --- 2. Configuration error: adminRoles store missing entirely must fail closed, never silently allow ---
  {
    const handler = createBff({ auth, sessions, billingStore, config: baseConfig, clock: () => new Date('2026-10-24T00:00:00.000Z') });
    const server = http.createServer(handler);
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    try {
      const ownerToken = await loginAs(sessions, OWNER);
      const response = await request(server, 'GET', '/v1/admin/overview', { cookies: { '__Host-dda_session': ownerToken } });
      assert.equal(response.status, 503, 'a missing admin role store is a configuration error, not an open door');
      assert.equal(response.body.code, 'admin_not_configured');
    } finally { server.close(); }
  }

  // --- 3. Role-store invariants: self-elevation and last-owner removal are impossible at the data layer ---
  {
    const roles = new MemoryAdminRolesStore({ [OWNER]: 'owner', [ADMIN]: 'admin' });
    await assert.rejects(() => roles.assignRole(ADMIN, 'owner', ADMIN), /owner_required|only an owner/i, 'an admin cannot grant themselves (or anyone) the owner role');
    await assert.rejects(() => roles.revokeRole(OWNER, ADMIN), /owner_required|only an owner/i, 'an admin cannot revoke anyone\'s role at all');
    await assert.rejects(() => roles.revokeRole(OWNER, OWNER), /last_owner_protected|last remaining owner/i, 'the only owner cannot remove themselves, leaving the platform ownerless');
    const assigned = await roles.assignRole(ADMIN, 'owner', OWNER);
    assert.equal(assigned.role, 'owner', 'an existing owner can promote another user to owner');
    await roles.revokeRole(OWNER, ADMIN);
    assert.equal(await roles.getRole(OWNER), null, 'with two owners, revoking one now succeeds');
  }

  console.log('Admin BFF routes contract: PASS');
})().catch(error => { console.error(error); process.exitCode = 1; });
