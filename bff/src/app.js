'use strict';

const { randomUUID } = require('node:crypto');
const { randomToken, sha256, timingSafeEqualText, parseCookies, serializeCookie, encrypt, decrypt, normalizeEmail } = require('./security');
const { generateCodeVerifier, computeCodeChallenge } = require('./pkce');
const { executeIdempotentMutation, validateClientMutationId } = require('./idempotency');
const { checkAuthRateLimit } = require('./rate-limiter');
const { VALID_ROLES: VALID_ADMIN_ROLES, CONTROL_PLANE_ROLES } = require('./admin-roles-store');
const { validateAskRequest } = require('./ai-assistant');
const { PREMIUM_CONTENT, FREE_PREVIEW_IDS } = require('./premium-content');
const { chariowConfigFromEnv, createChariowCheckout } = require('./chariow');

const SESSION_COOKIE = '__Host-dda_session';
const CSRF_COOKIE = '__Host-dda_csrf';
// PKCE code_verifier carriers (P0 auth reliability audit, 2026-11 — see
// pkce.js and the password-reset/register handlers below for the full
// rationale). One per flow, both httpOnly so client JS can never read or
// leak them, and both short-lived: a verifier that outlives the e-mail link
// it protects is a liability with no benefit, and GoTrue's own one-time
// code expires long before either TTL below.
const RECOVERY_VERIFIER_COOKIE = '__Host-dda_pw_verifier';
const SIGNUP_VERIFIER_COOKIE = '__Host-dda_signup_verifier';
// OAuth (Google sign-in, 2026-11): a third PKCE verifier carrier, same
// mechanism as the two above. Its round trip is the shortest of the three —
// the browser never leaves this tab chain (our start route -> Supabase ->
// Google -> Supabase -> our redirect_to), so its TTL only needs to outlast
// that immediate hop, never an e-mail inbox check.
const OAUTH_VERIFIER_COOKIE = '__Host-dda_oauth_verifier';
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
    emailRedirectTo: env.EMAIL_REDIRECT_TO || 'http://localhost:8744/access',
    passwordRecoveryRedirectTo: env.PASSWORD_RECOVERY_REDIRECT_TO || (() => { const u = new URL(env.EMAIL_REDIRECT_TO || 'http://localhost:8744/access'); u.searchParams.set('type', 'recovery'); return u.toString(); })(),
    // How long this server holds a PKCE code_verifier before it expires —
    // i.e. how long the learner has, from clicking "forgot password" /
    // "sign up", to click through the resulting e-mail in the SAME browser.
    // Recovery is the more sensitive action and gets the shorter window;
    // signup confirmation e-mails are routinely checked later, so it gets
    // more room. Both are deliberately short-lived compared to GoTrue's own
    // link TTL — the verifier only needs to outlive "time to open the inbox
    // and click", never the full link lifetime.
    recoveryVerifierTtlMs: Number(env.PASSWORD_RECOVERY_VERIFIER_TTL_MS || 30 * 60 * 1000),
    signupVerifierTtlMs: Number(env.SIGNUP_VERIFIER_TTL_MS || 60 * 60 * 1000),
    // Google OAuth (founder directive, 2026-11): where GoTrue sends the
    // browser back once the Google handshake is done. Derived from
    // EMAIL_REDIRECT_TO exactly like passwordRecoveryRedirectTo above —
    // same origin/hash, with its own marker query param (`auth=oauth-google`)
    // so dist/app.js's handleBffVerificationToken() can tell an OAuth return
    // apart from a recovery or signup-confirmation one. A dedicated env var
    // is honored if set, for a project that wants a different landing path.
    oauthGoogleRedirectTo: env.OAUTH_GOOGLE_REDIRECT_TO || (() => { const u = new URL(env.EMAIL_REDIRECT_TO || 'http://localhost:8744/access'); u.searchParams.set('auth', 'oauth-google'); return u.toString(); })(),
    // This PKCE verifier only needs to survive one immediate browser
    // round trip through Supabase and Google, never an e-mail inbox check —
    // a few minutes is deliberately generous for a slow consent screen
    // without leaving it valid any longer than that single hop needs.
    oauthVerifierTtlMs: Number(env.OAUTH_VERIFIER_TTL_MS || 10 * 60 * 1000)
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
  if (!Number.isFinite(config.recoveryVerifierTtlMs) || config.recoveryVerifierTtlMs <= 0 || !Number.isFinite(config.signupVerifierTtlMs) || config.signupVerifierTtlMs <= 0 || !Number.isFinite(config.oauthVerifierTtlMs) || config.oauthVerifierTtlMs <= 0) {
    issues.push('PKCE verifier TTLs (PASSWORD_RECOVERY_VERIFIER_TTL_MS, SIGNUP_VERIFIER_TTL_MS, OAUTH_VERIFIER_TTL_MS) must be positive');
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
  try {
    const recoveryRedirect = new URL(config.passwordRecoveryRedirectTo);
    if (recoveryRedirect.username || recoveryRedirect.password || !config.allowedOrigins.includes(recoveryRedirect.origin) || recoveryRedirect.searchParams.get('type') !== 'recovery') issues.push('PASSWORD_RECOVERY_REDIRECT_TO must be credential-free, use an allowlisted origin and include type=recovery');
  } catch { issues.push('PASSWORD_RECOVERY_REDIRECT_TO must be a valid URL'); }
  try {
    const oauthRedirect = new URL(config.oauthGoogleRedirectTo);
    if (oauthRedirect.username || oauthRedirect.password || !config.allowedOrigins.includes(oauthRedirect.origin) || oauthRedirect.searchParams.get('auth') !== 'oauth-google') issues.push('OAUTH_GOOGLE_REDIRECT_TO must be credential-free, use an allowlisted origin and include auth=oauth-google');
  } catch { issues.push('OAUTH_GOOGLE_REDIRECT_TO must be a valid URL'); }
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

function sendError(res, status, code, message, requestId, fieldErrors, headers) {
  return json(res, status, errorBody(code, message, requestId, fieldErrors), headers);
}

function sendRateLimited(res, requestId, message = 'Too many attempts. Please try again later.') {
  return sendError(res, 429, 'rate_limited', message, requestId, undefined, { 'Retry-After': '60' });
}

// P0 auth reliability audit (2026-11): the login handler used to collapse
// every failure from Supabase Auth — wrong password, an unconfirmed email,
// a provider-side rate limit, a transient outage — into the same 401
// "authentication_failed", and the client showed "E-mail ou mot de passe
// incorrect." for all of them. A real user who had just set a password that
// worked was told it was wrong when the actual cause was an unconfirmed
// email or a momentary Supabase hiccup. This never trusts the client with
// more than it needs (no stack traces, no provider payloads) but it does
// tell the four causes apart so the UI can say something true.
function classifyLoginError(error) {
  const code = String(error?.code || '').toLowerCase();
  const message = String(error?.message || '').toLowerCase();
  const status = Number(error?.status) || 0;
  if (code === 'email_not_confirmed' || message.includes('email not confirmed') || message.includes('confirm')) {
    return { status: 403, code: 'email_not_confirmed', message: 'Confirm your email before signing in.' };
  }
  if (status === 429 || code === 'over_request_rate_limit' || code === 'too_many_requests' || message.includes('rate limit')) {
    return { status: 429, code: 'rate_limited', message: 'Too many attempts. Please try again later.' };
  }
  if (status === 400 || status === 401 || code === 'invalid_credentials' || code === 'invalid_grant') {
    return { status: 401, code: 'invalid_credentials', message: 'Invalid email or password.' };
  }
  // No HTTP status at all (network/DNS failure) or a 5xx from the provider:
  // this is not the caller's fault and must never be reported as a wrong
  // password.
  return { status: 503, code: 'server_error', message: 'Authentication is temporarily unavailable. Please try again shortly.' };
}

// Signup reliability audit (P0, 2026-11): the register handler used to let
// ANY failure from Supabase Auth — a password that fails the project's
// strength policy, a provider outage, an email the provider refuses, or an
// account that already exists — fall through to the generic 500 handler at
// the bottom of this module, which told the learner "Request could not be
// processed" for every one of these, indistinguishable from a real bug on
// our side. Two things never happen here: a genuinely actionable problem
// (weak password, provider outage) is never reported as a fabricated
// internal_error, and a duplicate-account attempt is never told apart from
// a first-time signup — "swallow" tells the caller to send back the exact
// same ambiguous 202 success body the happy path already uses, preserving
// anti-enumeration even when the provider itself errors instead of faking
// success.
function classifyRegisterError(error) {
  const code = String(error?.code || '').toLowerCase();
  const message = String(error?.message || '').toLowerCase();
  const status = Number(error?.status) || 0;
  if (['user_already_exists', 'email_exists', 'email_address_already_registered'].includes(code) || message.includes('already registered') || message.includes('already exists')) {
    return { swallow: true, code: 'email_exists' };
  }
  if (code === 'weak_password' || message.includes('weak password')) {
    // GoTrue's own weak_password text never contains the password itself or
    // any account state, so it is safe to carry in field_errors for an API
    // caller or a log — the dist/app.js client deliberately shows its own
    // French message instead of this raw (English, version-specific) text.
    return { status: 400, code: 'weak_password', message: 'Password does not meet the required strength.', fieldErrors: { password: error.message || 'Password is too weak.' } };
  }
  if (code === 'email_address_invalid' || (status === 400 && message.includes('email'))) {
    return { status: 400, code: 'validation_error', message: 'Request could not be processed.', fieldErrors: { email: 'Enter a valid email address.' } };
  }
  if (code === 'signup_disabled') {
    return { status: 503, code: 'registrations_unavailable', message: 'New registrations are temporarily unavailable. Please try again later.' };
  }
  if (status === 429 || code === 'over_email_send_rate_limit' || code === 'too_many_requests' || message.includes('rate limit')) {
    return { status: 429, code: 'rate_limited', message: 'Too many attempts. Please try again later.' };
  }
  // No HTTP status at all (network/DNS failure) or an unrecognized provider
  // error: this is not the caller's fault and must never be reported as an
  // internal_error on our side, which would send whoever reads the logs
  // chasing a bug in our own code instead of the provider.
  return { status: 503, code: 'server_error', message: 'Registration is temporarily unavailable. Please try again shortly.' };
}

// Google OAuth exchange reliability: GoTrue never tells a merely-invalid
// code apart from an already-used one (both come back as the same
// `invalid_grant`/`flow_state_not_found`-style error) — exactly the same
// ambiguity the recovery/signup PKCE exchanges already accept and report
// honestly as a single "this link is invalid or expired" message, rather
// than inventing a distinction the provider itself does not make. Two
// causes ARE worth telling apart here, because the honest message differs
// materially from "the code is dead": a transient provider/network failure
// (never the caller's fault) and a Google account whose e-mail GoTrue could
// not treat as verified (rare, but the founder explicitly asked this be
// handled rather than mis-reported as a dead link).
function classifyOAuthExchangeError(error) {
  const code = String(error?.code || '').toLowerCase();
  const message = String(error?.message || '').toLowerCase();
  const status = Number(error?.status) || 0;
  if (message.includes('email') && (message.includes('verif') || message.includes('confirm'))) {
    return { status: 403, code: 'oauth_email_unverified', message: 'Your Google account has no verified e-mail address on file. Verify it with Google, or continue with e-mail and password instead.' };
  }
  if (status === 429 || code === 'over_request_rate_limit' || code === 'too_many_requests' || message.includes('rate limit')) {
    return { status: 429, code: 'rate_limited', message: 'Too many attempts. Please try again later.' };
  }
  if (status === 0 || status >= 500) {
    return { status: 503, code: 'server_error', message: 'Google sign-in is temporarily unavailable. Please try again shortly.' };
  }
  return { status: 400, code: 'invalid_code', message: 'This Google sign-in link is invalid or has expired.' };
}

function clientIp(req) {
  return String(req.socket?.remoteAddress || '');
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

// PKCE verifier cookie: httpOnly (client JS can never read it, so it can
// never be exfiltrated by injected/third-party script), Secure + SameSite
// SameSite=None (same cross-origin requirement as the session cookie,
// cookieHeaders() above — the BFF and the static site are different
// origins) and short-lived. Encrypted with the exact same AES-256-GCM
// primitive already used for provider tokens on the session row (security.js)
// rather than a new mechanism — this is "a secret this server must be able
// to read back later", precisely what that primitive is for.
function appendSetCookie(res, value) {
  const existing = res.getHeader('Set-Cookie');
  if (!existing) return res.setHeader('Set-Cookie', [value]);
  res.setHeader('Set-Cookie', Array.isArray(existing) ? [...existing, value] : [existing, value]);
}

function setVerifierCookie(res, config, name, codeVerifier, ttlMs) {
  if (!config.sessionEncryptionKey || !codeVerifier) return;
  const encrypted = encrypt(codeVerifier, config.sessionEncryptionKey);
  appendSetCookie(res, serializeCookie(name, encrypted, { secure: config.secureCookies, sameSite: 'None', path: '/', httpOnly: true, maxAge: Math.floor(ttlMs / 1000) }));
}

function readVerifierCookie(cookies, config, name) {
  if (!config.sessionEncryptionKey || !cookies[name]) return null;
  try { return decrypt(cookies[name], config.sessionEncryptionKey); }
  catch { return null; }
}

function clearVerifierCookie(res, config, name) {
  appendSetCookie(res, serializeCookie(name, '', { secure: config.secureCookies, sameSite: 'None', path: '/', httpOnly: true, maxAge: 0 }));
}

// Generates a fresh PKCE pair when (and only when) this server is able to
// hold onto the verifier (SESSION_ENCRYPTION_KEY configured) — without a
// key to encrypt it into the cookie above, sending a code_challenge with no
// way to ever retrieve the matching verifier would make the resulting link
// permanently unexchangeable, which is worse than falling back to the
// legacy (unchallenged) flow. Real production always has the key
// (validateRuntimeConfig enforces it); this guard only matters for minimal
// test configs that intentionally omit it to exercise unrelated behavior.
function newPkcePair(config) {
  if (!config.sessionEncryptionKey) return { codeVerifier: null, codeChallenge: null };
  const codeVerifier = generateCodeVerifier();
  return { codeVerifier, codeChallenge: computeCodeChallenge(codeVerifier) };
}

function validateOrigin(req, config) {
  const origin = req.headers.origin;
  if (!origin) return false;
  return config.allowedOrigins.includes(origin);
}

function validateCsrf(req, config, cookies) {
  return Boolean(cookies[CSRF_COOKIE] && req.headers['x-csrf-token'] && timingSafeEqualText(cookies[CSRF_COOKIE], req.headers['x-csrf-token']) && validateOrigin(req, config));
}

const PARTNER_REF = /^[a-z0-9_-]{2,40}$/;

function validateRegistration(body) {
  const email = normalizeEmail(body.email);
  const fields = {};
  if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 254) fields.email = 'Enter a valid email address.';
  if (typeof body.password !== 'string' || body.password.length < 12 || body.password.length > 128) fields.password = 'Password must be between 12 and 128 characters.';
  if (body.display_name !== undefined && (typeof body.display_name !== 'string' || body.display_name.length > 60)) fields.display_name = 'Display name is too long.';
  // Partner attribution ("ref") never blocks account creation — an invalid
  // or missing value is just treated as no referral, not a validation error.
  const ref = typeof body.ref === 'string' && PARTNER_REF.test(body.ref.toLowerCase()) ? body.ref.toLowerCase() : null;
  return { email, ref, fields };
}

const LESSON_ID = /^[A-Z0-9][A-Z0-9.]{0,38}[A-Z0-9]$/i;

function validateLessonProgress(body) {
  if (typeof body.lessonId !== 'string' || !LESSON_ID.test(body.lessonId)) return { error: 'lessonId is required and must be a short lesson identifier.' };
  return {
    lessonId: body.lessonId,
    lessonViewed: Boolean(body.lessonViewed),
    exerciseComplete: Boolean(body.exerciseComplete),
    quizComplete: Boolean(body.quizComplete)
  };
}

function validateOnboardingProgress(body) {
  if (body.level !== undefined && (typeof body.level !== 'string' || body.level.length > 40)) return { error: 'level is invalid.' };
  if (body.goal !== undefined && (typeof body.goal !== 'string' || body.goal.length > 80)) return { error: 'goal is invalid.' };
  if (body.time !== undefined && (typeof body.time !== 'string' || body.time.length > 80)) return { error: 'time is invalid.' };
  return { level: body.level || '', goal: body.goal || '', time: body.time || '', complete: Boolean(body.complete) };
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

function createBff({ config = configFromEnv(), auth, sessions, entitlements = null, billingStore = null, businessStore, brvmPublicationStore = null, mutationStore = null, adminRoles = null, accessAudit = null, rateLimiter = null, progressStore = null, aiAssistant = null, chariowConfig = chariowConfigFromEnv(), clock = () => new Date(), logger = () => {} }) {
  if (!auth || !sessions) throw new Error('auth and sessions adapters are required');
  businessStore = businessStore || {
    exportUserData: async () => ({ lesson_progress: [], journal_entries: [], journal_plans: [], preferences: [] }),
    deleteUserData: async () => {}
  };
  async function recordAccessAudit(input) {
    if (!accessAudit || typeof accessAudit.record !== 'function') return;
    try { await accessAudit.record(input); }
    catch { logger('access_audit_write_failed', { requestId: input.requestId, eventName: input.eventName }); }
  }

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
    try {
      const user = await auth.getUser(state.session.user_id);
      if (!user || user.status !== 'active') {
        try { await sessions.revoke(state.session.session_id, clock()); }
        catch (error) { logger('inactive_session_revoke_failed', { requestId, status: error.status || 500 }); }
        setCookies(res, cookieHeaders(config, '', '', true));
        sendError(res, 401, 'unauthenticated', 'Authentication required.', requestId);
        return null;
      }
      return { ...state, user };
    }
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
    if (!CONTROL_PLANE_ROLES.includes(role)) {
      await recordAccessAudit({ actorUserId: current.user.user_id, eventName: 'admin_access_denied', resourceType: 'admin_route', requestId, metadata: { route: new URL(req.url, 'http://bff.local').pathname, method: req.method || 'GET', role: role || 'none' } });
      sendError(res, 403, 'admin_role_required', 'An owner or admin role is required.', requestId);
      return null;
    }
    await recordAccessAudit({ actorUserId: current.user.user_id, eventName: 'admin_access_granted', resourceType: 'admin_route', requestId, metadata: { route: new URL(req.url, 'http://bff.local').pathname, method: req.method || 'GET', role } });
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
      // Google OAuth — start (founder directive, 2026-11): a full-page GET,
      // never a fetch, because this route's whole job is to hand the
      // browser off to Supabase/Google and back — exactly the kind of
      // navigation flow this app otherwise avoids by design (no popups,
      // mirroring the rest of the site). It always ends in a redirect, even
      // on failure: the browser got here by `location.href`-style navigation
      // (see dist/app.js), so answering with a bare JSON error would leave
      // the learner staring at raw API output with no way back into the
      // product. `bounceBack` sends them back to the SAME place a
      // successful flow would land (oauthGoogleRedirectTo), with an
      // `error`/`error_description` pair dist/app.js already knows how to
      // read and turn into an honest, specific message.
      if (method === 'GET' && path === '/v1/auth/oauth/google/start') {
        const bounceBack = (errorCode, description) => {
          const target = new URL(config.oauthGoogleRedirectTo);
          target.searchParams.set('error', errorCode);
          if (description) target.searchParams.set('error_description', description);
          res.writeHead(302, { Location: target.toString() });
          return res.end();
        };
        if (typeof auth.getProviderSettings !== 'function' || typeof auth.buildAuthorizeUrl !== 'function') {
          return bounceBack('oauth_not_configured', 'Google sign-in is not available yet.');
        }
        if (!await checkAuthRateLimit(rateLimiter, 'oauth-google-start', { ip: clientIp(req) })) {
          return bounceBack('rate_limited', 'Too many attempts. Please try again later.');
        }
        let settings;
        try { settings = await auth.getProviderSettings(); }
        catch (error) {
          logger('oauth_settings_check_failed', { requestId, status: error.status || 500 });
          return bounceBack('server_error', 'Google sign-in is temporarily unavailable.');
        }
        // Honest, specific reason (P0 of the founder's own directive): the
        // founder may still be finishing the Google Cloud / Supabase
        // dashboard setup when a learner clicks this button. Checked via
        // GoTrue's own public /auth/v1/settings — see supabase-auth.js — so
        // this is never guessed from this server's own configuration, which
        // only knows the Supabase project URL, not what is enabled inside it.
        if (!settings?.external?.google) {
          logger('oauth_provider_disabled', { requestId, provider: 'google' });
          return bounceBack('oauth_provider_not_configured', 'Google sign-in has not been enabled yet on this project.');
        }
        const { codeVerifier, codeChallenge } = newPkcePair(config);
        if (!codeVerifier) return bounceBack('oauth_not_configured', 'Google sign-in requires SESSION_ENCRYPTION_KEY to be configured.');
        const authorizeUrl = auth.buildAuthorizeUrl({ provider: 'google', redirectTo: config.oauthGoogleRedirectTo, codeChallenge });
        setVerifierCookie(res, config, OAUTH_VERIFIER_COOKIE, codeVerifier, config.oauthVerifierTtlMs);
        res.writeHead(302, { Location: authorizeUrl });
        return res.end();
      }
      // Google OAuth — exchange (founder directive, 2026-11): back on our
      // own origin (academy.html), so this one IS an ordinary
      // credentials:'include' fetch, exactly like
      // /v1/auth/password-reset/exchange above — same PKCE verifier-cookie
      // requirement, same session creation, same cookie shape as every other
      // sign-in path in this file.
      if (method === 'POST' && path === '/v1/auth/oauth/google/exchange') {
        if (typeof auth.exchangeOAuthCode !== 'function') return sendError(res, 503, 'oauth_not_configured', 'Google sign-in is not available yet.', requestId);
        const body = await readJson(req);
        if (typeof body.code !== 'string' || body.code.length < 10) return sendError(res, 400, 'invalid_code', 'This Google sign-in link is invalid or has expired.', requestId);
        if (!await checkAuthRateLimit(rateLimiter, 'oauth-google-exchange', { ip: clientIp(req) })) return sendRateLimited(res, requestId);
        const cookies = parseCookies(req.headers.cookie || '');
        const codeVerifier = readVerifierCookie(cookies, config, OAUTH_VERIFIER_COOKIE);
        if (!codeVerifier) return sendError(res, 400, 'oauth_verifier_expired', 'This Google sign-in must finish in the same browser tab that started it, and the request must not have expired. Please try "Continue with Google" again.', requestId);
        let provider;
        try { provider = await auth.exchangeOAuthCode(body.code, codeVerifier); }
        catch (error) {
          logger('oauth_google_exchange_failed', { requestId, status: error.status || 400, code: error.code || null });
          const outcome = classifyOAuthExchangeError(error);
          return sendError(res, outcome.status, outcome.code, outcome.message, requestId);
        }
        if (!provider?.user?.id || !provider.access_token) return sendError(res, 400, 'invalid_code', 'This Google sign-in link is invalid or has expired.', requestId);
        // Identity linking is GoTrue's own documented behavior, not something
        // this server decides: if the Google account's (verified) e-mail
        // matches an existing e-mail/password account, GoTrue automatically
        // links the new Google identity to that SAME user and returns that
        // user's id here — this just creates a session for whichever user_id
        // GoTrue reports, exactly like every other sign-in path in this file.
        // https://supabase.com/docs/guides/auth/auth-identity-linking
        const created = await createSession(provider.user.id, provider, req);
        setCookies(res, cookieHeaders(config, created.token, created.csrf));
        clearVerifierCookie(res, config, OAUTH_VERIFIER_COOKIE);
        return json(res, 204);
      }
      if (method === 'POST' && path === '/v1/auth/register') {
        const body = await readJson(req);
        const validation = validateRegistration(body);
        if (Object.keys(validation.fields).length) return sendError(res, 400, 'validation_error', 'Request could not be processed.', requestId, validation.fields);
        if (!await checkAuthRateLimit(rateLimiter, 'register', { ip: clientIp(req), email: validation.email })) return sendRateLimited(res, requestId);
        // PKCE (P0 auth reliability audit, 2026-11): a fresh verifier per
        // signup attempt, bound to THIS browser via an httpOnly cookie — see
        // pkce.js. Generated unconditionally (success or failure path below)
        // so its mere presence never hints at whether the account already
        // existed, preserving the anti-enumeration guarantee the swallow
        // path already relies on.
        const { codeVerifier, codeChallenge } = newPkcePair(config);
        try {
          await auth.register({ email: validation.email, password: body.password, display_name: body.display_name, ref: validation.ref, redirectTo: config.emailRedirectTo, codeChallenge });
        } catch (error) {
          const outcome = classifyRegisterError(error);
          // Never log the password or the raw provider error body — only the
          // status/code classification, which is enough to diagnose a
          // production incident without exposing credentials.
          logger('register_failed', { requestId, status: outcome.status, code: outcome.code });
          if (!outcome.swallow) return sendError(res, outcome.status, outcome.code, outcome.message, requestId, outcome.fieldErrors);
        }
        setVerifierCookie(res, config, SIGNUP_VERIFIER_COOKIE, codeVerifier, config.signupVerifierTtlMs);
        return json(res, 202, { message: 'If the registration can be completed, a verification message will be sent.' });
      }
      if (method === 'POST' && path === '/v1/auth/verify-email') {
        const body = await readJson(req);
        // New, PKCE-protected confirmation links carry `code` (see register()
        // above and pkce.js): the e-mail link alone can never confirm the
        // account — a security scanner's sandboxed browser that pre-visits it
        // has no way to reach the code_verifier, which exists only in this
        // browser's own httpOnly cookie, set when THIS browser submitted the
        // signup form. `token` remains for any confirmation links already
        // sent before this deploy.
        const usesCode = typeof body.code === 'string';
        if (usesCode) { if (body.code.length < 10) return sendError(res, 400, 'invalid_code', 'The confirmation code is invalid or expired.', requestId); }
        else if (typeof body.token !== 'string' || body.token.length < 32) return sendError(res, 400, 'invalid_token', 'The token is invalid or expired.', requestId);
        if (!await checkAuthRateLimit(rateLimiter, 'verify-email', { ip: clientIp(req) })) return sendRateLimited(res, requestId);
        if (usesCode) {
          const cookies = parseCookies(req.headers.cookie || '');
          const codeVerifier = readVerifierCookie(cookies, config, SIGNUP_VERIFIER_COOKIE);
          if (!codeVerifier) return sendError(res, 400, 'signup_verifier_expired', 'This confirmation link must be opened in the same browser used to sign up, and the request must not have expired. Please sign up again or request a new confirmation e-mail.', requestId);
          try { await auth.exchangeSignupCode(body.code, codeVerifier); }
          catch (error) { logger('verify_email_exchange_failed', { requestId, status: error.status || 400 }); return sendError(res, 400, 'invalid_code', 'This confirmation link is invalid or expired.', requestId); }
          clearVerifierCookie(res, config, SIGNUP_VERIFIER_COOKIE);
          return json(res, 204);
        }
        await auth.verifyEmail(body.token);
        return json(res, 204);
      }
      if (method === 'POST' && path === '/v1/auth/password-reset/exchange') {
        const body = await readJson(req);
        if (typeof body.code !== 'string' || body.code.length < 10) return sendError(res, 400, 'invalid_code', 'The recovery code is invalid or expired.', requestId);
        if (!await checkAuthRateLimit(rateLimiter, 'password-reset-exchange', { ip: clientIp(req) })) return sendRateLimited(res, requestId, 'Too many attempts. Please request a new link later.');
        // PKCE exchange — the heart of this fix (P0 auth reliability audit,
        // 2026-11): without a code_verifier that matches what was sent to
        // /auth/v1/recover, this call is refused BEFORE ever reaching
        // GoTrue, so a scanner that merely loaded the redirect page (and so
        // never has this browser's httpOnly cookie) can never burn the
        // underlying one-time code — it is left intact for the real learner.
        const cookies = parseCookies(req.headers.cookie || '');
        const codeVerifier = readVerifierCookie(cookies, config, RECOVERY_VERIFIER_COOKIE);
        if (!codeVerifier) return sendError(res, 400, 'recovery_verifier_expired', 'This recovery link must be opened in the same browser used to request it, and the request must not have expired. Please request a new recovery link.', requestId);
        let provider;
        try { provider = await auth.exchangeRecoveryCode(body.code, codeVerifier); } catch (error) { logger('password_reset_exchange_failed', { requestId, status: error.status || 400 }); return sendError(res, 400, 'invalid_code', 'The recovery link is invalid or expired.', requestId); }
        if (!provider?.user?.id || !provider.access_token) return sendError(res, 400, 'invalid_code', 'The recovery link is invalid or expired.', requestId);
        const created = await createSession(provider.user.id, provider, req);
        setCookies(res, cookieHeaders(config, created.token, created.csrf));
        clearVerifierCookie(res, config, RECOVERY_VERIFIER_COOKIE);
        return json(res, 204);
      }
      if (method === 'POST' && path === '/v1/auth/password-reset/verify') {
        const body = await readJson(req);
        if (typeof body.token !== 'string' || body.token.length < 20) return sendError(res, 400, 'invalid_token', 'The recovery link is invalid or expired.', requestId);
        if (!await checkAuthRateLimit(rateLimiter, 'password-reset-verify', { ip: clientIp(req) })) return sendRateLimited(res, requestId, 'Too many attempts. Please request a new link later.');
        let provider;
        try { provider = await auth.verifyRecoveryToken(body.token); }
        catch (error) { logger('password_reset_verify_failed', { requestId, status: error.status || 400 }); return sendError(res, 400, 'invalid_token', 'The recovery link is invalid or expired.', requestId); }
        if (!provider?.user?.id || !provider.access_token) return sendError(res, 400, 'invalid_token', 'The recovery link is invalid or expired.', requestId);
        const created = await createSession(provider.user.id, provider, req);
        setCookies(res, cookieHeaders(config, created.token, created.csrf));
        return json(res, 204);
      }
      if (method === 'POST' && path === '/v1/auth/login') {
        const body = await readJson(req);
        const validation = validateRegistration({ email: body.email, password: body.password });
        if (Object.keys(validation.fields).length) return sendError(res, 400, 'validation_error', 'Request could not be processed.', requestId);
        if (!await checkAuthRateLimit(rateLimiter, 'login', { ip: clientIp(req), email: validation.email })) return sendRateLimited(res, requestId);
        let provider;
        try { provider = await auth.login({ email: validation.email, password: body.password }); }
        catch (error) {
          const outcome = classifyLoginError(error);
          // Never log the password or the raw provider error body — only
          // the status/code classification, which is enough to diagnose a
          // production incident without exposing credentials.
          logger('login_failed', { requestId, status: outcome.status, code: outcome.code });
          return sendError(res, outcome.status, outcome.code, outcome.message, requestId);
        }
        if (!provider?.user?.id || !provider.access_token) return sendError(res, 401, 'invalid_credentials', 'Invalid email or password.', requestId);
        const created = await createSession(provider.user.id, provider, req);
        setCookies(res, cookieHeaders(config, created.token, created.csrf));
        return json(res, 204);
      }
      if (method === 'POST' && path === '/v1/auth/password-reset/request') {
        const body = await readJson(req);
        const email = normalizeEmail(body.email);
        if (!/^\S+@\S+\.\S+$/.test(email)) return sendError(res, 400, 'validation_error', 'Request could not be processed.', requestId);
        if (!await checkAuthRateLimit(rateLimiter, 'password-reset-request', { ip: clientIp(req), email })) return sendRateLimited(res, requestId);
        // PKCE (P0 auth reliability audit, 2026-11): a fresh verifier per
        // recovery attempt, bound to THIS browser via an httpOnly cookie —
        // generated and stored unconditionally (whether or not the account
        // exists), so its presence never leaks account existence on top of
        // the always-202 response this route already gives.
        const { codeVerifier, codeChallenge } = newPkcePair(config);
        try { await auth.requestPasswordReset(email, config.passwordRecoveryRedirectTo || config.emailRedirectTo, codeChallenge); } catch (error) { logger('recovery_failed', { requestId, status: error.status || 500 }); }
        setVerifierCookie(res, config, RECOVERY_VERIFIER_COOKIE, codeVerifier, config.recoveryVerifierTtlMs);
        return json(res, 202, { message: 'If the account can be recovered, a message will be sent.' });
      }
      if (method === 'POST' && path === '/v1/auth/password-reset/confirm') {
        const body = await readJson(req);
        if (typeof body.password !== 'string' || body.password.length < 12) return sendError(res, 400, 'validation_error', 'Request could not be processed.', requestId, { password: 'too_short' });
        if (!await checkAuthRateLimit(rateLimiter, 'password-reset-confirm', { ip: clientIp(req) })) return sendRateLimited(res, requestId);
        const current = await withUser(req, res, requestId); if (!current) return;
        if (!config.sessionEncryptionKey || !current.session.provider_access_token_enc) return sendError(res, 401, 'recovery_session_expired', 'The recovery session has expired. Request a new link.', requestId);
        try { await auth.confirmPasswordReset(decrypt(current.session.provider_access_token_enc, config.sessionEncryptionKey), body.password); }
        catch (error) { logger('password_reset_confirm_failed', { requestId, status: error.status || 400 }); return sendError(res, 400, 'password_update_failed', 'The password could not be updated. Request a new recovery link.', requestId); }
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
      // Commercial activation mandate (2026-11-14): the one route that turns
      // "présenter Premium" into "payer réellement" — creates a real Chariow
      // Checkout session server-side and hands the frontend a real
      // checkout_url to redirect to. Never a simulated transaction: if
      // Chariow isn't configured (no API key or no allowlisted product —
      // both true in production today), this honestly fails closed with
      // 503, never a fake success. dda_user_id in custom_metadata comes
      // ONLY from the authenticated session, never from the request body —
      // that metadata field is exactly what the Pulse webhook later trusts
      // to grant premium_track, so a client-supplied value here would be a
      // privilege-escalation path straight into mapChariowPulse().
      if (method === 'POST' && path === '/v1/billing/checkout') {
        const current = await withUser(req, res, requestId); if (!current) return;
        if (!validateCsrf(req, config, current.cookies)) return sendError(res, 403, 'csrf_failed', 'CSRF validation failed.', requestId);
        if (!chariowConfig.apiKey || !chariowConfig.premiumProductIds.length) {
          return sendError(res, 503, 'billing_not_configured', 'Premium checkout is not available yet.', requestId);
        }
        if (rateLimiter && !await rateLimiter.allow(`billing_checkout:user:${current.user.user_id}`, { windowSeconds: 3600, limit: 5 })) {
          return sendError(res, 429, 'rate_limited', 'Too many checkout attempts. Please try again later.', requestId);
        }
        const [firstName, ...lastNameParts] = String(current.user.display_name || '').trim().split(/\s+/);
        try {
          const checkout = await createChariowCheckout({
            config: chariowConfig,
            input: {
              productId: chariowConfig.premiumProductIds[0],
              email: current.user.email,
              firstName: firstName || 'Apprenant',
              lastName: lastNameParts.join(' ') || 'DDA',
              customMetadata: { dda_user_id: current.user.user_id }
            }
          });
          if (!checkout.checkoutUrl) return sendError(res, 502, 'checkout_unavailable', 'The payment provider did not return a checkout link.', requestId);
          return json(res, 200, { checkout_url: checkout.checkoutUrl });
        } catch (error) {
          logger('chariow_checkout_failed', { requestId, status: error.status || 500 });
          return sendError(res, 502, 'checkout_unavailable', 'The payment provider could not be reached. Please try again later.', requestId);
        }
      }
      // Real Premium lesson/lab content (mandate §6 audit, Lot 2): the only
      // place the text, exercises and quiz answers of P2.2/LAB4/LABCAP live
      // now — see bff/src/premium-content.js's header comment for why this
      // route exists. Guarded by the exact same hasActivePremium() check as
      // /v1/premium/preview above; P2.1 is the Premium Track's free preview
      // (mandate §5) and is served to any authenticated learner, Premium or
      // not, exactly like the client already treats it as a Free-readable
      // lesson despite its premium_track permission.
      if (method === 'GET' && path.startsWith('/v1/premium/content/')) {
        const lessonId = path.slice('/v1/premium/content/'.length);
        if (!LESSON_ID.test(lessonId) || !Object.prototype.hasOwnProperty.call(PREMIUM_CONTENT, lessonId)) {
          return sendError(res, 404, 'not_found', 'Unknown lesson id.', requestId);
        }
        const current = await withUser(req, res, requestId); if (!current) return;
        if (!FREE_PREVIEW_IDS.has(lessonId)) {
          const snapshot = await currentEntitlements(current.user.user_id);
          if (!hasActivePremium(snapshot, clock())) return sendError(res, 403, 'premium_required', 'An active Premium entitlement is required.', requestId);
        }
        return json(res, 200, { lesson: PREMIUM_CONTENT[lessonId] });
      }
      if (method === 'POST' && path === '/v1/ai/ask') {
        const current = await withUser(req, res, requestId); if (!current) return;
        if (!validateCsrf(req, config, current.cookies)) return sendError(res, 403, 'csrf_failed', 'CSRF validation failed.', requestId);
        if (!aiAssistant) return sendError(res, 503, 'ai_not_configured', 'DDA AI is not available yet.', requestId);
        if (rateLimiter && !await rateLimiter.allow(`ai_ask:user:${current.user.user_id}`, { windowSeconds: 3600, limit: 20 })) {
          return sendError(res, 429, 'rate_limited', 'Too many questions in a short time. Please try again later.', requestId);
        }
        const validation = validateAskRequest(await readJson(req));
        if (validation.error) return sendError(res, 400, 'validation_error', validation.error, requestId);
        try {
          const result = await aiAssistant.ask(validation.message, { history: validation.history });
          return json(res, 200, { reply: result.reply });
        } catch (error) {
          logger('ai_ask_failed', { requestId, error: error.message });
          return sendError(res, 502, 'ai_provider_failed', 'DDA AI could not answer right now. Please try again shortly.', requestId);
        }
      }
      if (method === 'GET' && path === '/v1/progress') {
        const current = await withUser(req, res, requestId); if (!current) return;
        if (!progressStore) return sendError(res, 503, 'progress_not_configured', 'Progress sync is not available.', requestId);
        const [lessons, onboarding] = await Promise.all([
          progressStore.listLessons(current.user.user_id),
          progressStore.getOnboarding(current.user.user_id)
        ]);
        return json(res, 200, {
          lessons: Object.fromEntries(lessons.map(row => [row.lesson_id, { lessonViewed: row.lesson_viewed, exerciseComplete: row.exercise_complete, quizComplete: row.quiz_complete }])),
          onboarding: onboarding ? { level: onboarding.level, goal: onboarding.goal, time: onboarding.time, complete: onboarding.complete } : null
        });
      }
      if (method === 'PUT' && path === '/v1/progress/lesson') {
        const current = await withUser(req, res, requestId); if (!current) return;
        if (!validateCsrf(req, config, current.cookies)) return sendError(res, 403, 'csrf_failed', 'CSRF validation failed.', requestId);
        if (!progressStore) return sendError(res, 503, 'progress_not_configured', 'Progress sync is not available.', requestId);
        const validation = validateLessonProgress(await readJson(req));
        if (validation.error) return sendError(res, 400, 'validation_error', validation.error, requestId);
        const row = await progressStore.upsertLesson(current.user.user_id, validation);
        return json(res, 200, { lessonId: row.lesson_id, lessonViewed: row.lesson_viewed, exerciseComplete: row.exercise_complete, quizComplete: row.quiz_complete });
      }
      if (method === 'PUT' && path === '/v1/progress/onboarding') {
        const current = await withUser(req, res, requestId); if (!current) return;
        if (!validateCsrf(req, config, current.cookies)) return sendError(res, 403, 'csrf_failed', 'CSRF validation failed.', requestId);
        if (!progressStore) return sendError(res, 503, 'progress_not_configured', 'Progress sync is not available.', requestId);
        const validation = validateOnboardingProgress(await readJson(req));
        if (validation.error) return sendError(res, 400, 'validation_error', validation.error, requestId);
        const row = await progressStore.upsertOnboarding(current.user.user_id, validation);
        return json(res, 200, { level: row.level, goal: row.goal, time: row.time, complete: row.complete });
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
      // Role assignment/revocation — the invariants (only an owner may grant
      // or revoke, self-elevation impossible, last owner protected) live in
      // adminRoles itself (admin-roles-store.js) and are already tested
      // there; this route only translates its errors to HTTP status codes.
      if (method === 'POST' && path === '/v1/admin/roles') {
        const admin = await withAdmin(req, res, requestId); if (!admin) return;
        if (!validateCsrf(req, config, admin.cookies)) return sendError(res, 403, 'csrf_failed', 'CSRF validation failed.', requestId);
        if (!adminRoles || typeof adminRoles.assignRole !== 'function') return sendError(res, 503, 'admin_not_configured', 'Role assignment is not available.', requestId);
        const body = await readJson(req);
        const targetUserId = typeof body.user_id === 'string' ? body.user_id.trim() : '';
        if (!targetUserId) return sendError(res, 400, 'validation_error', 'user_id is required.', requestId, { user_id: 'Required.' });
        if (!VALID_ADMIN_ROLES.includes(body.role)) return sendError(res, 400, 'validation_error', 'role is not supported.', requestId, { role: 'Unsupported role.' });
        try {
          const result = await adminRoles.assignRole(targetUserId, body.role, admin.user.user_id);
          await recordAccessAudit({ actorUserId: admin.user.user_id, eventName: 'role_assigned', resourceType: 'admin_role', resourceId: targetUserId, requestId, metadata: { route: path, method, role: admin.role, target_user_id: targetUserId, granted_role: body.role } });
          return json(res, 200, { contract: 'dda-admin-roles-v1', ...result });
        } catch (error) {
          if (error.code === 'owner_required') return sendError(res, 403, 'owner_required', error.message, requestId);
          if (error.code === 'invalid_role') return sendError(res, 400, 'validation_error', error.message, requestId, { role: error.message });
          throw error;
        }
      }
      const revokeRoleMatch = path.match(/^\/v1\/admin\/roles\/([^/]+)$/);
      if (method === 'DELETE' && revokeRoleMatch) {
        const admin = await withAdmin(req, res, requestId); if (!admin) return;
        if (!validateCsrf(req, config, admin.cookies)) return sendError(res, 403, 'csrf_failed', 'CSRF validation failed.', requestId);
        if (!adminRoles || typeof adminRoles.revokeRole !== 'function') return sendError(res, 503, 'admin_not_configured', 'Role revocation is not available.', requestId);
        const targetUserId = decodeURIComponent(revokeRoleMatch[1]);
        try {
          await adminRoles.revokeRole(targetUserId, admin.user.user_id);
          await recordAccessAudit({ actorUserId: admin.user.user_id, eventName: 'role_revoked', resourceType: 'admin_role', resourceId: targetUserId, requestId, metadata: { route: path, method, role: admin.role, target_user_id: targetUserId } });
          return json(res, 204);
        } catch (error) {
          if (error.code === 'owner_required') return sendError(res, 403, 'owner_required', error.message, requestId);
          if (error.code === 'last_owner_protected') return sendError(res, 409, 'last_owner_protected', error.message, requestId);
          throw error;
        }
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
