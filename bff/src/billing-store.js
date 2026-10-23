'use strict';

const { sha256 } = require('./security');
const { ENTITLEMENTS, AUTOTRADER_ANALYSIS_ENTITLEMENT, normalizeEntitlements } = require('./entitlement-catalog');

const USER_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MEMBERSHIP_STATUSES = new Set(['pending', 'active', 'expired', 'revoked']);
const DELIVERY_CLAIM_LEASE_MS = 10 * 60 * 1000;

function dateIsAtOrBefore(value, asOf) {
  if (value === null || value === undefined || value === '') return true;
  const time = new Date(value).getTime();
  return Number.isFinite(time) && time <= asOf.getTime();
}

function dateIsAfter(value, asOf) {
  if (value === null || value === undefined || value === '') return true;
  const time = new Date(value).getTime();
  return Number.isFinite(time) && time > asOf.getTime();
}

class PostgrestBillingStore {
  constructor({ supabaseUrl, serviceRoleKey, fetchImpl = fetch, clock = () => new Date() }) {
    if (!supabaseUrl || !serviceRoleKey) throw new Error('Supabase billing store requires URL and service role key');
    this.base = `${String(supabaseUrl).replace(/\/$/, '')}/rest/v1`;
    this.key = serviceRoleKey;
    this.fetch = fetchImpl;
    this.clock = clock;
  }

  async request(table, query = '', options = {}) {
    const response = await this.fetch(`${this.base}/${table}${query}`, {
      ...options,
      headers: {
        apikey: this.key,
        Authorization: `Bearer ${this.key}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
        ...(options.headers || {})
      }
    });
    if (!response.ok) throw new Error(`billing store error ${response.status}`);
    const text = await response.text();
    return text ? JSON.parse(text) : [];
  }

  async claim(deliveryId, metadata = {}) {
    const receivedAt = new Date(metadata.receivedAt || this.clock()).toISOString();
    const rows = await this.request('dda_billing_deliveries', '', {
      method: 'POST',
      headers: { Prefer: 'resolution=ignore-duplicates,return=representation' },
      body: JSON.stringify({
        delivery_id: deliveryId,
        provider: 'chariow',
        event_name: metadata.event || null,
        payload_sha256: metadata.payloadSha256 || null,
        processed_status: 'accepted',
        received_at: receivedAt
      })
    });
    if (rows.length > 0) return true;
    const retryPayload = {
      processed_status: 'accepted',
      received_at: receivedAt,
      processed_at: null,
      event_name: metadata.event || null,
      payload_sha256: metadata.payloadSha256 || null
    };
    const failed = await this.request(
      'dda_billing_deliveries',
      `?delivery_id=eq.${encodeURIComponent(deliveryId)}&processed_status=eq.failed`,
      { method: 'PATCH', body: JSON.stringify(retryPayload) }
    );
    if (failed.length > 0) return true;

    // Recover a worker crash only after the lease has expired. The conditional
    // PATCH is compare-and-swap: only one concurrent duplicate can acquire it.
    const staleBefore = new Date(new Date(receivedAt).getTime() - DELIVERY_CLAIM_LEASE_MS).toISOString();
    const stale = await this.request(
      'dda_billing_deliveries',
      `?delivery_id=eq.${encodeURIComponent(deliveryId)}&processed_status=eq.accepted&received_at=lt.${encodeURIComponent(staleBefore)}`,
      { method: 'PATCH', body: JSON.stringify(retryPayload) }
    );
    return stale.length > 0;
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
    if (!MEMBERSHIP_STATUSES.has(transition.status)) throw new Error('Chariow transition has an unsupported membership status');

    const requestedEntitlements = Array.isArray(transition.entitlements)
      ? transition.entitlements
      : (transition.entitlement ? [transition.entitlement] : []);
    const normalized = normalizeEntitlements(requestedEntitlements);
    if (normalized.length !== new Set(requestedEntitlements).size || requestedEntitlements.some(value => !normalized.includes(value))) {
      throw new Error('Chariow transition contains an unknown entitlement');
    }
    if (transition.status === 'active' && normalized.length === 0) throw new Error('active Chariow transition requires an explicit product entitlement');
    if (transition.status !== 'active' && normalized.length > 0) throw new Error('inactive Chariow transition cannot carry entitlements');

    const active = transition.status === 'active';
    const eventTime = transition.occurredAt ? new Date(transition.occurredAt) : null;
    const eventTimeValid = Boolean(eventTime && Number.isFinite(eventTime.getTime()));
    if (['active', 'expired', 'revoked'].includes(transition.status) && !eventTimeValid) {
      throw new Error('Chariow access transition requires a valid provider event timestamp');
    }
    const sourceOccurredAt = eventTimeValid ? eventTime.toISOString() : this.clock().toISOString();
    const row = {
      user_id: transition.userReference,
      provider: 'chariow',
      provider_customer_id: transition.customer?.externalCustomerId || null,
      product_id: transition.productId,
      sale_id: transition.saleId,
      license_id: transition.licenseId,
      external_id: transition.externalId,
      status: transition.status,
      entitlement_snapshot: active ? normalized : [],
      source_event: transition.event,
      source_occurred_at: sourceOccurredAt,
      starts_at: active ? sourceOccurredAt : null,
      ends_at: ['expired', 'revoked'].includes(transition.status) ? sourceOccurredAt : null,
      updated_at: this.clock().toISOString()
    };
    const rows = await this.request('dda_billing_memberships', '?on_conflict=provider,external_id', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify(row)
    });
    return rows[0] || null;
  }

  async getForUser(userId, asOf = this.clock()) {
    if (!USER_ID.test(String(userId || ''))) throw new Error('billing lookup requires a valid DDA UUID');
    const now = asOf instanceof Date ? asOf : new Date(asOf);
    if (!Number.isFinite(now.getTime())) throw new Error('billing lookup requires a valid as-of timestamp');
    const rows = await this.request(
      'dda_billing_memberships',
      `?user_id=eq.${encodeURIComponent(userId)}&status=eq.active&order=updated_at.desc&select=*`,
      { method: 'GET' }
    );
    const memberships = rows
      .filter(row => row?.status === 'active' && dateIsAtOrBefore(row.starts_at, now) && dateIsAfter(row.ends_at, now))
      .map(row => ({
        provider: row.provider,
        status: row.status,
        starts_at: row.starts_at || null,
        ends_at: row.ends_at || null,
        revoked_at: null,
        product_id: row.product_id,
        external_id: row.external_id,
        entitlements: normalizeEntitlements(row.entitlement_snapshot)
      }));
    const entitlements = [...new Set(memberships.flatMap(membership => membership.entitlements))];
    return {
      membership: memberships[0] || null,
      memberships,
      entitlements
    };
  }

  async deleteUserData(userId) {
    if (!USER_ID.test(String(userId || ''))) throw new Error('billing deletion requires a valid DDA UUID');
    await this.request('dda_billing_memberships', `?user_id=eq.${encodeURIComponent(userId)}`, { method: 'DELETE' });
  }
}

module.exports = { PostgrestBillingStore, ENTITLEMENTS, AUTOTRADER_ANALYSIS_ENTITLEMENT, DELIVERY_CLAIM_LEASE_MS };
