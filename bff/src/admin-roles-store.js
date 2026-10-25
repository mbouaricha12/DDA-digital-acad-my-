'use strict';

// Server-side owner/admin role lookup and assignment, backed by
// public.dda_admin_roles (supabase/migrations/0007_admin_roles.sql). That
// table has NO grant to anon or authenticated at all — only the service
// role (this store, running inside the BFF) can ever read or write it. A
// role carried by the browser (a cookie, a header, localStorage) is never
// consulted: every admin route re-derives the caller's role from this
// store, keyed by the user_id the session already proved server-side.
//
// assignRole/revokeRole are not wired to any HTTP route yet (no admin
// mutation route exists in this slice — only read routes do). They exist
// now, with their invariants enforced and tested, so that a future
// role-management route has nothing left to get wrong:
//   - only an existing owner may assign or revoke a role (self-elevation
//     from admin to owner is impossible: the acting user's OWN role is
//     checked, not the role being granted);
//   - the last remaining owner can never be revoked or demoted.

const VALID_ROLES = Object.freeze(['owner', 'admin']);

function ownerRequiredError() {
  return Object.assign(new Error('Only an owner may assign or revoke an admin role.'), { code: 'owner_required', status: 403 });
}

function lastOwnerError() {
  return Object.assign(new Error('The last remaining owner cannot be removed or demoted.'), { code: 'last_owner_protected', status: 409 });
}

class MemoryAdminRolesStore {
  constructor(seed = {}) {
    this.roles = new Map(Object.entries(seed));
  }

  async getRole(userId) {
    return this.roles.get(userId) || null;
  }

  async countOwners() {
    let count = 0;
    for (const role of this.roles.values()) if (role === 'owner') count++;
    return count;
  }

  async assignRole(userId, role, actingUserId) {
    if (!VALID_ROLES.includes(role)) throw Object.assign(new Error('invalid role'), { code: 'invalid_role', status: 400 });
    if (this.roles.get(actingUserId) !== 'owner') throw ownerRequiredError();
    this.roles.set(userId, role);
    return { user_id: userId, role };
  }

  async revokeRole(userId, actingUserId) {
    if (this.roles.get(actingUserId) !== 'owner') throw ownerRequiredError();
    if (this.roles.get(userId) === 'owner' && (await this.countOwners()) <= 1) throw lastOwnerError();
    this.roles.delete(userId);
  }
}

class PostgrestAdminRolesStore {
  constructor({ supabaseUrl, serviceRoleKey, fetchImpl = fetch }) {
    if (!supabaseUrl || !serviceRoleKey) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
    this.base = `${String(supabaseUrl).replace(/\/$/, '')}/rest/v1/dda_admin_roles`;
    this.key = serviceRoleKey;
    this.fetch = fetchImpl;
  }

  async request(query = '', options = {}) {
    const response = await this.fetch(`${this.base}${query}`, {
      ...options,
      headers: {
        apikey: this.key,
        Authorization: `Bearer ${this.key}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
        ...(options.headers || {})
      }
    });
    if (!response.ok) throw new Error(`admin roles store error ${response.status}`);
    const text = await response.text();
    return { body: text ? JSON.parse(text) : null, headers: response.headers };
  }

  async getRole(userId) {
    const { body } = await this.request(`?user_id=eq.${encodeURIComponent(userId)}&select=role`, { method: 'GET' });
    return body?.[0]?.role || null;
  }

  async countOwners() {
    const { headers } = await this.request('?role=eq.owner&select=user_id&limit=1', {
      method: 'GET',
      headers: { Prefer: 'count=exact' }
    });
    const range = headers?.get?.('content-range') || '';
    const match = /\/(\d+)$/.exec(range);
    return match ? Number(match[1]) : null;
  }

  async assignRole(userId, role, actingUserId) {
    if (!VALID_ROLES.includes(role)) throw Object.assign(new Error('invalid role'), { code: 'invalid_role', status: 400 });
    if ((await this.getRole(actingUserId)) !== 'owner') throw ownerRequiredError();
    const { body } = await this.request('?on_conflict=user_id', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify({ user_id: userId, role, granted_by: actingUserId })
    });
    return body?.[0] || { user_id: userId, role };
  }

  async revokeRole(userId, actingUserId) {
    if ((await this.getRole(actingUserId)) !== 'owner') throw ownerRequiredError();
    if ((await this.getRole(userId)) === 'owner' && (await this.countOwners()) <= 1) throw lastOwnerError();
    await this.request(`?user_id=eq.${encodeURIComponent(userId)}`, { method: 'DELETE' });
  }
}

module.exports = { VALID_ROLES, MemoryAdminRolesStore, PostgrestAdminRolesStore };
