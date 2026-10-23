'use strict';

const { randomUUID } = require('node:crypto');
const { randomToken, sha256, timingSafeEqualText, parseCookies, serializeCookie, encrypt, decrypt, normalizeEmail } = require('./security');
const { executeIdempotentMutation, validateClientMutationId } = require('./idempotency');
const { analyzeMarketSeries } = require('./autotrader/market-analysis');
const { analyzeMarketSeriesV2 } = require('./autotrader/market-analysis-v2');
const { AUTOTRADER_ANALYSIS_ENTITLEMENT, normalizeEntitlements } = require('./entitlement-catalog');
const { quotaPolicyFromEnv } = require('./quota-policy');

const SESSION_COOKIE = '__Host-dda_session';
const CSRF_COOKIE = '__Host-dda_csrf';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function configFromEnv(env = process.env) {
  const origins = String(env.ALLOWED_ORIGINS || 'http://localhost:8744').split(',').map(x => x.trim()).filter(Boolean);
  const productionOrigins = String(env.BFF_PRODUCTION_ALLOWED_ORIGINS || '').split(',').map(x => x.trim()).filter(Boolean);
  return {
    port: Number(env.PORT || 8744),
    runtimeEnvironment: String(env.BFF_ENVIRONMENT || '').trim().toLowerCase(),
    allowedOrigins: origins,
    productionOrigins,
    productionSupabaseUrl: String(env.BFF_PRODUCTION_SUPABASE_URL || '').trim(),
    secureCookies: env.BFF_COOKIE_SECURE !== 'false',
    sessionIdleMs: Number(env.SESSION_IDLE_MS || 12 * 60 * 60 * 1000),
    sessionAbsoluteMs: Number(env.SESSION_ABSOLUTE_MS || 30 * 24 * 60 * 60 * 1000),
    sessionEncryptionKey: env.SESSION_ENCRYPTION_KEY || null,
    emailRedirectTo: env.EMAIL_REDIRECT_TO || 'http://localhost:8744/access'
  };
}

function validateRuntimeConfig(config, env = process.env) {
  const issues = [];
  if (!['development', 'staging', 'production'].includes(config.runtimeEnvironment)) issues.push('BFF_ENVIRONMENT must be explicitly set to development, staging, or production');
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
      if (config.runtimeEnvironment === 'production' && localHttp) {
        issues.push('Production ALLOWED_ORIGINS cannot contain localhost origins');
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
  if (config.runtimeEnvironment === 'staging') {
    if (!config.productionSupabaseUrl) issues.push('BFF_PRODUCTION_SUPABASE_URL is required in staging to prevent production database reuse');
    if (!Array.isArray(config.productionOrigins) || config.productionOrigins.length === 0) issues.push('BFF_PRODUCTION_ALLOWED_ORIGINS is required in staging to prevent production origin reuse');
    try {
      const stagingSupabase = new URL(String(env.SUPABASE_URL || ''));
      const productionSupabase = new URL(config.productionSupabaseUrl);
      if (productionSupabase.protocol !== 'https:' || productionSupabase.username || productionSupabase.password || productionSupabase.pathname !== '/' || productionSupabase.search || productionSupabase.hash) {
        issues.push('BFF_PRODUCTION_SUPABASE_URL must be a root HTTPS URL without embedded credentials, path, query or fragment');
      } else if (stagingSupabase.origin === productionSupabase.origin) {
        issues.push('Staging SUPABASE_URL must not match BFF_PRODUCTION_SUPABASE_URL');
      }
    } catch { if (config.productionSupabaseUrl) issues.push('BFF_PRODUCTION_SUPABASE_URL must be a valid HTTPS URL'); }
    const prodOrigins = new Set(config.productionOrigins || []);
    for (const origin of prodOrigins) {
      try {
        const parsed = new URL(origin);
        if (parsed.origin !== origin || parsed.protocol !== 'https:' || parsed.username || parsed.password) {
          issues.push('BFF_PRODUCTION_ALLOWED_ORIGINS must contain exact credential-free HTTPS origins');
          break;
        }
      } catch {
        issues.push('BFF_PRODUCTION_ALLOWED_ORIGINS contains an invalid origin');
        break;
      }
    }
    if ((config.allowedOrigins || []).some(origin => prodOrigins.has(origin))) issues.push('Staging ALLOWED_ORIGINS must not overlap BFF_PRODUCTION_ALLOWED_ORIGINS');
  }
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
  const base = { secure: config.secureCookies, sameSite: 'Lax', path: '/' };
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

function createBff({ config = configFromEnv(), auth, sessions, entitlements = null, billingStore = null, quotaStore = null, quotaPolicy = quotaPolicyFromEnv(), businessStore, brvmPublicationStore = null, mutationStore = null, clock = () => new Date(), logger = () => {}, marketAnalyzer = analyzeMarketSeries, marketAnalyzerV2 = analyzeMarketSeriesV2, providerMarketData = null, marketSnapshotMaxAgeMs = 5 * 60 * 1000 }) {
  if (!auth || !sessions) throw new Error('auth and sessions adapters are required');
  businessStore = businessStore || {
    exportUserData: async () => ({ lesson_progress: [], journal_entries: [], journal_plans: [], preferences: [] }),
    deleteUserData: async () => {}
  };

  async function currentEntitlements(userId) {
    if (!entitlements || typeof entitlements.getForUser !== 'function') return { membership: null, memberships: [], entitlements: [] };
    const snapshot = await entitlements.getForUser(userId, clock());
    return {
      membership: snapshot?.membership || null,
      memberships: Array.isArray(snapshot?.memberships) ? snapshot.memberships : [],
      entitlements: normalizeEntitlements(snapshot?.entitlements)
    };
  }

  async function publicUserWithEntitlements(user) {
    try {
      const snapshot = await currentEntitlements(user.user_id);
      return publicUser({ ...user, entitlements: snapshot.entitlements });
    } catch (error) {
      logger('entitlement_lookup_failed', { status: error.status || 500 });
      return publicUser({ ...user, entitlements: [] });
    }
  }

  function hasEntitlement(snapshot, entitlement, now) {
    if (!Array.isArray(snapshot?.entitlements) || !snapshot.entitlements.includes(entitlement)) return false;
    const memberships = snapshot.memberships.length
      ? snapshot.memberships
      : (snapshot.membership ? [snapshot.membership] : []);
    return memberships.some(membership => {
      if (membership?.status !== 'active' || membership.revoked_at) return false;
      const startsAt = membership.starts_at ? new Date(membership.starts_at).getTime() : null;
      const endsAt = membership.ends_at ? new Date(membership.ends_at).getTime() : null;
      if (startsAt !== null && (!Number.isFinite(startsAt) || startsAt > now.getTime())) return false;
      if (endsAt !== null && (!Number.isFinite(endsAt) || endsAt <= now.getTime())) return false;
      return Array.isArray(membership.entitlements)
        ? membership.entitlements.includes(entitlement)
        : true;
    });
  }

  function hasActivePremium(snapshot, now) {
    if (!snapshot.entitlements.includes('premium_track')) return false;
    const memberships = snapshot.memberships.length
      ? snapshot.memberships
      : (snapshot.membership ? [snapshot.membership] : []);
    return memberships.some(membership => {
      if (!membership || !['active', 'trial'].includes(membership.status) || membership.revoked_at) return false;
      const startsAt = membership.starts_at ? new Date(membership.starts_at).getTime() : null;
      const endsAt = membership.ends_at ? new Date(membership.ends_at).getTime() : null;
      if (startsAt !== null && (!Number.isFinite(startsAt) || startsAt > now.getTime())) return false;
      if (endsAt !== null && (!Number.isFinite(endsAt) || endsAt <= now.getTime())) return false;
      return !Array.isArray(membership.entitlements) || membership.entitlements.includes('premium_track');
    });
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
        setCookies(res, [serializeCookie(CSRF_COOKIE, csrf, { secure: config.secureCookies, sameSite: 'Lax', path: '/' })]);
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
      if (method === 'POST' && path === '/v1/autotrader/provider-analysis') {
        const body = await readJson(req, 1024);
        if (Object.keys(body).length !== 1 || typeof body.instrument_id !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(body.instrument_id)) {
          return sendError(res, 400, 'validation_error', 'Request must contain only a valid instrument_id.', requestId);
        }
        const current = await withUser(req, res, requestId); if (!current) return;
        const access = await currentEntitlements(current.user.user_id);
        if (!hasEntitlement(access, AUTOTRADER_ANALYSIS_ENTITLEMENT, clock())) {
          return sendError(res, 403, 'entitlement_required', 'An active AutoTrader analysis entitlement is required.', requestId);
        }
        if (!providerMarketData || typeof providerMarketData.hasInstrument !== 'function' || typeof providerMarketData.getSeries !== 'function') {
          return sendError(res, 503, 'market_data_unavailable', 'Configured read-only market data is not available.', requestId);
        }
        if (!providerMarketData.hasInstrument(body.instrument_id)) {
          return sendError(res, 404, 'instrument_unavailable', 'The requested AutoTrader instrument is not configured.', requestId);
        }
        const providerId = quotaPolicy.providerId;
        if (!providerId || providerId !== providerMarketData.providerId || !quotaStore || typeof quotaStore.reserveUserProviderAnalysis !== 'function') {
          return sendError(res, 503, 'quota_unavailable', 'AutoTrader usage limits are unavailable.', requestId);
        }
        let reservation;
        try {
          reservation = await quotaStore.reserveUserProviderAnalysis({
            userId: current.user.user_id, providerId, units: 1, asOf: clock(), policy: quotaPolicy
          });
        } catch (error) {
          logger('autotrader_provider_quota_failed', { requestId, status: error.status || 503, error_code: error.code || 'quota_unavailable' });
          return sendError(res, 503, 'quota_unavailable', 'AutoTrader usage limits are unavailable.', requestId);
        }
        if (!reservation || typeof reservation.allowed !== 'boolean') {
          logger('autotrader_provider_quota_invalid', { requestId });
          return sendError(res, 503, 'quota_unavailable', 'AutoTrader usage limits are unavailable.', requestId);
        }
        if (!reservation.allowed) {
          const retryAt = reservation.retry_at ? new Date(reservation.retry_at).getTime() : NaN;
          const retryAfter = Number.isFinite(retryAt) ? Math.max(1, Math.ceil((retryAt - clock().getTime()) / 1000)) : 60;
          const providerScope = reservation.scope_type === 'provider';
          const code = providerScope ? 'provider_quota_exceeded' : 'quota_exceeded';
          const message = providerScope ? 'Market data provider usage limits have been reached.' : 'AutoTrader analysis quota has been reached.';
          return json(res, 429, errorBody(code, message, requestId), { 'Retry-After': String(retryAfter) });
        }

        const analyzedAt = clock();
        let series;
        try { series = await providerMarketData.getSeries(body.instrument_id, { asOf: analyzedAt }); }
        catch (error) {
          const code = error?.code;
          logger('autotrader_provider_fetch_failed', { requestId, providerId, error_code: code || 'provider_unavailable', status: error?.status || 503 });
          if (code === 'instrument_not_configured') return sendError(res, 404, 'instrument_unavailable', 'The requested AutoTrader instrument is not configured.', requestId);
          if (code === 'provider_rate_limited') return json(res, 429, errorBody(code, 'Market data provider is temporarily rate limited.', requestId), { 'Retry-After': '60' });
          const status = code === 'provider_request_rejected' ? 502 : (error?.status === 503 ? 503 : 502);
          return sendError(res, status, 'market_data_unavailable', 'Market data could not be retrieved and validated.', requestId);
        }

        const analysis = marketAnalyzerV2(series, { asOf: analyzedAt });
        if (!analysis || typeof analysis !== 'object') throw new Error('autotrader_v2_analysis_invalid_result');
        if (analysis.status !== 'analysis_complete' || analysis.execution_enabled !== false || analysis.order_recommendation !== null) {
          if (analysis.status === 'stale_data') return sendError(res, 422, 'stale_market_data', 'Market data is too old for this analysis.', requestId);
          if (analysis.status === 'rejected') return sendError(res, 502, 'market_data_unavailable', 'Market data could not be validated and analyzed.', requestId);
          throw new Error('autotrader_v2_analysis_safety_invariant_failed');
        }
        let latestAccess;
        try { latestAccess = await currentEntitlements(current.user.user_id); }
        catch (error) {
          logger('autotrader_entitlement_recheck_failed', { requestId, status: error.status || 503 });
          return sendError(res, 503, 'access_state_unavailable', 'AutoTrader access could not be verified.', requestId);
        }
        if (!hasEntitlement(latestAccess, AUTOTRADER_ANALYSIS_ENTITLEMENT, clock())) {
          return sendError(res, 403, 'entitlement_required', 'An active AutoTrader analysis entitlement is required.', requestId);
        }
        const latestBar = series.bars.at(-1);
        return json(res, 200, {
          contract_version: 'dda.autotrader.provider-analysis-response.v1',
          analyzed_at: analyzedAt.toISOString(),
          series_summary: {
            instrument: series.instrument, timeframe: series.timeframe, data_mode: series.data_mode,
            bar_count: series.bars.length, latest_bar_at: latestBar?.timestamp || null,
            source: series.source
          },
          analysis
        });
      }
      if (method === 'POST' && path === '/v1/autotrader/analyze') {
        const body = await readJson(req, 64 * 1024);
        if (Object.keys(body).length !== 1 || !Object.hasOwn(body, 'series')) {
          return sendError(res, 400, 'validation_error', 'Request must contain only a series property.', requestId);
        }
        const current = await withUser(req, res, requestId); if (!current) return;
        const access = await currentEntitlements(current.user.user_id);
        if (!hasEntitlement(access, AUTOTRADER_ANALYSIS_ENTITLEMENT, clock())) {
          return sendError(res, 403, 'entitlement_required', 'An active AutoTrader analysis entitlement is required.', requestId);
        }
        if (!quotaStore || typeof quotaStore.reserveUserAnalysis !== 'function') {
          return sendError(res, 503, 'quota_unavailable', 'AutoTrader usage limits are unavailable.', requestId);
        }
        let reservation;
        try {
          reservation = await quotaStore.reserveUserAnalysis({ userId: current.user.user_id, asOf: clock(), policy: quotaPolicy });
        } catch (error) {
          logger('autotrader_user_quota_failed', { requestId, status: error.status || 503 });
          return sendError(res, 503, 'quota_unavailable', 'AutoTrader usage limits are unavailable.', requestId);
        }
        if (!reservation || typeof reservation.allowed !== 'boolean') {
          logger('autotrader_user_quota_invalid', { requestId });
          return sendError(res, 503, 'quota_unavailable', 'AutoTrader usage limits are unavailable.', requestId);
        }
        if (!reservation.allowed) {
          const retryAt = reservation.retry_at ? new Date(reservation.retry_at).getTime() : NaN;
          const retryAfter = Number.isFinite(retryAt) ? Math.max(1, Math.ceil((retryAt - clock().getTime()) / 1000)) : 60;
          return json(res, 429, errorBody('quota_exceeded', 'AutoTrader analysis quota has been reached.', requestId), { 'Retry-After': String(retryAfter) });
        }
        const analyzedAt = clock();
        const analysis = marketAnalyzer(body.series, { asOf: analyzedAt, maxAgeMs: marketSnapshotMaxAgeMs });
        if (!analysis || typeof analysis !== 'object') throw new Error('autotrader_analysis_invalid_result');
        let latestAccess;
        try { latestAccess = await currentEntitlements(current.user.user_id); }
        catch (error) {
          logger('autotrader_entitlement_recheck_failed', { requestId, status: error.status || 503 });
          return sendError(res, 503, 'access_state_unavailable', 'AutoTrader access could not be verified.', requestId);
        }
        if (!hasEntitlement(latestAccess, AUTOTRADER_ANALYSIS_ENTITLEMENT, clock())) {
          return sendError(res, 403, 'entitlement_required', 'An active AutoTrader analysis entitlement is required.', requestId);
        }
        if (analysis.status === 'stale_data') {
          return sendError(res, 422, 'stale_market_data', 'Market data is too old for this analysis.', requestId, { issues: analysis.validation_errors || [] });
        }
        if (analysis.status === 'rejected') {
          return sendError(res, 400, 'invalid_market_series', 'Market series does not satisfy the analysis contract.', requestId, { issues: analysis.validation_errors || [] });
        }
        if (analysis.status !== 'analysis_complete' || analysis.execution_enabled !== false || analysis.order_recommendation !== null) {
          throw new Error('autotrader_analysis_safety_invariant_failed');
        }
        return json(res, 200, {
          contract_version: 'dda.autotrader.analysis-response.v1',
          analyzed_at: analyzedAt.toISOString(),
          analysis
        });
      }
      if (method === 'POST' && path === '/v1/auth/register') {
        const body = await readJson(req);
        const validation = validateRegistration(body);
        if (Object.keys(validation.fields).length) return sendError(res, 400, 'validation_error', 'Request could not be processed.', requestId, validation.fields);
        await auth.register({ email: validation.email, password: body.password, display_name: body.display_name });
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
      if (method === 'GET' && path === '/v1/me') {
        const current = await withUser(req, res, requestId); if (!current) return;
        return json(res, 200, await publicUserWithEntitlements(current.user));
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
        const execute = async () => ({ status: 200, body: await publicUserWithEntitlements(await auth.updateUser(current.user.user_id, validation.patch)) });
        if (!validation.clientMutationId) return json(res, 200, await publicUserWithEntitlements(await auth.updateUser(current.user.user_id, validation.patch)));
        const result = await executeIdempotentMutation({ store: mutationStore, ownerId: current.user.user_id, endpoint: '/v1/me', clientMutationId: validation.clientMutationId, payload: validation.patch, execute });
        return json(res, result.status, result.body);
      }
      if (method === 'GET' && path === '/v1/account/export') {
        const current = await withUser(req, res, requestId); if (!current) return;
        return json(res, 200, {
          contract: 'p3-data-contract-v1',
          exported_at: clock().toISOString(),
          account: await publicUserWithEntitlements(current.user),
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
