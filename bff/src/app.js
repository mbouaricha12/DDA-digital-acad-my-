'use strict';

const { randomUUID } = require('node:crypto');
const { randomToken, sha256, timingSafeEqualText, parseCookies, serializeCookie, encrypt, decrypt, normalizeEmail } = require('./security');
const { executeIdempotentMutation, validateClientMutationId } = require('./idempotency');

const SESSION_COOKIE = '__Host-dda_session';
const CSRF_COOKIE = '__Host-dda_csrf';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function configFromEnv(env = process.env) {
  const origins = String(env.ALLOWED_ORIGINS || 'http://localhost:8744').split(',').map(x => x.trim()).filter(Boolean);
  return {
    port: Number(env.PORT || 8744),
    allowedOrigins: origins,
    secureCookies: env.BFF_COOKIE_SECURE !== 'false',
    sessionIdleMs: Number(env.SESSION_IDLE_MS || 12 * 60 * 60 * 1000),
    sessionAbsoluteMs: Number(env.SESSION_ABSOLUTE_MS || 30 * 24 * 60 * 60 * 1000),
    sessionEncryptionKey: env.SESSION_ENCRYPTION_KEY || null,
    emailRedirectTo: env.EMAIL_REDIRECT_TO || 'http://localhost:8744/access'
  };
}

function validateRuntimeConfig(config, env = process.env) {
  const issues = [];
  for (const key of ['SUPABASE_URL', 'SUPABASE_PUBLISHABLE_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'SESSION_ENCRYPTION_KEY', 'ALLOWED_ORIGINS', 'EMAIL_REDIRECT_TO']) {
    if (!String(env[key] || '').trim()) issues.push(`Missing ${key}`);
  }
  if (!Number.isInteger(config.port) || config.port < 1 || config.port > 65535) issues.push('PORT must be an integer from 1 to 65535');
  if (!Number.isFinite(config.sessionIdleMs) || config.sessionIdleMs <= 0 || !Number.isFinite(config.sessionAbsoluteMs) || config.sessionAbsoluteMs < config.sessionIdleMs) {
    issues.push('Session durations are invalid');
  }
  if (!config.secureCookies) issues.push('BFF_COOKIE_SECURE must be true for __Host- cookies');
  if (Buffer.from(String(config.sessionEncryptionKey || ''), 'base64url').length !== 32) issues.push('SESSION_ENCRYPTION_KEY must decode to exactly 32 bytes');
  if (!Array.isArray(config.allowedOrigins) || config.allowedOrigins.length === 0) issues.push('ALLOWED_ORIGINS must contain at least one exact origin');
  for (const origin of config.allowedOrigins || []) {
    if (origin === '*') {
      issues.push('ALLOWED_ORIGINS must contain exact HTTPS origins (HTTP is allowed only for localhost development)');
      break;
    }
    try {
      const parsed = new URL(origin);
      const localHttp = parsed.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname);
      if (parsed.origin !== origin || parsed.username || parsed.password || (parsed.protocol !== 'https:' && !localHttp)) {
        issues.push('ALLOWED_ORIGINS must contain exact HTTPS origins (HTTP is allowed only for localhost development)');
        break;
      }
    } catch {
      issues.push('ALLOWED_ORIGINS contains an invalid origin');
      break;
    }
  }
  try {
    const supabase = new URL(String(env.SUPABASE_URL || ''));
    if (supabase.protocol !== 'https:' || supabase.username || supabase.password || supabase.pathname !== '/' || supabase.search || supabase.hash) {
      issues.push('SUPABASE_URL must be a root HTTPS URL without embedded credentials, path, query or fragment');
    }
  } catch { issues.push('SUPABASE_URL must be a valid HTTPS URL'); }
  try {
    const redirect = new URL(config.emailRedirectTo);
    if (redirect.username || redirect.password || !config.allowedOrigins.includes(redirect.origin)) issues.push('EMAIL_REDIRECT_TO must be credential-free and use an origin listed in ALLOWED_ORIGINS');
  } catch { issues.push('EMAIL_REDIRECT_TO must be a valid URL'); }
  return issues;
}

function json(res, status, body, headers = {}) {
  const data = body === undefined ? '' : JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers });
  res.end(data);
}

function errorBody(code, message, requestId, fieldErrors) {
  return { code, message, request_id: requestId, ...(fieldErrors ? { field_errors: fieldErrors } : {}) };
}

function sendError(res, status, code, message, requestId, fieldErrors) {
  return json(res, status, errorBody(code, message, requestId, fieldErrors));
}

async function readJson(req, maxBytes = 64 * 1024) {
  let total = 0;
  const chunks = [];
  for await (const chunk of req) {
    total += chunk.length;
    if (total > maxBytes) throw Object.assign(new Error('payload too large'), { status: 413 });
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  const contentType = String(req.headers['content-type'] || '').split(';', 1)[0].trim().toLowerCase();
  if (contentType !== 'application/json' && !/^application\/[a-z0-9.+-]+\+json$/.test(contentType)) {
    throw Object.assign(new Error('unsupported content type'), { status: 415, expose: true });
  }
  let body;
  try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw Object.assign(new Error('invalid json'), { status: 400, expose: true }); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw Object.assign(new Error('invalid json body'), { status: 400, expose: true });
  return body;
}

function cookieHeaders(config, sessionToken, csrfToken, clear = false) {
  const base = { secure: config.secureCookies, sameSite: 'None', path: '/' };
  if (clear) return [
    serializeCookie(SESSION_COOKIE, '', { ...base, httpOnly: true, maxAge: 0 }),
    serializeCookie(CSRF_COOKIE, '', { ...base, maxAge: 0 })
  ];
  return [
    serializeCookie(SESSION_COOKIE, sessionToken, { ...base, httpOnly: true }),
    serializeCookie(CSRF_COOKIE, csrfToken, base)
  ];
}

function setCookies(res, values) { res.setHeader('Set-Cookie', values); }

function validateOrigin(req, config) {
  const origin = req.headers.origin;
  if (!origin) return false;
  return config.allowedOrigins.includes(origin);
}

function validateCsrf(req, config, cookies) {
  return Boolean(cookies[CSRF_COOKIE] && req.headers['x-csrf-token'] && timingSafeEqualText(cookies[CSRF_COOKIE], req.headers['x-csrf-token']) && validateOrigin(req, config));
}

function validateRegistration(body) {
  const email = normalizeEmail(body.email);
  const fields = {};
  if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 254) fields.email = 'Enter a valid email address.';
  if (typeof body.password !== 'string' || body.password.length < 12 || body.password.length > 128) fields.password = 'Password must be between 12 and 128 characters.';
  if (body.display_name !== undefined && (typeof body.display_name !== 'string' || body.display_name.length > 60)) fields.display_name = 'Display name is too long.';
  return { email, fields };
}

function validateProfile(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(key => !['display_name', 'clientMutationId'].includes(key))) return { error: 'Only display_name and clientMutationId can be updated.' };
  if (typeof body.display_name !== 'string' || body.display_name.length > 60) return { error: 'Display name is invalid.' };
  if (body.clientMutationId !== undefined && !validateClientMutationId(body.clientMutationId)) return { error: 'clientMutationId is invalid.' };
  return { patch: { display_name: body.display_name }, clientMutationId: body.clientMutationId || null };
}

function publicUser(user) {
  return { user_id: user.user_id, email: user.email, email_verified: Boolean(user.email_verified), display_name: user.display_name || '', status: user.status, entitlements: Array.isArray(user.entitlements) ? user.entitlements : [] };
}

function parsePageParams(url, { maxPerPage = 200 } = {}) {
  const page = Math.max(1, Number.parseInt(url.searchParams.get('page'), 10) || 1);
  const perPage = Math.min(maxPerPage, Math.max(1, Number.parseInt(url.searchParams.get('per_page'), 10) || 50));
  return { page, perPage };
}

function createBff({ config = configFromEnv(), auth, sessions, entitlements = null, billingStore = null, businessStore, brvmPublicationStore = null, mutationStore = null, adminRoles = null, clock = () => new Date(), logger = () => {} }) {
  if (!auth || !sessions) throw new Error('auth and sessions adapters are required');
  businessStore = businessStore || {
    exportUserData: async () => ({ lesson_progress: [], journal_entries: [], journal_plans: [], preferences: [] }),
    deleteUserData: async () => {}
  };

  async function currentEntitlements(userId) {
    if (!entitlements || typeof entitlements.getForUser !== 'function') return { membership: null, entitlements: [] };
    const snapshot = await entitlements.getForUser(userId);
    return {
      membership: snapshot?.membership || null,
      entitlements: Array.isArray(snapshot?.entitlements) ? snapshot.entitlements : []
    };
  }

  function hasActivePremium(snapshot, now) {
    const membership = snapshot.membership;
    if (!membership || !['active', 'trial'].includes(membership.status) || membership.revoked_at) return false;
    if (membership.ends_at && new Date(membership.ends_at).getTime() <= now.getTime()) return false;
    return snapshot.entitlements.includes('premium_track');
  }

  async function createSession(userId, provider, req) {
    const now = clock();
    const token = randomToken(32);
    const csrf = randomToken(32);
    const row = await sessions.create({
      user_id: userId,
      token_hash: sha256(token),
      provider_access_token_enc: config.sessionEncryptionKey ? encrypt(provider.access_token, config.sessionEncryptionKey) : null,
      provider_refresh_token_enc: config.sessionEncryptionKey ? encrypt(provider.refresh_token, config.sessionEncryptionKey) : null,
      user_agent: String(req.headers['user-agent'] || '').slice(0, 240),
      ip_hash: sha256(String(req.socket?.remoteAddress || '')),
      created_at: now.toISOString(),
      last_seen_at: now.toISOString(),
      expires_at: new Date(now.getTime() + config.sessionAbsoluteMs).toISOString()
    });
    return { token, csrf, row };
  }

  async function currentSession(req) {
    const cookies = parseCookies(req.headers.cookie || '');
    if (!cookies[SESSION_COOKIE]) return { cookies, session: null };
    const session = await sessions.findActiveByTokenHash(sha256(cookies[SESSION_COOKIE]), clock());
    if (!session) return { cookies, session: null };
    const idleLimit = new Date(clock().getTime() - config.sessionIdleMs).toISOString();
    if (session.last_seen_at < idleLimit) {
      await sessions.revoke(session.session_id, clock());
      return { cookies, session: null };
    }
    await sessions.touch(session.session_id, clock());
    return { cookies, session };
  }

  async function withUser(req, res, requestId) {
    const state = await currentSession(req);
    if (!state.session) { sendError(res, 401, 'unauthenticated', 'Authentication required.', requestId); return null; }
    try { return { ...state, user: await auth.getUser(state.session.user_id) }; }
    catch (error) { logger('get_user_failed', { requestId, status: error.status || 500 }); sendError(res, 401, 'unauthenticated', 'Authentication required.', requestId); return null; }
  }

  // Admin authorization is never taken from the client: the caller's role
  // is re-derived server-side from dda_admin_roles, keyed by the user_id
  // the session cookie already proved. A role header, body field, or
  // anything from localStorage is never consulted — there is nothing for
  // the browser to send that would change this outcome.
  async function withAdmin(req, res, requestId) {
    const current = await withUser(req, res, requestId);
    if (!current) return null;
    if (!adminRoles || typeof adminRoles.getRole !== 'function') {
      sendError(res, 503, 'admin_not_configured', 'The admin role store is not configured.', requestId);
      return null;
    }
    let role;
    try { role = await adminRoles.getRole(current.user.user_id); }
    catch (error) {
      logger('admin_role_lookup_failed', { requestId, status: error.status || 500 });
      sendError(res, 500, 'internal_error', 'Request could not be processed.', requestId);
      return null;
    }
    if (role !== 'owner' && role !== 'admin') {
      sendError(res, 403, 'admin_role_required', 'An owner or admin role is required.', requestId);
      return null;
    }
    return { ...current, role };
  }

  return async function handle(req, res) {
    const requestId = `req_${randomUUID()}`;
    const url = new URL(req.url, 'http://bff.local');
    const path = url.pathname.replace(/\/+$/, '') || '/';
    const method = req.method || 'GET';
    const origin = req.headers.origin;
    const corsHeaders = {};
    if (origin && config.allowedOrigins.includes(origin)) {
      corsHeaders['Access-Control-Allow-Origin'] = origin;
      corsHeaders['Access-Control-Allow-Credentials'] = 'true';
      corsHeaders.Vary = 'Origin';
    }
    if (method === 'OPTIONS') {
      if (!origin || !config.allowedOrigins.includes(origin)) return sendError(res, 403, 'csrf_failed', 'Origin is not allowed.', requestId);
      res.writeHead(204, { ...corsHeaders, 'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, X-CSRF-Token', 'Access-Control-Max-Age': '600' });
      return res.end();
    }
    res.setHeader('X-Request-Id', requestId);
    for (const [key, value] of Object.entries(corsHeaders)) res.setHeader(key, value);
    if (!SAFE_METHODS.has(method) && !validateOrigin(req, config)) return sendError(res, 403, 'csrf_failed', 'Origin is not allowed.', requestId);

    try {
      if (method === 'GET' && path === '/v1/security/csrf') {
        const csrf = randomToken(32);
        setCookies(res, [serializeCookie(CSRF_COOKIE, csrf, { secure: config.secureCookies, sameSite: 'None', path: '/' })]);
        return json(res, 204, undefined);
      }
      if (method === 'GET' && path === '/healthz') return json(res, 200, { status: 'ok' });
      if (method === 'GET' && path === '/v1/publications/brvm') {
        if (!brvmPublicationStore || typeof brvmPublicationStore.listPublished !== 'function') {
          return sendError(res, 503, 'publications_unavailable', 'Verified publications are not available.', requestId);
        }
        const items = await brvmPublicationStore.listPublished();
        if (!Array.isArray(items)) throw new Error('brvm_publications_store_invalid_shape');
        return json(res, 200, { items });
      }
      if (method === 'POST' && path === '/v1/auth/register') {
        const body = await readJson(req);
        const validation = validateRegistration(body);
        if (Object.keys(validation.fields).length) return sendError(res, 400, 'validation_error', 'Request could not be processed.', requestId, validation.fields);
        await auth.register({ email: validation.email, password: body.password, display_name: body.display_name, redirectTo: config.emailRedirectTo });
        return json(res, 202, { message: 'If the registration can be completed, a verification message will be sent.' });
      }
      if (method === 'POST' && path === '/v1/auth/verify-email') {
        const body = await readJson(req);
        if (typeof body.token !== 'string' || body.token.length < 32) return sendError(res, 400, 'invalid_token', 'The token is invalid or expired.', requestId);
        await auth.verifyEmail(body.token);
        return json(res, 204);
      }
      if (method === 'POST' && path === '/v1/auth/login') {
        const body = await readJson(req);
        const validation = validateRegistration({ email: body.email, password: body.password });
        if (Object.keys(validation.fields).length) return sendError(res, 400, 'validation_error', 'Request could not be processed.', requestId);
        let provider;
        try { provider = await auth.login({ email: validation.email, password: body.password }); }
        catch (error) { logger('login_failed', { requestId, status: error.status || 401 }); return sendError(res, 401, 'authentication_failed', 'Authentication failed.', requestId); }
        if (!provider?.user?.id || !provider.access_token) return sendError(res, 401, 'authentication_failed', 'Authentication failed.', requestId);
        const created = await createSession(provider.user.id, provider, req);
        setCookies(res, cookieHeaders(config, created.token, created.csrf));
        return json(res, 204);
      }
      if (method === 'POST' && path === '/v1/auth/password-reset/request') {
        const body = await readJson(req);
        const email = normalizeEmail(body.email);
        if (!/^\S+@\S+\.\S+$/.test(email)) return sendError(res, 400, 'validation_error', 'Request could not be processed.', requestId);
        try { await auth.requestPasswordReset(email, config.emailRedirectTo); } catch (error) { logger('recovery_failed', { requestId, status: error.status || 500 }); }
        return json(res, 202, { message: 'If the account can be recovered, a message will be sent.' });
      }
      if (method === 'POST' && path === '/v1/auth/password-reset/confirm') {
        const body = await readJson(req);
        if (typeof body.token !== 'string' || body.token.length < 20) return sendError(res, 400, 'invalid_token', 'The token is invalid or expired.', requestId);
        if (typeof body.password !== 'string' || body.password.length < 12) return sendError(res, 400, 'validation_error', 'Request could not be processed.', requestId, { password: 'too_short' });
        try { await auth.confirmPasswordReset(body.token, body.password); }
        catch (error) { logger('password_reset_confirm_failed', { requestId, status: error.status || 400 }); return sendError(res, 400, 'invalid_token', 'The token is invalid or expired.', requestId); }
        return json(res, 204);
      }
      if (method === 'GET' && path === '/v1/me') {
        const current = await withUser(req, res, requestId); if (!current) return;
        return json(res, 200, publicUser(current.user));
      }
      if (method === 'GET' && path === '/v1/premium/preview') {
        const current = await withUser(req, res, requestId); if (!current) return;
        const snapshot = await currentEntitlements(current.user.user_id);
        if (!hasActivePremium(snapshot, clock())) return sendError(res, 403, 'premium_required', 'An active Premium entitlement is required.', requestId);
        return json(res, 200, { resource: 'premium_preview', entitlement: 'premium_track', server_authorized: true });
      }
      if (method === 'PATCH' && path === '/v1/me') {
        const current = await withUser(req, res, requestId); if (!current) return;
        if (!validateCsrf(req, config, current.cookies)) return sendError(res, 403, 'csrf_failed', 'CSRF validation failed.', requestId);
        const validation = validateProfile(await readJson(req));
        if (validation.error) return sendError(res, 400, 'validation_error', validation.error, requestId);
        const execute = () => auth.updateUser(current.user.user_id, validation.patch).then(user => ({ status: 200, body: publicUser(user) }));
        if (!validation.clientMutationId) return json(res, 200, publicUser(await auth.updateUser(current.user.user_id, validation.patch)));
        const result = await executeIdempotentMutation({ store: mutationStore, ownerId: current.user.user_id, endpoint: '/v1/me', clientMutationId: validation.clientMutationId, payload: validation.patch, execute });
        return json(res, result.status, result.body);
      }
      if (method === 'GET' && path === '/v1/account/export') {
        const current = await withUser(req, res, requestId); if (!current) return;
        return json(res, 200, {
          contract: 'p3-data-contract-v1',
          exported_at: clock().toISOString(),
          account: publicUser(current.user),
          sessions: await sessions.list(current.user.user_id),
          data: await businessStore.exportUserData(current.user.user_id)
        });
      }
      if (method === 'DELETE' && path === '/v1/account') {
        const current = await withUser(req, res, requestId); if (!current) return;
        if (!validateCsrf(req, config, current.cookies)) return sendError(res, 403, 'csrf_failed', 'CSRF validation failed.', requestId);
        const body = await readJson(req);
        if (body.confirmation !== 'DELETE') return sendError(res, 400, 'confirmation_required', 'Type DELETE to confirm account deletion.', requestId);
        await businessStore.deleteUserData(current.user.user_id);
        await billingStore?.deleteUserData?.(current.user.user_id);
        await sessions.revokeAll(current.user.user_id, clock());
        await auth.deleteUser(current.user.user_id);
        setCookies(res, cookieHeaders(config, '', '', true));
        return json(res, 204);
      }
      if (method === 'GET' && path === '/v1/sessions') {
        const current = await withUser(req, res, requestId); if (!current) return;
        const items = await sessions.list(current.user.user_id);
        return json(res, 200, { items });
      }
      if (method === 'POST' && path === '/v1/auth/logout') {
        const current = await withUser(req, res, requestId); if (!current) return;
        if (!validateCsrf(req, config, current.cookies)) return sendError(res, 403, 'csrf_failed', 'CSRF validation failed.', requestId);
        await sessions.revoke(current.session.session_id, clock());
        if (config.sessionEncryptionKey && current.session.provider_access_token_enc) await auth.revokeProviderSession(decrypt(current.session.provider_access_token_enc, config.sessionEncryptionKey));
        setCookies(res, cookieHeaders(config, '', '', true));
        return json(res, 204);
      }
      if (method === 'POST' && path === '/v1/auth/logout-all') {
        const current = await withUser(req, res, requestId); if (!current) return;
        if (!validateCsrf(req, config, current.cookies)) return sendError(res, 403, 'csrf_failed', 'CSRF validation failed.', requestId);
        await sessions.revokeAll(current.user.user_id, clock());
        setCookies(res, cookieHeaders(config, '', '', true));
        return json(res, 204);
      }
      const revokeMatch = path.match(/^\/v1\/sessions\/([^/]+)$/);
      if (method === 'DELETE' && revokeMatch) {
        const current = await withUser(req, res, requestId); if (!current) return;
        if (!validateCsrf(req, config, current.cookies)) return sendError(res, 403, 'csrf_failed', 'CSRF validation failed.', requestId);
        const id = revokeMatch[1];
        const items = await sessions.list(current.user.user_id);
        if (!items.some(item => item.session_id === id)) return sendError(res, 404, 'not_found', 'Resource not found.', requestId);
        await sessions.revoke(id, clock());
        return json(res, 204);
      }
      if (method === 'GET' && path === '/v1/admin/overview') {
        const admin = await withAdmin(req, res, requestId); if (!admin) return;
        const metrics = {};
        try {
          const value = await sessions.countActive?.(clock());
          metrics.active_sessions = typeof value === 'number' ? { available: true, value, source: 'dda_sessions' } : { available: false, value: null, reason: 'Session store does not expose a count.' };
        } catch (error) {
          logger('admin_overview_metric_failed', { requestId, metric: 'active_sessions' });
          metrics.active_sessions = { available: false, value: null, reason: 'Count query failed.' };
        }
        try {
          const value = await billingStore?.countMembershipsByStatus?.();
          metrics.memberships_by_status = value ? { available: true, value, source: 'dda_billing_memberships' } : { available: false, value: null, reason: 'Billing store is not configured.' };
        } catch (error) {
          logger('admin_overview_metric_failed', { requestId, metric: 'memberships_by_status' });
          metrics.memberships_by_status = { available: false, value: null, reason: 'Count query failed.' };
        }
        // Deliberately not computed: Supabase's Admin Auth API list endpoint
        // does not reliably return a cross-version total user count, and a
        // full paginated scan on every overview load would be expensive and
        // itself a new failure mode. Reported as unavailable rather than
        // guessed, per the explicit instruction to never invent an indicator.
        metrics.registered_users_total = { available: false, value: null, reason: 'Not computed: the Admin Auth API does not expose a reliable total without a full paginated scan.' };
        return json(res, 200, { contract: 'dda-admin-overview-v1', generated_at: clock().toISOString(), caller: { user_id: admin.user.user_id, role: admin.role }, metrics });
      }
      if (method === 'GET' && path === '/v1/admin/users') {
        const admin = await withAdmin(req, res, requestId); if (!admin) return;
        if (typeof auth.listUsers !== 'function') return sendError(res, 503, 'admin_not_configured', 'User listing is not available.', requestId);
        const { page, perPage } = parsePageParams(url);
        const { users, total } = await auth.listUsers({ page, perPage });
        const withRoles = await Promise.all(users.map(async user => ({ ...user, role: (await adminRoles.getRole(user.user_id)) || null })));
        return json(res, 200, { contract: 'dda-admin-users-v1', page, per_page: perPage, total, users: withRoles });
      }
      if (method === 'GET' && path === '/v1/admin/memberships') {
        const admin = await withAdmin(req, res, requestId); if (!admin) return;
        if (!billingStore || typeof billingStore.listMemberships !== 'function') return sendError(res, 503, 'admin_not_configured', 'Membership listing is not available.', requestId);
        const { page, perPage } = parsePageParams(url);
        const items = await billingStore.listMemberships({ page, perPage });
        return json(res, 200, { contract: 'dda-admin-memberships-v1', page, per_page: perPage, items });
      }
      return sendError(res, 404, 'not_found', 'Resource not found.', requestId);
    } catch (error) {
      // Never copy exception messages into operational logs: they may contain
      // free-text Journal content, provider responses, or other user data.
      logger('request_failed', { requestId, status: error.status || 500, error_code: error.code || 'internal_error' });
      const status = [400, 409, 413, 415].includes(error.status) ? error.status : 500;
      const code = [400, 413, 415].includes(status) ? 'validation_error' : (error.code || (status === 409 ? 'conflict' : 'internal_error'));
      return sendError(res, status, code, status === 409 ? 'The mutation conflicts with an earlier request.' : 'Request could not be processed.', requestId);
    }
  };
}

module.exports = { createBff, configFromEnv, validateRuntimeConfig, SESSION_COOKIE, CSRF_COOKIE, readJson };
