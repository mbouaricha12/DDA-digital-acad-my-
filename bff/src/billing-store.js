'use strict';

const { sha256 } = require('./security');

const USER_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ENTITLEMENTS = ['premium_track', 'resources_premium', 'certificate_preview', 'advanced_modules'];

class PostgrestBillingStore {
  constructor({ supabaseUrl, serviceRoleKey, fetchImpl = fetch }) {
    if (!supabaseUrl || !serviceRoleKey) throw new Error('Supabase billing store requires URL and service role key');
    this.base = `${String(supabaseUrl).replace(/\/$/, '')}/rest/v1`;
    this.key = serviceRoleKey;
    this.fetch = fetchImpl;
  }

  async request(table, query = '', options = {}) {
    const response = await this.rawRequest(table, query, options);
    if (!response.ok) throw new Error(`billing store error ${response.status}`);
    const text = await response.text();
    return text ? JSON.parse(text) : [];
  }

  async rawRequest(table, query = '', options = {}) {
    return this.fetch(`${this.base}/${table}${query}`, {
      ...options,
      headers: {
        apikey: this.key,
        Authorization: `Bearer ${this.key}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
        ...(options.headers || {})
      }
    });
  }

  async claim(deliveryId, metadata = {}) {
    const insertedRows = await this.request('dda_billing_deliveries', '', {
      method: 'POST',
      headers: { Prefer: 'resolution=ignore-duplicates,return=representation' },
      body: JSON.stringify({
        delivery_id: deliveryId,
        provider: 'chariow',
        event_name: metadata.event || null,
        payload_sha256: metadata.payloadSha256 || null,
        processed_status: 'accepted',
        received_at: metadata.receivedAt || new Date().toISOString()
      })
    });
    if (insertedRows.length > 0) return true;
    // delivery_id already exists. Only a delivery whose previous attempt ended in 'failed' may be
    // re-claimed and retried — one still 'accepted' (in flight, or a concurrent duplicate) or already
    // 'processed' must stay deduplicated. The WHERE clause makes this a single atomic compare-and-set:
    // Postgres serializes concurrent UPDATEs on the same row, so at most one retry can win it.
    const retriedRows = await this.request(
      'dda_billing_deliveries',
      `?delivery_id=eq.${encodeURIComponent(deliveryId)}&processed_status=eq.failed`,
      {
        method: 'PATCH',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify({
          processed_status: 'accepted',
          event_name: metadata.event || null,
          payload_sha256: metadata.payloadSha256 || null,
          received_at: metadata.receivedAt || new Date().toISOString(),
          processed_at: null
        })
      }
    );
    return retriedRows.length > 0;
  }

  async has(deliveryId) {
    const rows = await this.request('dda_billing_deliveries', `?delivery_id=eq.${encodeURIComponent(deliveryId)}&select=delivery_id`, { method: 'GET' });
    return rows.length > 0;
  }

  async add(deliveryId, metadata = {}) {
    return this.claim(deliveryId, metadata);
  }

  async markProcessed(deliveryId, status = 'processed') {
    await this.request('dda_billing_deliveries', `?delivery_id=eq.${encodeURIComponent(deliveryId)}`, {
      method: 'PATCH',
      body: JSON.stringify({ processed_status: status, processed_at: new Date().toISOString() })
    });
  }

  async recordRawPayload(deliveryId, rawBody) {
    await this.request('dda_billing_deliveries', `?delivery_id=eq.${encodeURIComponent(deliveryId)}`, {
      method: 'PATCH',
      body: JSON.stringify({ payload_sha256: sha256(rawBody) })
    });
  }

  async applyChariowTransition(transition) {
    if (!transition || transition.kind !== 'membership_transition') return null;
    if (!USER_ID.test(String(transition.userReference || ''))) throw new Error('Chariow transition requires a server-owned DDA UUID');
    const active = transition.status === 'active';
    const row = {
      user_id: transition.userReference,
      provider: 'chariow',
      provider_customer_id: transition.customer?.externalCustomerId || null,
      product_id: transition.productId,
      sale_id: transition.saleId,
      license_id: transition.licenseId,
      external_id: transition.externalId,
      status: transition.status,
      entitlement_snapshot: active ? ENTITLEMENTS : [],
      source_event: transition.event,
      starts_at: active ? (transition.occurredAt || new Date().toISOString()) : null,
      ends_at: transition.status === 'expired' ? (transition.occurredAt || new Date().toISOString()) : null,
      updated_at: new Date().toISOString()
    };
    const rows = await this.request('dda_billing_memberships', '?on_conflict=provider,external_id', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify(row)
    });
    return rows[0] || null;
  }

  async getForUser(userId) {
    if (!USER_ID.test(String(userId || ''))) throw new Error('billing lookup requires a valid DDA UUID');
    const rows = await this.request('dda_billing_memberships', `?user_id=eq.${encodeURIComponent(userId)}&status=eq.active&order=updated_at.desc&limit=1&select=*`, { method: 'GET' });
    const membership = rows[0] || null;
    return {
      membership: membership ? {
        provider: membership.provider,
        status: membership.status,
        ends_at: membership.ends_at || null,
        revoked_at: membership.status === 'revoked' ? membership.updated_at : null,
        product_id: membership.product_id,
        external_id: membership.external_id
      } : null,
      entitlements: Array.isArray(membership?.entitlement_snapshot) ? membership.entitlement_snapshot : []
    };
  }

  async deleteUserData(userId) {
    if (!USER_ID.test(String(userId || ''))) throw new Error('billing deletion requires a valid DDA UUID');
    await this.request('dda_billing_memberships', `?user_id=eq.${encodeURIComponent(userId)}`, { method: 'DELETE' });
  }

  // Real, per-status counts for the admin overview — one exact COUNT per
  // status via PostgREST's Content-Range, never a client-side scan of every
  // row. A status this query cannot reach is reported as unavailable rather
  // than silently shown as zero.
  async countMembershipsByStatus() {
    const statuses = ['active', 'trial', 'expired', 'revoked'];
    const counts = {};
    for (const status of statuses) {
      const response = await this.rawRequest('dda_billing_memberships', `?status=eq.${encodeURIComponent(status)}&select=user_id&limit=1`, {
        method: 'GET',
        headers: { Prefer: 'count=exact' }
      });
      if (!response.ok) { counts[status] = null; continue; }
      const range = response.headers?.get?.('content-range') || '';
      const match = /\/(\d+)$/.exec(range);
      counts[status] = match ? Number(match[1]) : null;
    }
    return counts;
  }

  async listMemberships({ page = 1, perPage = 50 } = {}) {
    const offset = (Math.max(1, page) - 1) * perPage;
    const rows = await this.request('dda_billing_memberships', `?select=user_id,provider,status,product_id,starts_at,ends_at,updated_at&order=updated_at.desc&limit=${perPage}&offset=${offset}`, { method: 'GET' });
    return rows;
  }
}

module.exports = { PostgrestBillingStore, ENTITLEMENTS };
