(function () {
  'use strict';

  const configuredBase = String(window.DDA_BFF_BASE_URL || '').trim().replace(/\/+$/, '');
  let csrfPromise = null;

  function enabled() { return Boolean(configuredBase); }

  function readCookie(name) {
    const prefix = `${name}=`;
    return document.cookie.split(';').map(value => value.trim()).find(value => value.startsWith(prefix))?.slice(prefix.length) || '';
  }

  async function issueCsrf() {
    if (!enabled()) return false;
    if (!csrfPromise) {
      csrfPromise = fetch(`${configuredBase}/v1/security/csrf`, {
        method: 'GET', credentials: 'include', headers: { Accept: 'application/json' }
      }).then(response => {
        if (!response.ok && response.status !== 204) throw new Error('csrf_issue_failed');
        return true;
      }).finally(() => { csrfPromise = null; });
    }
    return csrfPromise;
  }

  async function request(path, options = {}) {
    if (!enabled()) return { enabled: false, response: null, body: null };
    const method = options.method || 'GET';
    const headers = { Accept: 'application/json', ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) };
    if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      await issueCsrf();
      const csrf = readCookie('__Host-dda_csrf');
      if (csrf) headers['X-CSRF-Token'] = csrf;
    }
    const response = await fetch(`${configuredBase}${path}`, {
      ...options,
      method,
      credentials: 'include',
      headers,
      ...(options.body && typeof options.body !== 'string' ? { body: JSON.stringify(options.body) } : {})
    });
    let body = null;
    if (response.status !== 204) {
      try { body = await response.json(); } catch { body = null; }
    }
    return { enabled: true, response, body };
  }

  function resultError(result, fallback) {
    const error = new Error(result.body?.code || fallback);
    error.status = result.response?.status || 0;
    error.body = result.body;
    return error;
  }

  async function register({ email, password, display_name, ref }) {
    const result = await request('/v1/auth/register', { method: 'POST', body: { email, password, display_name, ref } });
    if (!result.enabled) return null;
    if (!result.response.ok) throw resultError(result, 'registration_failed');
    return result.body;
  }

  async function verifyRecoveryToken(token) {
    const result = await request('/v1/auth/password-reset/verify', { method: 'POST', body: { token } });
    if (!result.enabled) return null;
    if (!result.response.ok) throw resultError(result, 'recovery_token_invalid');
    return true;
  }
  async function exchangeRecoveryCode(code) {
    const result = await request('/v1/auth/password-reset/exchange', { method: 'POST', body: { code } });
    if (!result.enabled) return null;
    if (!result.response.ok) throw resultError(result, 'recovery_code_invalid');
    return true;
  }

  async function verifyEmail(token) {
    const result = await request('/v1/auth/verify-email', { method: 'POST', body: { token } });
    if (!result.enabled) return null;
    if (!result.response.ok) throw resultError(result, 'verification_failed');
    return true;
  }
  // PKCE signup confirmation (P0 auth reliability audit, 2026-11): the
  // confirmation link's `code` alone proves nothing — the server pairs it
  // with the code_verifier it kept in this browser's own httpOnly cookie
  // (sent automatically via credentials:'include' above), which a security
  // scanner's sandboxed browser never has. See bff/src/app.js and pkce.js.
  async function exchangeSignupCode(code) {
    const result = await request('/v1/auth/verify-email', { method: 'POST', body: { code } });
    if (!result.enabled) return null;
    if (!result.response.ok) throw resultError(result, 'verification_failed');
    return true;
  }

  // Google OAuth — start (founder directive, 2026-11): deliberately NOT a
  // fetch. This hands back the BFF's own start URL so the caller can do a
  // real top-level navigation (`location.href = ...`) — a full page
  // redirect, the one flow this button needs, and the one kind of request
  // that reliably carries the httpOnly verifier cookie the BFF sets on its
  // own 302 response through Supabase and back. A fetch here would run the
  // whole Google/Supabase hop inside an XHR, which neither follows
  // cross-origin redirects the way a navigation does nor is what any mobile
  // browser expects for a sign-in button — no popup, same as the rest of
  // this site.
  function oauthGoogleStartUrl() {
    return enabled() ? `${configuredBase}/v1/auth/oauth/google/start` : null;
  }
  // The return leg, once the browser is back on academy.html with Supabase's
  // one-time `code` in the query string: a plain fetch, same shape as
  // exchangeRecoveryCode/exchangeSignupCode above, since the verifier cookie
  // travels automatically via credentials:'include'.
  async function exchangeOAuthCode(provider, code) {
    const result = await request(`/v1/auth/oauth/${encodeURIComponent(provider)}/exchange`, { method: 'POST', body: { code } });
    if (!result.enabled) return null;
    if (!result.response.ok) throw resultError(result, 'oauth_exchange_failed');
    return true;
  }

  async function login({ email, password }) {
    const result = await request('/v1/auth/login', { method: 'POST', body: { email, password } });
    if (!result.enabled) return null;
    if (!result.response.ok) throw resultError(result, 'authentication_failed');
    return true;
  }

  async function requestPasswordReset(email) {
    const result = await request('/v1/auth/password-reset/request', { method: 'POST', body: { email } });
    if (!result.enabled) return null;
    if (!result.response.ok) throw resultError(result, 'recovery_failed');
    return result.body;
  }

  async function confirmPasswordReset({ token, password }) {
    const result = await request('/v1/auth/password-reset/confirm', { method: 'POST', body: { token, password } });
    if (!result.enabled) return null;
    if (!result.response.ok) throw resultError(result, 'password_reset_confirm_failed');
    return true;
  }

  async function getMe(options = {}) {
    const result = await request('/v1/me', options);
    if (!result.enabled || result.response.status === 401) return null;
    if (!result.response.ok) throw resultError(result, 'bff_me_failed');
    return result.body;
  }

  // Server-side Premium entitlement check (P1.1 — mandat §7.3). Returns a
  // plain boolean, never throws on the expected "not entitled" case: the BFF
  // answers 200 with server_authorized:true for an active Premium account,
  // 403 premium_required otherwise. A network/5xx failure or a disabled BFF
  // also resolves false — fail closed, never silently grant Premium.
  async function hasServerPremiumEntitlement() {
    try {
      const result = await request('/v1/premium/preview');
      if (!result.enabled || result.response.status === 401) return false;
      return result.response.ok && result.body?.server_authorized === true;
    } catch {
      return false;
    }
  }

  // DDA AI — real pedagogical assistant (mandat §DDA-AI). Returns
  // {available:false} when the BFF is disabled or the server hasn't been
  // configured with a provider key yet (503 ai_not_configured) — the UI must
  // show its honest "pas encore configuré" state in that case, never a fake
  // reply. A provider failure or rate limit also resolves to {available:true,
  // error:<code>} rather than throwing, so a transient outage never crashes
  // the chat UI.
  // Real Premium lesson/lab content (mandate §6 audit, Lot 2 — see
  // bff/src/premium-content.js). Mirrors adminRequest's {enabled, status, …}
  // shape rather than collapsing every outcome to null/throw: the caller
  // must tell "not entitled (yet)" (401/403, already handled by the honest
  // paywall gate elsewhere) and "unknown id" (404) apart from a genuine
  // network/server failure, which is thrown so the caller can show a
  // distinct "temporarily unavailable, try again" message instead of a
  // silent empty lesson.
  async function fetchPremiumContent(lessonId) {
    const result = await request(`/v1/premium/content/${encodeURIComponent(lessonId)}`);
    if (!result.enabled) return { enabled: false };
    if ([401, 403, 404].includes(result.response.status)) return { enabled: true, status: result.response.status, lesson: null };
    if (!result.response.ok) throw resultError(result, 'premium_content_failed');
    return { enabled: true, status: 200, lesson: result.body?.lesson || null };
  }

  async function askAI(message, history) {
    const result = await request('/v1/ai/ask', { method: 'POST', body: { message, history } });
    if (!result.enabled || result.response.status === 401) return { available: false };
    if (result.response.status === 503) return { available: false };
    if (!result.response.ok) return { available: true, error: result.body?.code || 'ai_provider_failed' };
    return { available: true, reply: result.body?.reply || '' };
  }

  async function getBrvmPublications() {
    const result = await request('/v1/publications/brvm');
    if (!result.enabled) return null;
    if (!result.response.ok) throw resultError(result, 'brvm_publications_failed');
    if (!Array.isArray(result.body?.items)) throw new Error('brvm_publications_invalid_response');
    return result.body.items;
  }

  async function updateMe(patch) {
    const result = await request('/v1/me', { method: 'PATCH', body: patch });
    if (!result.enabled || result.response.status === 401) return null;
    if (!result.response.ok) throw resultError(result, 'bff_profile_failed');
    return result.body;
  }

  async function getProgress() {
    const result = await request('/v1/progress');
    if (!result.enabled || result.response.status === 401) return null;
    if (!result.response.ok) throw resultError(result, 'bff_progress_failed');
    return result.body;
  }

  async function saveLessonProgress(lessonId, progress) {
    const result = await request('/v1/progress/lesson', { method: 'PUT', body: { lessonId, ...progress } });
    if (!result.enabled || result.response.status === 401) return null;
    if (!result.response.ok) throw resultError(result, 'bff_progress_failed');
    return result.body;
  }

  async function saveOnboardingProgress(onboarding) {
    const result = await request('/v1/progress/onboarding', { method: 'PUT', body: onboarding });
    if (!result.enabled || result.response.status === 401) return null;
    if (!result.response.ok) throw resultError(result, 'bff_onboarding_failed');
    return result.body;
  }

  // Commercial activation mandate (2026-11-14): asks the BFF for a real
  // Chariow Checkout session. Never resolves a fake checkout_url itself —
  // either the server hands back a real one from the provider, or this
  // reports exactly why it couldn't (not configured, rate limited, or the
  // provider failed), so the caller can fall back to the honest local
  // waitlist instead of pretending a payment flow exists.
  async function startPremiumCheckout() {
    const result = await request('/v1/billing/checkout', { method: 'POST' });
    if (!result.enabled || result.response.status === 401) return { available: false, reason: 'unavailable' };
    if (result.response.status === 503) return { available: false, reason: 'not_configured' };
    if (result.response.status === 429) return { available: true, error: 'rate_limited' };
    if (!result.response.ok) return { available: true, error: result.body?.code || 'checkout_failed' };
    const checkoutUrl = typeof result.body?.checkout_url === 'string' ? result.body.checkout_url : null;
    if (!checkoutUrl) return { available: true, error: 'checkout_failed' };
    return { available: true, checkoutUrl };
  }

  async function logout() {
    const result = await request('/v1/auth/logout', { method: 'POST' });
    if (!result.enabled || result.response.status === 401) return null;
    if (!result.response.ok) throw resultError(result, 'logout_failed');
    return true;
  }

  // Admin reads — unlike the calls above, the back-office needs to tell a
  // staff member exactly *why* a screen is empty (not configured here vs.
  // not logged in vs. logged in but not an admin), so these return a
  // {enabled, status} shape instead of collapsing every non-success case to
  // null. The server (bff/src/app.js withAdmin) re-derives the role from the
  // session cookie itself — nothing admin-related is ever decided here.
  async function adminRequest(path) {
    const result = await request(path);
    if (!result.enabled) return { enabled: false };
    if (result.response.status === 401) return { enabled: true, status: 401 };
    if (result.response.status === 403) return { enabled: true, status: 403 };
    if (result.response.status === 503) return { enabled: true, status: 503 };
    if (!result.response.ok) throw resultError(result, 'admin_request_failed');
    return { enabled: true, status: 200, data: result.body };
  }

  async function getAdminOverview() {
    return adminRequest('/v1/admin/overview');
  }

  async function getAdminUsers({ page = 1, perPage = 20 } = {}) {
    return adminRequest(`/v1/admin/users?page=${encodeURIComponent(page)}&per_page=${encodeURIComponent(perPage)}`);
  }

  async function getAdminMemberships({ page = 1, perPage = 20 } = {}) {
    return adminRequest(`/v1/admin/memberships?page=${encodeURIComponent(page)}&per_page=${encodeURIComponent(perPage)}`);
  }

  // Role mutation — owner-only server-side (bff/src/app.js), never decided
  // here. Returns {enabled, status, data|body} the same way adminRequest
  // does, rather than throwing on 403/409: the UI needs to show *why* a
  // specific grant/revoke failed (not an owner, last owner protected), not
  // just that it did.
  async function mutateAdminRole(path, options) {
    const result = await request(path, options);
    if (!result.enabled) return { enabled: false };
    return { enabled: true, status: result.response.status, data: result.body };
  }

  async function assignAdminRole(userId, role) {
    return mutateAdminRole('/v1/admin/roles', { method: 'POST', body: { user_id: userId, role } });
  }

  async function revokeAdminRole(userId) {
    return mutateAdminRole(`/v1/admin/roles/${encodeURIComponent(userId)}`, { method: 'DELETE' });
  }

  window.DDABFF = Object.freeze({
    enabled, register, verifyEmail, exchangeSignupCode, verifyRecoveryToken, exchangeRecoveryCode, login, requestPasswordReset, confirmPasswordReset, getMe, getBrvmPublications, updateMe, logout, issueCsrf,
    oauthGoogleStartUrl, exchangeOAuthCode,
    getProgress, saveLessonProgress, saveOnboardingProgress, hasServerPremiumEntitlement, fetchPremiumContent, askAI, startPremiumCheckout,
    getAdminOverview, getAdminUsers, getAdminMemberships, assignAdminRole, revokeAdminRole,
    get baseUrl() { return configuredBase; }
  });
})();
