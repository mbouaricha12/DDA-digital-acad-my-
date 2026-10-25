'use strict';

const assert = require('node:assert/strict');
const { PostgrestAdminRolesStore } = require('../bff/src/admin-roles-store');
const { PostgrestBillingStore } = require('../bff/src/billing-store');
const { PostgrestSessionStore } = require('../bff/src/session-store');
const { SupabaseAuthAdapter } = require('../bff/src/supabase-auth');

function fakeResponse({ ok = true, body = [], contentRange } = {}) {
  return {
    ok,
    status: ok ? 200 : 500,
    headers: { get: name => (name.toLowerCase() === 'content-range' ? contentRange : undefined) },
    async text() { return JSON.stringify(body); }
  };
}

(async () => {
  // --- dda_admin_roles: PostgREST wiring, including the exact-count path ---
  {
    const calls = [];
    const fetchImpl = async (url, options) => {
      calls.push({ url, options });
      if (url.includes('role=eq.owner')) return fakeResponse({ body: [{ user_id: 'owner-1' }], contentRange: '0-0/2' });
      if (options.method === 'GET' && url.includes('user_id=eq.owner-1')) return fakeResponse({ body: [{ role: 'owner' }] });
      if (options.method === 'GET' && url.includes('user_id=eq.plain-1')) return fakeResponse({ body: [] });
      if (options.method === 'POST') return fakeResponse({ body: [{ user_id: 'admin-1', role: 'admin', granted_by: 'owner-1' }] });
      if (options.method === 'DELETE') return fakeResponse({ body: [] });
      throw new Error(`unexpected request: ${options.method} ${url}`);
    };
    const store = new PostgrestAdminRolesStore({ supabaseUrl: 'https://project.supabase.co', serviceRoleKey: 'service-role-secret', fetchImpl });

    assert.equal(await store.getRole('owner-1'), 'owner');
    assert.equal(await store.getRole('plain-1'), null, 'a user absent from the table has no role, never a guessed default');
    assert.equal(await store.countOwners(), 2);
    assert.match(calls[0].url, /\/rest\/v1\/dda_admin_roles\?user_id=eq\.owner-1&select=role$/);
    assert.equal(calls[0].options.headers.Authorization, 'Bearer service-role-secret');

    const assigned = await store.assignRole('admin-1', 'admin', 'owner-1');
    assert.equal(assigned.role, 'admin');
    const assignCall = calls.find(c => c.options.method === 'POST');
    assert.match(assignCall.url, /\?on_conflict=user_id$/);
    assert.match(assignCall.options.headers.Prefer, /merge-duplicates/);

    await assert.rejects(() => store.assignRole('x', 'owner', 'plain-1'), /owner_required|only an owner/i);
    await assert.rejects(() => store.assignRole('x', 'editor', 'owner-1'), /invalid_role|invalid role/i, 'editor/support/analyst are deferred and must still be rejected at the store layer');
  }

  // --- dda_billing_memberships: real per-status exact counts via Content-Range, never a client-side scan ---
  {
    const calls = [];
    const fetchImpl = async (url, options) => {
      calls.push({ url, options });
      if (url.includes('status=eq.active')) return fakeResponse({ contentRange: '0-0/5' });
      if (url.includes('status=eq.trial')) return fakeResponse({ contentRange: '0-0/0' });
      if (url.includes('status=eq.expired')) return fakeResponse({ contentRange: '0-0/2' });
      if (url.includes('status=eq.revoked')) return fakeResponse({ ok: false });
      if (url.includes('order=updated_at.desc')) return fakeResponse({ body: [{ user_id: 'u1', provider: 'chariow', status: 'active', product_id: 'prd', starts_at: null, ends_at: null, updated_at: '2026-10-20T00:00:00.000Z' }] });
      throw new Error(`unexpected request: ${options.method} ${url}`);
    };
    const store = new PostgrestBillingStore({ supabaseUrl: 'https://project.supabase.co', serviceRoleKey: 'service-role-secret', fetchImpl });
    const counts = await store.countMembershipsByStatus();
    assert.deepEqual(counts, { active: 5, trial: 0, expired: 2, revoked: null }, 'a failed count is reported as null/unavailable, never silently shown as zero');
    for (const call of calls.slice(0, 4)) assert.equal(call.options.headers.Prefer, 'count=exact');

    const items = await store.listMemberships({ page: 1, perPage: 50 });
    assert.equal(items.length, 1);
    assert.equal(items[0].user_id, 'u1');
  }

  // --- dda_sessions: active-session exact count ---
  {
    const fetchImpl = async url => {
      assert.match(url, /revoked_at=is\.null&expires_at=gt\./);
      return fakeResponse({ contentRange: '0-0/7' });
    };
    const store = new PostgrestSessionStore({ supabaseUrl: 'https://project.supabase.co', serviceRoleKey: 'service-role-secret', fetchImpl });
    assert.equal(await store.countActive(new Date('2026-10-24T00:00:00.000Z')), 7);
  }

  // --- Supabase Admin Auth API: listUsers never invents a total it cannot see, and never leaks secrets ---
  {
    const fetchImpl = async (url, options) => {
      assert.match(url, /\/auth\/v1\/admin\/users\?page=2&per_page=10$/);
      assert.equal(options.headers.Authorization, 'Bearer service-role-secret', 'listUsers must use the service role key, never the publishable key');
      return fakeResponse({ body: { users: [{ id: 'u1', email: 'a@example.com', email_confirmed_at: '2026-10-01T00:00:00.000Z', user_metadata: { display_name: 'A' }, banned_until: null, created_at: '2026-09-01T00:00:00.000Z', last_sign_in_at: '2026-10-20T00:00:00.000Z' }] } });
    };
    const auth = new SupabaseAuthAdapter({ supabaseUrl: 'https://project.supabase.co', publishableKey: 'publishable', serviceRoleKey: 'service-role-secret', fetchImpl });
    const result = await auth.listUsers({ page: 2, perPage: 10 });
    assert.equal(result.total, null, 'no total field in the raw response means unavailable, never a fabricated count');
    assert.deepEqual(result.users, [{ user_id: 'u1', email: 'a@example.com', email_verified: true, display_name: 'A', status: 'active', created_at: '2026-09-01T00:00:00.000Z', last_sign_in_at: '2026-10-20T00:00:00.000Z' }]);
    assert.equal(Object.hasOwn(result.users[0], 'password'), false);
    assert.equal(Object.hasOwn(result.users[0], 'encrypted_password'), false);
  }

  console.log('Admin store Postgrest wiring contract: PASS');
})().catch(error => { console.error(error); process.exitCode = 1; });
