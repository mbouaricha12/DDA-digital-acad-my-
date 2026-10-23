'use strict';

const { userAnalysisReservations, providerUsageReservations } = require('./quota-policy');

class PostgrestQuotaStore {
  constructor({ supabaseUrl, serviceRoleKey, fetchImpl = fetch }) {
    if (!supabaseUrl || !serviceRoleKey) throw new Error('Supabase quota store requires URL and service role key');
    this.base = `${String(supabaseUrl).replace(/\/$/, '')}/rest/v1`;
    this.key = serviceRoleKey;
    this.fetch = fetchImpl;
  }

  async reserve(reservations) {
    if (!Array.isArray(reservations) || reservations.length < 1 || reservations.length > 8) {
      throw new Error('quota reservation bundle must contain between one and eight buckets');
    }
    const response = await this.fetch(`${this.base}/rpc/reserve_dda_autotrader_quota`, {
      method: 'POST',
      headers: {
        apikey: this.key,
        Authorization: `Bearer ${this.key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ p_reservations: reservations })
    });
    if (!response.ok) throw Object.assign(new Error('quota reservation store unavailable'), { status: 503 });
    let result;
    try { result = JSON.parse(await response.text()); }
    catch { throw Object.assign(new Error('quota reservation response invalid'), { status: 503 }); }
    if (!result || typeof result.allowed !== 'boolean') throw Object.assign(new Error('quota reservation response invalid'), { status: 503 });
    return result;
  }

  async reserveUserAnalysis({ userId, asOf, policy }) {
    return this.reserve(userAnalysisReservations(userId, asOf, policy));
  }

  async reserveProviderUsage({ providerId, units, asOf, policy }) {
    return this.reserve(providerUsageReservations(providerId, units, asOf, policy));
  }

  async reserveUserProviderAnalysis({ userId, providerId, units, asOf, policy }) {
    return this.reserve([
      ...userAnalysisReservations(userId, asOf, policy),
      ...providerUsageReservations(providerId, units, asOf, policy)
    ]);
  }

  async cleanupExpired({ olderThan } = {}) {
    const response = await this.fetch(`${this.base}/rpc/cleanup_dda_autotrader_quota_buckets`, {
      method: 'POST',
      headers: {
        apikey: this.key,
        Authorization: `Bearer ${this.key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ p_older_than: olderThan || new Date(Date.now() - 90 * 24 * 60 * 60_000).toISOString() })
    });
    if (!response.ok) throw Object.assign(new Error('quota cleanup unavailable'), { status: 503 });
    const count = Number(await response.text());
    if (!Number.isSafeInteger(count) || count < 0) throw Object.assign(new Error('quota cleanup response invalid'), { status: 503 });
    return count;
  }
}

module.exports = { PostgrestQuotaStore };
