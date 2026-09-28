'use strict';

const { randomUUID } = require('node:crypto');
const { sha256 } = require('./security');

class MemorySessionStore {
  constructor() { this.sessions = new Map(); }

  async create(input) {
    const id = randomUUID();
    const row = { session_id: id, revoked_at: null, ...input };
    this.sessions.set(id, row);
    return row;
  }

  async findActiveByTokenHash(tokenHash, now = new Date()) {
    const current = now.toISOString();
    return [...this.sessions.values()].find(row => row.token_hash === tokenHash && !row.revoked_at && row.expires_at > current) || null;
  }

  async touch(sessionId, now = new Date()) {
    const row = this.sessions.get(sessionId);
    if (row) row.last_seen_at = now.toISOString();
    return row;
  }

  async revoke(sessionId, now = new Date()) {
    const row = this.sessions.get(sessionId);
    if (row) row.revoked_at = now.toISOString();
  }

  async revokeAll(userId, now = new Date()) {
    const stamp = now.toISOString();
    for (const row of this.sessions.values()) if (row.user_id === userId && !row.revoked_at) row.revoked_at = stamp;
  }

  async list(userId) {
    return [...this.sessions.values()].filter(row => row.user_id === userId && !row.revoked_at).map(row => ({
      session_id: row.session_id,
      created_at: row.created_at,
      last_seen_at: row.last_seen_at,
      approximate_device: row.user_agent || 'unknown',
      current: false
    }));
  }
}

class PostgrestSessionStore {
  constructor({ supabaseUrl, serviceRoleKey, fetchImpl = fetch }) {
    this.base = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/dda_sessions`;
    this.key = serviceRoleKey;
    this.fetch = fetchImpl;
  }

  async request(path = '', options = {}) {
    const response = await this.fetch(`${this.base}${path}`, {
      ...options,
      headers: {
        apikey: this.key,
        Authorization: `Bearer ${this.key}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
        ...(options.headers || {})
      }
    });
    if (!response.ok) throw new Error(`session store error ${response.status}`);
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }

  async create(input) {
    const rows = await this.request('', { method: 'POST', body: JSON.stringify(input) });
    return rows[0];
  }

  async findActiveByTokenHash(tokenHash, now = new Date()) {
    const query = `?token_hash=eq.${encodeURIComponent(tokenHash)}&revoked_at=is.null&expires_at=gt.${encodeURIComponent(now.toISOString())}&select=*`;
    const rows = await this.request(query, { method: 'GET' });
    return rows[0] || null;
  }

  async touch(sessionId, now = new Date()) {
    const rows = await this.request(`?session_id=eq.${encodeURIComponent(sessionId)}`, { method: 'PATCH', body: JSON.stringify({ last_seen_at: now.toISOString() }) });
    return rows[0] || null;
  }

  async revoke(sessionId, now = new Date()) {
    await this.request(`?session_id=eq.${encodeURIComponent(sessionId)}`, { method: 'PATCH', body: JSON.stringify({ revoked_at: now.toISOString() }) });
  }

  async revokeAll(userId, now = new Date()) {
    await this.request(`?user_id=eq.${encodeURIComponent(userId)}&revoked_at=is.null`, { method: 'PATCH', body: JSON.stringify({ revoked_at: now.toISOString() }) });
  }

  async list(userId) {
    return this.request(`?user_id=eq.${encodeURIComponent(userId)}&revoked_at=is.null&select=session_id,created_at,last_seen_at,approximate_device:user_agent`, { method: 'GET' });
  }
}

module.exports = { MemorySessionStore, PostgrestSessionStore };
