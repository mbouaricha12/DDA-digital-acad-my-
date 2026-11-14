'use strict';

const MAX_BODY_LENGTH = 1000;
const MAX_DISPLAY_NAME_LENGTH = 80;

function sanitizeRow(row) {
  if (!row || typeof row !== 'object' || Array.isArray(row)) return null;
  if (typeof row.post_id !== 'string' || typeof row.body !== 'string' || typeof row.created_at !== 'string') return null;
  return {
    id: row.post_id,
    authorDisplayName: typeof row.author_display_name === 'string' && row.author_display_name.trim() ? row.author_display_name : 'Apprenant DDA',
    body: row.body,
    createdAt: row.created_at
  };
}

class PostgrestCommunityStore {
  constructor({ supabaseUrl, serviceRoleKey, fetchImpl = fetch }) {
    this.supabaseUrl = supabaseUrl.replace(/\/+$/, '');
    this.serviceRoleKey = serviceRoleKey;
    this.fetchImpl = fetchImpl;
  }

  async listRecent({ limit = 30 } = {}) {
    const safeLimit = Math.min(Math.max(Number(limit) || 30, 1), 100);
    const columns = 'post_id,author_display_name,body,created_at';
    const query = `?select=${encodeURIComponent(columns)}&status=eq.visible&order=created_at.desc&limit=${safeLimit}`;
    const response = await this.fetchImpl(`${this.supabaseUrl}/rest/v1/dda_community_posts${query}`, {
      method: 'GET',
      headers: { apikey: this.serviceRoleKey, Authorization: `Bearer ${this.serviceRoleKey}`, Accept: 'application/json' }
    });
    const text = await response.text();
    if (!response.ok) throw new Error('community_posts_store_failed');
    let rows;
    try { rows = text ? JSON.parse(text) : []; } catch { throw new Error('community_posts_store_invalid_json'); }
    if (!Array.isArray(rows)) throw new Error('community_posts_store_invalid_shape');
    return rows.map(sanitizeRow).filter(Boolean);
  }

  async createPost({ userId, authorDisplayName, body }) {
    if (!userId || typeof userId !== 'string') throw Object.assign(new Error('community_post_requires_user_id'), { status: 400 });
    const trimmedBody = typeof body === 'string' ? body.trim() : '';
    if (!trimmedBody || trimmedBody.length > MAX_BODY_LENGTH) {
      throw Object.assign(new Error('community_post_invalid_body'), { status: 400 });
    }
    const safeName = (typeof authorDisplayName === 'string' && authorDisplayName.trim())
      ? authorDisplayName.trim().slice(0, MAX_DISPLAY_NAME_LENGTH)
      : 'Apprenant DDA';
    const response = await this.fetchImpl(`${this.supabaseUrl}/rest/v1/dda_community_posts`, {
      method: 'POST',
      headers: {
        apikey: this.serviceRoleKey,
        Authorization: `Bearer ${this.serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify({ user_id: userId, author_display_name: safeName, body: trimmedBody })
    });
    const text = await response.text();
    if (!response.ok) throw new Error('community_post_create_failed');
    let rows;
    try { rows = text ? JSON.parse(text) : []; } catch { throw new Error('community_post_create_invalid_json'); }
    const row = Array.isArray(rows) ? rows[0] : rows;
    const sanitized = sanitizeRow(row);
    if (!sanitized) throw new Error('community_post_create_invalid_shape');
    return sanitized;
  }
}

module.exports = { PostgrestCommunityStore, sanitizeRow, MAX_BODY_LENGTH };
