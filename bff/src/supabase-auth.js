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
      // GoTrue distinguishes "wrong password" from "email not confirmed" (and
      // other causes) via error_code/code — never collapse that into a
      // single generic status upstream, or the BFF loses the information it
      // needs to tell a real caller apart from an unconfirmed one. See the
      // login handler in app.js, which is the only consumer that must see
      // this distinction (P0 auth reliability audit).
      error.code = body?.error_code || body?.code || null;
      throw error;
    }
    return body;
  }

  async register({ email, password, display_name, ref, redirectTo }) {
    // Partner attribution is written once, at account creation, and never
    // touched again — updateUser() below merges around it precisely so a
    // later profile edit can never overwrite or erase it.
    return this.publicRequest('/auth/v1/signup', { method: 'POST', body: JSON.stringify({ email: normalizeEmail(email), password, data: { display_name: display_name || '', ref: ref || null }, redirect_to: redirectTo }) });
  }

  async verifyEmail(token) {
    return this.publicRequest(`/auth/v1/verify?token=${encodeURIComponent(token)}&type=signup`, { method: 'GET' });
  }

  async verifyRecoveryToken(token) {
    return this.publicRequest(`/auth/v1/verify?token=${encodeURIComponent(token)}&type=recovery`, { method: 'GET' });
  }
  async exchangeRecoveryCode(code) {
    return this.publicRequest('/auth/v1/token?grant_type=pkce', { method: 'POST', body: JSON.stringify({ auth_code: code }) });
  }

  async login({ email, password }) {
    return this.publicRequest('/auth/v1/token?grant_type=password', { method: 'POST', body: JSON.stringify({ email: normalizeEmail(email), password }) });
  }

  async requestPasswordReset(email, redirectTo) {
    // Unlike /auth/v1/signup, GoTrue's /auth/v1/recover reads redirect_to only
    // from the request's query string — a body field here is silently ignored,
    // and the email link falls back to the bare Site URL with no recovery
    // token at all (confirmed against production: the founder's own recovery
    // link landed on academy.html with zero query params). The body field is
    // kept too since GoTrue accepts it there without error; the query param is
    // what actually makes it into the email.
    const path = redirectTo ? `/auth/v1/recover?redirect_to=${encodeURIComponent(redirectTo)}` : '/auth/v1/recover';
    return this.publicRequest(path, { method: 'POST', body: JSON.stringify({ email: normalizeEmail(email), redirect_to: redirectTo }) });
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
        ref: user.user_metadata?.ref || null,
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
      ref: user.user_metadata?.ref || null,
      entitlements: []
    };
  }

  async updateUser(userId, patch) {
    // GoTrue's admin update replaces user_metadata wholesale rather than
    // merging it — fetch the current object first so a display_name edit
    // can never silently erase the immutable partner ref set at signup.
    const current = await this.adminRequest(`/auth/v1/admin/users/${encodeURIComponent(userId)}`, { method: 'GET' });
    const user = await this.adminRequest(`/auth/v1/admin/users/${encodeURIComponent(userId)}`, { method: 'PUT', body: JSON.stringify({ user_metadata: { ...current.user_metadata, display_name: patch.display_name } }) });
    return { user_id: user.id, email: user.email, email_verified: Boolean(user.email_confirmed_at), display_name: user.user_metadata?.display_name || '', status: user.banned_until ? 'locked' : 'active', ref: user.user_metadata?.ref || null, entitlements: [] };
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
