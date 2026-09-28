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

  async function getMe() {
    const result = await request('/v1/me');
    if (!result.enabled || result.response.status === 401) return null;
    if (!result.response.ok) throw resultError(result, 'bff_me_failed');
    return result.body;
  }

  async function updateMe(patch) {
    const result = await request('/v1/me', { method: 'PATCH', body: patch });
    if (!result.enabled || result.response.status === 401) return null;
    if (!result.response.ok) throw resultError(result, 'bff_profile_failed');
    return result.body;
  }

  async function logout() {
    const result = await request('/v1/auth/logout', { method: 'POST' });
    if (!result.enabled || result.response.status === 401) return null;
    if (!result.response.ok) throw resultError(result, 'logout_failed');
    return true;
  }

  window.DDABFF = Object.freeze({
    enabled, register, verifyEmail, login, requestPasswordReset, getMe, updateMe, logout, issueCsrf,
    get baseUrl() { return configuredBase; }
  });
})();
