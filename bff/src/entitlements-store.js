'use strict';

// Admin-granted entitlements (supabase/migrations/0011_entitlements.sql) —
// complements bff/src/billing-store.js, never replaces it. A Chariow
// membership's entitlement_snapshot is computed entirely inside
// billing-store.js and this store never touches it; this store ONLY holds
// entitlements an owner granted by hand (gift access, support goodwill,
// partner access), independent of any payment event. The two are merged
// read-only in bff/src/app.js (currentEntitlements) — a row here can never
// override or suppress a real membership-derived entitlement, only add to
// it, and only while status is 'active' and not past expires_at.
//
// VALID_ENTITLEMENTS mirrors the same keys billing-store.js's Chariow
// transition already grants, so an admin can never invent a key the product
// doesn't actually gate on anything.
const { ENTITLEMENTS: VALID_ENTITLEMENTS } = require('./billing-store');

const USER_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function invalidEntitlementError() {
  return Object.assign(new Error(`entitlement_key must be one of: ${VALID_ENTITLEMENTS.join(', ')}`), { code: 'invalid_entitlement', status: 400 });
}

function notFoundError() {
  return Object.assign(new Error('No such entitlement grant for this user.'), { code: 'entitlement_not_found', status: 404 });
}

class MemoryEntitlementsStore {
  constructor() {
    this.rows = new Map(); // key: `${userId}:${entitlementKey}` -> row
  }

  async listForUser(userId) {
    return [...this.rows.values()].filter(row => row.user_id === userId);
  }

  async grant(userId, entitlementKey, { grantedBy, reason, expiresAt = null } = {}) {
    if (!VALID_ENTITLEMENTS.includes(entitlementKey)) throw invalidEntitlementError();
    const key = `${userId}:${entitlementKey}`;
    const now = new Date().toISOString();
    const row = {
      id: key,
      user_id: userId,
      entitlement_key: entitlementKey,
      status: 'active',
      granted_by: grantedBy,
      reason,
      expires_at: expiresAt,
      created_at: this.rows.get(key)?.created_at || now,
      updated_at: now
    };
    this.rows.set(key, row);
    return row;
  }

  async setStatus(userId, entitlementKey, status) {
    const key = `${userId}:${entitlementKey}`;
    const row = this.rows.get(key);
    if (!row) throw notFoundError();
    row.status = status;
    row.updated_at = new Date().toISOString();
    return row;
  }

  async revoke(userId, entitlementKey) {
    const key = `${userId}:${entitlementKey}`;
    if (!this.rows.has(key)) throw notFoundError();
    this.rows.delete(key);
  }
}

class PostgrestEntitlementsStore {
  constructor({ supabaseUrl, serviceRoleKey, fetchImpl = fetch }) {
    if (!supabaseUrl || !serviceRoleKey) throw new Error('Supabase entitlements store requires URL and service role key');
    this.base = `${String(supabaseUrl).replace(/\/$/, '')}/rest/v1/dda_entitlements`;
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
    if (!response.ok) {
      if (response.status === 406 || response.status === 409) throw notFoundError();
      throw new Error(`entitlements store error ${response.status}`);
    }
    const text = await response.text();
    return text ? JSON.parse(text) : [];
  }

  async listForUser(userId) {
    if (!USER_ID.test(String(userId || ''))) throw new Error('entitlements lookup requires a valid DDA UUID');
    return this.request(`?user_id=eq.${encodeURIComponent(userId)}&select=*&order=entitlement_key.asc`, { method: 'GET' });
  }

  async grant(userId, entitlementKey, { grantedBy, reason, expiresAt = null } = {}) {
    if (!VALID_ENTITLEMENTS.includes(entitlementKey)) throw invalidEntitlementError();
    const rows = await this.request('?on_conflict=user_id,entitlement_key', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify({
        user_id: userId,
        entitlement_key: entitlementKey,
        status: 'active',
        granted_by: grantedBy,
        reason,
        expires_at: expiresAt,
        updated_at: new Date().toISOString()
      })
    });
    return rows[0];
  }

  async setStatus(userId, entitlementKey, status) {
    const rows = await this.request(`?user_id=eq.${encodeURIComponent(userId)}&entitlement_key=eq.${encodeURIComponent(entitlementKey)}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, updated_at: new Date().toISOString() })
    });
    if (!rows.length) throw notFoundError();
    return rows[0];
  }

  async revoke(userId, entitlementKey) {
    const rows = await this.request(`?user_id=eq.${encodeURIComponent(userId)}&entitlement_key=eq.${encodeURIComponent(entitlementKey)}`, { method: 'DELETE' });
    if (!rows.length) throw notFoundError();
  }
}

module.exports = { VALID_ENTITLEMENTS, MemoryEntitlementsStore, PostgrestEntitlementsStore };
