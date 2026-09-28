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

  async register({ email, password, display_name }) {
    return this.publicRequest('/auth/v1/signup', { method: 'POST', body: JSON.stringify({ email: normalizeEmail(email), password, data: { display_name: display_name || '' } }) });
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

  async revokeProviderSession(accessToken) {
    if (!accessToken) return;
    try { await this.request('/auth/v1/logout', { method: 'POST', key: accessToken }); } catch { /* BFF session revocation remains authoritative. */ }
  }
}

module.exports = { SupabaseAuthAdapter };
