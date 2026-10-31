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

  async function register({ email, password, display_name }) {
    const result = await request('/v1/auth/register', { method: 'POST', body: { email, password, display_name } });
    if (!result.enabled) return null;
    if (!result.response.ok) throw resultError(result, 'registration_failed');
    return result.body;
  }

  async function verifyEmail(token) {
    const result = await request('/v1/auth/verify-email', { method: 'POST', body: { token } });
    if (!result.enabled) return null;
    if (!result.response.ok) throw resultError(result, 'verification_failed');
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

  async function getMe() {
    const result = await request('/v1/me');
    if (!result.enabled || result.response.status === 401) return null;
    if (!result.response.ok) throw resultError(result, 'bff_me_failed');
    return result.body;
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

  window.DDABFF = Object.freeze({
    enabled, register, verifyEmail, login, requestPasswordReset, confirmPasswordReset, getMe, getBrvmPublications, updateMe, logout, issueCsrf,
    getProgress, saveLessonProgress, saveOnboardingProgress,
    getAdminOverview, getAdminUsers, getAdminMemberships,
    get baseUrl() { return configuredBase; }
  });
})();
