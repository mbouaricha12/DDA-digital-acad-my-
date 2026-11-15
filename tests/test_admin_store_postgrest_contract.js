'use strict';

const assert = require('node:assert/strict');
const { PostgrestAdminRolesStore } = require('../bff/src/admin-roles-store');
const { PostgrestBillingStore } = require('../bff/src/billing-store');
const { PostgrestSessionStore } = require('../bff/src/session-store');
const { SupabaseAuthAdapter } = require('../bff/src/supabase-auth');

function fakeResponse({ ok = true, body = [], contentRange, rawText } = {}) {
  return {
    ok,
    status: ok ? 200 : 500,
    headers: { get: name => (name.toLowerCase() === 'content-range' ? contentRange : undefined) },
    async text() { return rawText === undefined ? JSON.stringify(body) : rawText; }
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

  // --- dda_admin_roles: PostgREST revocation is owner-only and fail-closed for the last owner ---
  {
    const calls = [];
    const roles = new Map([['owner-1', 'owner'], ['owner-2', 'owner'], ['admin-1', 'admin'], ['plain-1', 'learner']]);
    let ownerCountRange = '0-0/1';
    const fetchImpl = async (url, options) => {
      calls.push({ url, options });
      if (options.method === 'GET' && url.includes('role=eq.owner')) {
        return fakeResponse({ body: [{ user_id: 'owner-1' }], contentRange: ownerCountRange });
      }
      if (options.method === 'GET' && url.includes('user_id=eq.')) {
        const encodedId = url.split('user_id=eq.')[1].split('&')[0];
        const role = roles.get(decodeURIComponent(encodedId));
        return fakeResponse({ body: role ? [{ role }] : [] });
      }
      if (options.method === 'DELETE') return fakeResponse({ body: [] });
      throw new Error(`unexpected admin-role request: ${options.method} ${url}`);
    };
    const store = new PostgrestAdminRolesStore({ supabaseUrl: 'https://project.supabase.co', serviceRoleKey: 'service-role-secret', fetchImpl });

    await assert.rejects(() => store.revokeRole('admin-1', 'plain-1'), error => error.code === 'owner_required' && error.status === 403);
    await assert.rejects(() => store.revokeRole('owner-1', 'owner-1'), error => error.code === 'last_owner_protected' && error.status === 409);
    ownerCountRange = null;
    await assert.rejects(() => store.revokeRole('owner-1', 'owner-1'), error => error.code === 'last_owner_protected' && error.status === 409,
      'a missing exact-count header must fail closed rather than permit removal of the last owner');
    assert.equal(calls.filter(call => call.options.method === 'DELETE').length, 0);

    ownerCountRange = '0-0/2';
    await store.revokeRole('owner-2', 'owner-1');
    await store.revokeRole('admin-1', 'owner-1');
    const deletes = calls.filter(call => call.options.method === 'DELETE');
    assert.equal(deletes.length, 2);
    assert.match(deletes[0].url, /\?user_id=eq\.owner-2$/);
    assert.match(deletes[1].url, /\?user_id=eq\.admin-1$/);
    assert.ok(deletes.every(call => call.options.headers.Authorization === 'Bearer service-role-secret'));
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

  // --- dda_sessions: PostgREST CRUD filters, timestamp writes, exact counts, and failures ---
  {
    const calls = [];
    const now = new Date('2026-11-15T22:00:00.000Z');
    const sessionRow = {
      session_id: 'session/one', user_id: 'user-1', token_hash: 'hash+/=',
      created_at: '2026-11-15T20:00:00.000Z', last_seen_at: now.toISOString(),
      expires_at: '2026-11-16T22:00:00.000Z', revoked_at: null, user_agent: 'Browser'
    };
    let activeLookup = [sessionRow];
    let patchRows = [sessionRow];
    let sessionCountRange = '0-0/7';
    const fetchImpl = async (url, options) => {
      calls.push({ url, options });
      if (options.method === 'POST') return fakeResponse({ body: [sessionRow] });
      if (url.includes('select=session_id&limit=1')) return fakeResponse({ contentRange: sessionCountRange });
      if (options.method === 'GET' && url.includes('token_hash=eq.')) return fakeResponse({ body: activeLookup });
      if (options.method === 'GET' && url.includes('approximate_device:user_agent')) return fakeResponse({ body: [{
        session_id: sessionRow.session_id, created_at: sessionRow.created_at,
        last_seen_at: sessionRow.last_seen_at, approximate_device: sessionRow.user_agent
      }] });
      if (options.method === 'PATCH' && url.includes('session_id=eq.') && JSON.parse(options.body).revoked_at) {
        return fakeResponse({ rawText: '' });
      }
      if (options.method === 'PATCH' && url.includes('session_id=eq.')) return fakeResponse({ body: patchRows });
      if (options.method === 'PATCH' && url.includes('user_id=eq.')) return fakeResponse({ body: [] });
      throw new Error(`unexpected session request: ${options.method} ${url}`);
    };
    const store = new PostgrestSessionStore({ supabaseUrl: 'https://project.supabase.co', serviceRoleKey: 'service-role-secret', fetchImpl });

    assert.equal((await store.create({ user_id: 'user-1', token_hash: 'hash+/=' })).session_id, 'session/one');
    const createdCall = calls.find(call => call.options.method === 'POST');
    assert.deepEqual(JSON.parse(createdCall.options.body), { user_id: 'user-1', token_hash: 'hash+/=' });
    assert.equal(createdCall.options.headers.Authorization, 'Bearer service-role-secret');

    const found = await store.findActiveByTokenHash('hash+/=', now);
    assert.equal(found.session_id, 'session/one');
    const findCall = calls.find(call => call.url.includes('token_hash=eq.'));
    assert.match(findCall.url, /token_hash=eq\.hash%2B%2F%3D/);
    assert.match(findCall.url, /revoked_at=is\.null/);
    assert.ok(findCall.url.includes(`expires_at=gt.${encodeURIComponent(now.toISOString())}`));
    activeLookup = [];
    assert.equal(await store.findActiveByTokenHash('missing', now), null);

    assert.equal((await store.touch('session/one', now)).last_seen_at, now.toISOString());
    const touchCall = calls.filter(call => call.options.method === 'PATCH').at(-1);
    assert.match(touchCall.url, /session_id=eq\.session%2Fone$/);
    assert.deepEqual(JSON.parse(touchCall.options.body), { last_seen_at: now.toISOString() });
    patchRows = [];
    assert.equal(await store.touch('missing', now), null);

    await store.revoke('session/one', now);
    const revokeCall = calls.filter(call => call.options.method === 'PATCH').at(-1);
    assert.deepEqual(JSON.parse(revokeCall.options.body), { revoked_at: now.toISOString() });
    await store.revokeAll('user/one', now);
    const revokeAllCall = calls.filter(call => call.options.method === 'PATCH').at(-1);
    assert.match(revokeAllCall.url, /user_id=eq\.user%2Fone&revoked_at=is\.null$/);
    assert.deepEqual(JSON.parse(revokeAllCall.options.body), { revoked_at: now.toISOString() });

    const listed = await store.list('user/one');
    assert.equal(listed[0].approximate_device, 'Browser');
    const listCall = calls.find(call => call.url.includes('approximate_device:user_agent'));
    assert.match(listCall.url, /user_id=eq\.user%2Fone&revoked_at=is\.null/);
    assert.ok(calls.filter(call => call.options.method !== 'GET' || !call.url.includes('select=session_id&limit=1'))
      .filter(call => call.options.method !== 'GET').every(call => call.options.headers.Prefer === 'return=representation'));

    assert.equal(await store.countActive(now), 7);
    sessionCountRange = null;
    assert.equal(await store.countActive(now), null, 'a malformed exact-count response must remain unavailable, not become zero');
    const unavailableCounts = new PostgrestSessionStore({
      supabaseUrl: 'https://project.supabase.co', serviceRoleKey: 'service-role-secret',
      fetchImpl: async () => fakeResponse({ ok: false })
    });
    assert.equal(await unavailableCounts.countActive(now), null, 'a failed count request must remain unavailable');
    const failingStore = new PostgrestSessionStore({
      supabaseUrl: 'https://project.supabase.co', serviceRoleKey: 'service-role-secret',
      fetchImpl: async () => fakeResponse({ ok: false })
    });
    await assert.rejects(() => failingStore.list('user-1'), /session store error 500/);
  }

  // --- Supabase Admin Auth API: listUsers never invents a total it cannot see, and never leaks secrets ---
  {
    const fetchImpl = async (url, options) => {
      assert.match(url, /\/auth\/v1\/admin\/users\?page=2&per_page=10$/);
      assert.equal(options.headers.Authorization, 'Bearer service-role-secret', 'listUsers must use the service role key, never the publishable key');
      return fakeResponse({ body: { users: [
        { id: 'u1', email: 'a@example.com', email_confirmed_at: '2026-10-01T00:00:00.000Z', user_metadata: { display_name: 'A' }, banned_until: null, created_at: '2026-09-01T00:00:00.000Z', last_sign_in_at: '2026-10-20T00:00:00.000Z' },
        { id: 'u2', email: 'b@example.com', email_confirmed_at: '2026-10-01T00:00:00.000Z', user_metadata: { display_name: 'B', ref: 'youtube-ama' }, banned_until: null, created_at: '2026-09-02T00:00:00.000Z', last_sign_in_at: null }
      ] } });
    };
    const auth = new SupabaseAuthAdapter({ supabaseUrl: 'https://project.supabase.co', publishableKey: 'publishable', serviceRoleKey: 'service-role-secret', fetchImpl });
    const result = await auth.listUsers({ page: 2, perPage: 10 });
    assert.equal(result.total, null, 'no total field in the raw response means unavailable, never a fabricated count');
    assert.deepEqual(result.users, [
      { user_id: 'u1', email: 'a@example.com', email_verified: true, display_name: 'A', status: 'active', ref: null, created_at: '2026-09-01T00:00:00.000Z', last_sign_in_at: '2026-10-20T00:00:00.000Z' },
      { user_id: 'u2', email: 'b@example.com', email_verified: true, display_name: 'B', status: 'active', ref: 'youtube-ama', created_at: '2026-09-02T00:00:00.000Z', last_sign_in_at: null }
    ]);
    assert.equal(Object.hasOwn(result.users[0], 'password'), false);
    assert.equal(Object.hasOwn(result.users[0], 'encrypted_password'), false);
  }

  console.log('Admin store Postgrest wiring contract: PASS');
})().catch(error => { console.error(error); process.exitCode = 1; });
