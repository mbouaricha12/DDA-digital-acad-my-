'use strict';

const { normalizeEmail } = require('./security');

class SupabaseAuthAdapter {
  constructor({ supabaseUrl, publishableKey, serviceRoleKey, fetchImpl = fetch }) {
    if (!supabaseUrl || !publishableKey || !serviceRoleKey) throw new Error('SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY and SUPABASE_SERVICE_ROLE_KEY are required');
    this.url = supabaseUrl.replace(/\/$/, '');
    this.publishableKey = publishableKey;
    this.serviceRoleKey = serviceRoleKey;
    this.fetch = fetchImpl;
  }

  async publicRequest(path, options = {}) {
    return this.request(path, { ...options, key: this.publishableKey });
  }

  async adminRequest(path, options = {}) {
    return this.request(path, { ...options, key: this.serviceRoleKey });
  }

  async request(path, { key, headers = {}, ...options }) {
    const response = await this.fetch(`${this.url}${path}`, {
      ...options,
      headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', ...headers }
    });
    const text = await response.text();
    let body = null;
    try { body = text ? JSON.parse(text) : null; } catch { body = null; }
    if (!response.ok) {
      const error = new Error(body?.msg || body?.message || body?.error_description || `Supabase Auth error ${response.status}`);
      error.status = response.status;
      throw error;
    }
    return body;
  }

  async register({ email, password, display_name, redirectTo }) {
    return this.publicRequest('/auth/v1/signup', { method: 'POST', body: JSON.stringify({ email: normalizeEmail(email), password, data: { display_name: display_name || '' }, redirect_to: redirectTo }) });
  }

  async verifyEmail(token) {
    return this.publicRequest(`/auth/v1/verify?token=${encodeURIComponent(token)}&type=signup`, { method: 'GET' });
  }

  async login({ email, password }) {
    return this.publicRequest('/auth/v1/token?grant_type=password', { method: 'POST', body: JSON.stringify({ email: normalizeEmail(email), password }) });
  }

  async requestPasswordReset(email, redirectTo) {
    return this.publicRequest('/auth/v1/recover', { method: 'POST', body: JSON.stringify({ email: normalizeEmail(email), redirect_to: redirectTo }) });
  }

  async confirmPasswordReset(accessToken, password) {
    return this.request('/auth/v1/user', { method: 'PUT', key: accessToken, body: JSON.stringify({ password }) });
  }

  async listUsers({ page = 1, perPage = 50 } = {}) {
    const result = await this.adminRequest(`/auth/v1/admin/users?page=${encodeURIComponent(page)}&per_page=${encodeURIComponent(perPage)}`, { method: 'GET' });
    const rawUsers = Array.isArray(result?.users) ? result.users : [];
    // GoTrue's admin list endpoint does not reliably return a cross-version
    // total user count in its response body. We never invent one: total is
    // only ever reported when the adapter can actually see it.
    const total = typeof result?.total === 'number' ? result.total : null;
    return {
      total,
      users: rawUsers.map(user => ({
        user_id: user.id,
        email: user.email,
        email_verified: Boolean(user.email_confirmed_at),
        display_name: user.user_metadata?.display_name || '',
        status: user.banned_until ? 'locked' : 'active',
        created_at: user.created_at || null,
        last_sign_in_at: user.last_sign_in_at || null
      }))
    };
  }

  async getUser(userId) {
    const user = await this.adminRequest(`/auth/v1/admin/users/${encodeURIComponent(userId)}`, { method: 'GET' });
    return {
      user_id: user.id,
      email: user.email,
      email_verified: Boolean(user.email_confirmed_at),
      display_name: user.user_metadata?.display_name || '',
      status: user.banned_until ? 'locked' : 'active',
      entitlements: []
    };
  }

  async updateUser(userId, patch) {
    const user = await this.adminRequest(`/auth/v1/admin/users/${encodeURIComponent(userId)}`, { method: 'PUT', body: JSON.stringify({ user_metadata: { display_name: patch.display_name } }) });
    return { user_id: user.id, email: user.email, email_verified: Boolean(user.email_confirmed_at), display_name: user.user_metadata?.display_name || '', status: user.banned_until ? 'locked' : 'active', entitlements: [] };
  }

  async deleteUser(userId) {
    await this.adminRequest(`/auth/v1/admin/users/${encodeURIComponent(userId)}`, { method: 'DELETE' });
  }

  async revokeProviderSession(accessToken) {
    if (!accessToken) return;
    try { await this.request('/auth/v1/logout', { method: 'POST', key: accessToken }); } catch { /* BFF session revocation remains authoritative. */ }
  }
}

module.exports = { SupabaseAuthAdapter };
