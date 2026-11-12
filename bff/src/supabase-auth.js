'use strict';

const { normalizeEmail } = require('./security');

function displayNameFromMetadata(metadata = {}) {
  const candidates = [metadata.display_name, metadata.full_name, metadata.name];
  return candidates.find(value => typeof value === 'string' && value.trim())?.trim() || '';
}

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

  // `codeChallenge`, when supplied, asks GoTrue to mint a PKCE-protected
  // confirmation link (see pkce.js's header comment for the full rationale):
  // the resulting e-mail link yields only a single-use `code`, which is
  // worthless without the `code_verifier` this server kept to itself. This
  // mirrors exactly what the official Supabase client SDK sends when its
  // auth flow type is set to PKCE — the same `code_challenge` /
  // `code_challenge_method` fields, in the request body, documented in
  // GoTrue's own SignupParams/RecoverParams request shape.
  async register({ email, password, display_name, ref, redirectTo, codeChallenge }) {
    // Partner attribution is written once, at account creation, and never
    // touched again — updateUser() below merges around it precisely so a
    // later profile edit can never overwrite or erase it.
    const body = { email: normalizeEmail(email), password, data: { display_name: display_name || '', ref: ref || null }, redirect_to: redirectTo };
    if (codeChallenge) { body.code_challenge = codeChallenge; body.code_challenge_method = 'S256'; }
    return this.publicRequest('/auth/v1/signup', { method: 'POST', body: JSON.stringify(body) });
  }

  // Legacy path, kept for any confirmation links already sent before this
  // deploy (and as a fallback for a flow that never got a code_verifier —
  // e.g. SESSION_ENCRYPTION_KEY unset in a non-production config): GoTrue
  // still honors a bare token_hash/type=signup verification. New links
  // issued by register() above go through exchangeSignupCode() instead.
  async verifyEmail(token) {
    return this.publicRequest(`/auth/v1/verify?token=${encodeURIComponent(token)}&type=signup`, { method: 'GET' });
  }

  // Legacy path — see verifyEmail()'s comment; superseded for new recovery
  // links by exchangeRecoveryCode() below once a code_verifier is available.
  async verifyRecoveryToken(token) {
    return this.publicRequest(`/auth/v1/verify?token=${encodeURIComponent(token)}&type=recovery`, { method: 'GET' });
  }

  // The actual PKCE exchange: GoTrue's /token?grant_type=pkce resolves the
  // single-use `auth_code` from the e-mail link's redirect ONLY when it is
  // paired with the exact `code_verifier` whose SHA-256 produced the
  // `code_challenge` originally sent to /recover or /signup. A scanner that
  // merely loads the redirect page never has this value (it lives only in
  // this server's encrypted, httpOnly cookie on the browser that made the
  // original request — see app.js) and so can never complete this call,
  // whatever it does with the `code` on its own.
  async exchangePkceCode(code, codeVerifier) {
    return this.publicRequest('/auth/v1/token?grant_type=pkce', { method: 'POST', body: JSON.stringify({ auth_code: code, code_verifier: codeVerifier }) });
  }
  async exchangeRecoveryCode(code, codeVerifier) {
    return this.exchangePkceCode(code, codeVerifier);
  }
  async exchangeSignupCode(code, codeVerifier) {
    return this.exchangePkceCode(code, codeVerifier);
  }
  // Google OAuth sign-in (founder directive, 2026-11): once GoTrue has
  // completed its own handshake with Google and bounced the browser back to
  // our redirect_to with a one-time `code`, that code is resolved via the
  // EXACT same PKCE exchange as recovery/signup above — GoTrue does not
  // distinguish the flow that produced the code, only that the submitted
  // code_verifier hashes to the code_challenge given when the flow started.
  // No third near-duplicate HTTP call is written; this is a named alias onto
  // the one real implementation.
  async exchangeOAuthCode(code, codeVerifier) {
    return this.exchangePkceCode(code, codeVerifier);
  }

  // Builds the URL the BROWSER (never this server) must navigate to, to
  // start a GoTrue OAuth flow. This performs no network call itself — GoTrue
  // validates/redirects when the user's own browser visits it, exactly as
  // the official supabase-js `signInWithOAuth()` does from the browser. PKCE
  // is requested the same way as register()/requestPasswordReset() above
  // (`code_challenge` + `code_challenge_method=S256`): GoTrue mints the
  // returned `code` bound to this challenge, so only the browser holding the
  // matching code_verifier (this server's own encrypted, httpOnly cookie —
  // see app.js) can ever redeem it.
  buildAuthorizeUrl({ provider, redirectTo, codeChallenge }) {
    const url = new URL(`${this.url}/auth/v1/authorize`);
    url.searchParams.set('provider', provider);
    if (redirectTo) url.searchParams.set('redirect_to', redirectTo);
    if (codeChallenge) {
      url.searchParams.set('code_challenge', codeChallenge);
      url.searchParams.set('code_challenge_method', 'S256');
    }
    return url.toString();
  }

  // GoTrue's public, unauthenticated settings endpoint reports which social
  // providers are currently enabled on this project (documented at
  // https://supabase.com/docs/guides/self-hosting/self-hosted-oauth —
  // `curl .../auth/v1/settings` returns `{ "external": { "google": true, ... } }`).
  // Checked BEFORE ever redirecting a learner toward Google: if the founder
  // has not finished enabling the provider in the Supabase dashboard yet,
  // this lets the start route bounce back with an honest, specific reason
  // instead of sending the browser into GoTrue's own raw error response.
  async getProviderSettings() {
    return this.publicRequest('/auth/v1/settings', { method: 'GET' });
  }

  async login({ email, password }) {
    return this.publicRequest('/auth/v1/token?grant_type=password', { method: 'POST', body: JSON.stringify({ email: normalizeEmail(email), password }) });
  }

  async requestPasswordReset(email, redirectTo, codeChallenge) {
    // Unlike /auth/v1/signup, GoTrue's /auth/v1/recover reads redirect_to only
    // from the request's query string — a body field here is silently ignored,
    // and the email link falls back to the bare Site URL with no recovery
    // token at all (confirmed against production: the founder's own recovery
    // link landed on academy.html with zero query params). The body field is
    // kept too since GoTrue accepts it there without error; the query param is
    // what actually makes it into the email.
    const path = redirectTo ? `/auth/v1/recover?redirect_to=${encodeURIComponent(redirectTo)}` : '/auth/v1/recover';
    const body = { email: normalizeEmail(email), redirect_to: redirectTo };
    if (codeChallenge) { body.code_challenge = codeChallenge; body.code_challenge_method = 'S256'; }
    return this.publicRequest(path, { method: 'POST', body: JSON.stringify(body) });
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
        display_name: displayNameFromMetadata(user.user_metadata),
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
      display_name: displayNameFromMetadata(user.user_metadata),
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
    return { user_id: user.id, email: user.email, email_verified: Boolean(user.email_confirmed_at), display_name: displayNameFromMetadata(user.user_metadata), status: user.banned_until ? 'locked' : 'active', ref: user.user_metadata?.ref || null, entitlements: [] };
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
