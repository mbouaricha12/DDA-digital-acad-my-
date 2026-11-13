'use strict';
/*
 * Google OAuth sign-in — real BFF + real browser E2E (founder directive, 2026-11).
 *
 * This boots the REAL BFF (bff/src/app.js's createBff — exactly what Vercel
 * runs) behind a real HTTPS listener, the REAL static dist/ build behind
 * another real listener, and drives the REAL academy.html + app.js +
 * bff-client.js through real Chromium via Playwright — same structure as
 * tests/test_password_recovery_pkce_e2e.js.
 *
 * What is faked, and why: real Google/Supabase credentials do not exist in
 * this environment, so this test cannot call the real
 * `https://accounts.google.com/...` or a real `*.supabase.co` project.
 * Instead, a third tiny HTTPS server stands in for the ONE part of the flow
 * that is a real, user-visible browser redirect — GoTrue's
 * `/auth/v1/authorize` endpoint (which itself handles the Google handshake
 * and bounces back with a one-time `code`). Everything else this BFF talks
 * to server-to-server (GoTrue's `/auth/v1/settings` and the PKCE
 * `/auth/v1/token?grant_type=pkce` exchange) is the SAME in-memory fake
 * GoTrue adapter pattern the existing recovery/signup PKCE E2E test uses —
 * its PKCE exchange genuinely recomputes SHA-256(code_verifier) via this
 * project's own pkce.js and rejects anything that does not match the
 * code_challenge given to the authorize stand-in, exactly like real GoTrue.
 *
 * Limits honestly disclosed (see also the PR description): this cannot
 * prove the real `https://accounts.google.com` consent screen or a real
 * Supabase project behave exactly as documented — only that this BFF's own
 * logic (PKCE verifier cookie, provider-enabled check, error classification,
 * session creation, identity linking by email) is correct given the
 * documented GoTrue contract. A real, live run against Google + Supabase,
 * once the founder finishes the dashboard configuration, is recommended
 * before merging.
 *
 * Run with: node tests/test_oauth_google_e2e.js
 */

const assert = require('node:assert/strict');
const http = require('node:http');
const https = require('node:https');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const crypto = require('node:crypto');
const { execSync } = require('node:child_process');

try {
  require.resolve('playwright');
} catch {
  module.paths.push(execSync('npm root -g').toString().trim());
}
const { chromium } = require('playwright');

const { createBff } = require('../bff/src/app');
const { MemorySessionStore } = require('../bff/src/session-store');
const { MemoryMutationStore } = require('../bff/src/idempotency');
const { computeCodeChallenge } = require('../bff/src/pkce');

const DIST = path.join(__dirname, '..', 'dist');
const SITE_PORT = 8764;
const SITE_BASE = `http://127.0.0.1:${SITE_PORT}`;
const OAUTH_REDIRECT_TO = `${SITE_BASE}/academy.html?auth=oauth-google#access`;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webmanifest': 'application/manifest+json' };

function startSiteServer() {
  const server = http.createServer((req, res) => {
    let filePath = decodeURIComponent(req.url.split('?')[0].split('#')[0]);
    if (filePath === '/') filePath = '/index.html';
    const full = path.join(DIST, filePath);
    fs.readFile(full, (err, data) => {
      if (err) { res.writeHead(404); res.end('not found'); return; }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(full)] || 'application/octet-stream' });
      res.end(data);
    });
  });
  return new Promise(resolve => server.listen(SITE_PORT, '127.0.0.1', () => resolve(server)));
}

function makeSelfSignedCert() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dda-oauth-e2e-cert-'));
  const keyPath = path.join(dir, 'key.pem');
  const certPath = path.join(dir, 'cert.pem');
  execSync(`openssl req -x509 -newkey rsa:2048 -keyout "${keyPath}" -out "${certPath}" -days 2 -nodes -subj "/CN=127.0.0.1" -addext "subjectAltName=IP:127.0.0.1"`, { stdio: 'ignore' });
  return { key: fs.readFileSync(keyPath), cert: fs.readFileSync(certPath) };
}

// A GoTrue stand-in whose PKCE exchange genuinely enforces the RFC 7636
// relationship (code_challenge == BASE64URL(SHA256(code_verifier))), using
// this project's own pkce.js — not a loose approximation. Mirrors
// bff/src/supabase-auth.js's real method names exactly (getProviderSettings,
// buildAuthorizeUrl, exchangeOAuthCode).
function makeFakeGoTrue() {
  const users = new Map(); // email -> { id, password, confirmed, displayName }
  const flows = new Map(); // code -> { email, codeChallenge, kind, consumed }
  let nextId = 1;
  let nextCode = 1;

  function normalize(email) { return String(email || '').trim().toLowerCase(); }

  return {
    users,
    flows,
    googleEnabled: true,
    // Set once the authorize stand-in server (below) is listening — the
    // adapter's buildAuthorizeUrl() points the BROWSER at it, standing in
    // for a real `https://<project>.supabase.co`.
    authorizeBase: null,
    // Test control knobs the authorize stand-in server reads per scenario.
    nextOAuthOutcome: 'approve', // 'approve' | 'deny' | 'invalid_code'
    nextOAuthEmail: 'oauth-user@example.com',

    async getProviderSettings() { return { external: { google: this.googleEnabled } }; },

    buildAuthorizeUrl({ provider, redirectTo, codeChallenge }) {
      const url = new URL(`${this.authorizeBase}/auth/v1/authorize`);
      url.searchParams.set('provider', provider);
      if (redirectTo) url.searchParams.set('redirect_to', redirectTo);
      if (codeChallenge) { url.searchParams.set('code_challenge', codeChallenge); url.searchParams.set('code_challenge_method', 'S256'); }
      return url.toString();
    },

    // Called by the authorize stand-in server once it "completes" the
    // Google handshake for an 'approve' outcome: mints a real, flow-bound
    // code exactly like GoTrue's /authorize would once Google has confirmed
    // the user's identity, and auto-links to an existing user by e-mail —
    // GoTrue's own documented Automatic Linking behavior (see PR
    // description), modeled here by simply reusing the existing Map entry
    // instead of creating a second one.
    registerOAuthFlow(email, codeChallenge) {
      const key = normalize(email);
      if (!users.has(key)) users.set(key, { id: `user-${nextId++}`, password: null, confirmed: true, displayName: '' });
      const code = `oauth-code-${nextCode++}`;
      flows.set(code, { email: key, codeChallenge, kind: 'oauth', consumed: false });
      return code;
    },

    async exchangePkceCode(code, codeVerifier, expectedKind) {
      const flow = flows.get(code);
      if (!flow || flow.kind !== expectedKind) { const e = new Error('invalid flow state, is expired or has already been used'); e.status = 404; e.code = 'flow_state_not_found'; throw e; }
      if (flow.consumed) { const e = new Error('code already used'); e.status = 400; e.code = 'invalid_grant'; throw e; }
      if (!codeVerifier || computeCodeChallenge(codeVerifier) !== flow.codeChallenge) {
        const e = new Error('invalid request: both auth code and code verifier should be non-empty'); e.status = 400; e.code = 'invalid_grant'; throw e;
      }
      flow.consumed = true;
      const user = users.get(flow.email);
      return { user: { id: user.id }, access_token: `access-${user.id}`, refresh_token: `refresh-${user.id}` };
    },
    async exchangeOAuthCode(code, codeVerifier) { return this.exchangePkceCode(code, codeVerifier, 'oauth'); },

    // Plain email/password path (Scenario E — existing flow must not
    // regress) and the identity-linking bonus scenario (register first,
    // then sign in with Google using the same e-mail).
    async register({ email, password, display_name }) {
      const key = normalize(email);
      if (!users.has(key)) users.set(key, { id: `user-${nextId++}`, password, confirmed: true, displayName: display_name || '' });
      return { user: null };
    },
    async verifyEmail() { const e = new Error('not used in this test'); e.status = 400; throw e; },
    async login({ email, password }) {
      const key = normalize(email);
      const user = users.get(key);
      if (!user || user.password !== password) { const e = new Error('Invalid login credentials'); e.status = 400; e.code = 'invalid_credentials'; throw e; }
      if (!user.confirmed) { const e = new Error('Email not confirmed'); e.status = 400; e.code = 'email_not_confirmed'; throw e; }
      return { user: { id: user.id }, access_token: `access-${user.id}`, refresh_token: `refresh-${user.id}` };
    },
    async requestPasswordReset() { return {}; },
    async verifyRecoveryToken() { const e = new Error('not used'); e.status = 400; throw e; },
    async exchangeRecoveryCode() { const e = new Error('not used'); e.status = 400; throw e; },
    async exchangeSignupCode() { const e = new Error('not used'); e.status = 400; throw e; },
    async confirmPasswordReset() { return {}; },
    async getUser(userId) {
      const entry = [...users.entries()].find(([, u]) => u.id === userId);
      if (!entry) { const e = new Error('not found'); e.status = 404; throw e; }
      const [email, user] = entry;
      return { user_id: user.id, email, email_verified: user.confirmed, display_name: user.displayName, status: 'active', entitlements: [] };
    },
    async updateUser(userId, patch) {
      const entry = [...users.entries()].find(([, u]) => u.id === userId);
      entry[1].displayName = patch.display_name;
      return { user_id: userId, email: entry[0], email_verified: entry[1].confirmed, display_name: patch.display_name, status: 'active', entitlements: [] };
    },
    async deleteUser() {},
    async listUsers() { return { total: users.size, users: [] }; },
    async revokeProviderSession() {}
  };
}

// The authorize stand-in: the ONE real, browser-visible redirect hop a real
// `https://<project>.supabase.co/auth/v1/authorize` would be. It never talks
// to a real Google — it reads this test's `auth.nextOAuthOutcome` to decide
// what a real Google consent screen would have produced, which is the one
// piece of this flow genuinely outside this repository's control.
function startFakeAuthorizeServer(auth, cert) {
  const server = https.createServer(cert, (req, res) => {
    const url = new URL(req.url, 'https://fake-gotrue.local');
    if (url.pathname !== '/auth/v1/authorize') { res.writeHead(404); return res.end(); }
    const provider = url.searchParams.get('provider');
    const redirectTo = url.searchParams.get('redirect_to');
    const codeChallenge = url.searchParams.get('code_challenge');
    let target;
    try { target = new URL(redirectTo); } catch { res.writeHead(400); return res.end('bad redirect_to'); }
    if (provider !== 'google') {
      target.searchParams.set('error', 'invalid_request');
      target.searchParams.set('error_description', 'Unsupported provider');
      res.writeHead(302, { Location: target.toString() });
      return res.end();
    }
    if (auth.nextOAuthOutcome === 'deny') {
      target.searchParams.set('error', 'access_denied');
      target.searchParams.set('error_description', 'The user denied the request');
      res.writeHead(302, { Location: target.toString() });
      return res.end();
    }
    if (auth.nextOAuthOutcome === 'invalid_code') {
      // Stands in for a code that is dead by the time the BFF tries to
      // redeem it (expired at the provider, or a replayed/garbage value) —
      // never registered against any code_challenge in `flows`, so the
      // exchange below is guaranteed to fail exactly like a real invalid or
      // already-used code would.
      target.searchParams.set('code', 'garbage-unregistered-code-0000000000');
      res.writeHead(302, { Location: target.toString() });
      return res.end();
    }
    const code = auth.registerOAuthFlow(auth.nextOAuthEmail, codeChallenge);
    target.searchParams.set('code', code);
    res.writeHead(302, { Location: target.toString() });
    res.end();
  });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve(server)));
}

function startBffServer(auth, logs) {
  const sessions = new MemorySessionStore();
  const mutationStore = new MemoryMutationStore();
  const entitlements = { async getForUser() { return { membership: { plan: 'free', status: 'active', ends_at: null, revoked_at: null }, entitlements: [] }; } };
  const handler = createBff({
    auth, sessions, mutationStore, entitlements,
    logger: (...entry) => logs.push(entry),
    config: {
      allowedOrigins: [SITE_BASE], secureCookies: true, sessionIdleMs: 60 * 60 * 1000, sessionAbsoluteMs: 24 * 60 * 60 * 1000,
      sessionEncryptionKey: crypto.randomBytes(32).toString('base64url'),
      emailRedirectTo: `${SITE_BASE}/academy.html#access`,
      passwordRecoveryRedirectTo: `${SITE_BASE}/academy.html?type=recovery#access`,
      oauthGoogleRedirectTo: OAUTH_REDIRECT_TO,
      oauthVerifierTtlMs: 10 * 60 * 1000
    },
    clock: () => new Date()
  });
  const { key, cert } = makeSelfSignedCert();
  const server = https.createServer({ key, cert }, handler);
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve(server))).then(s => ({ server: s, cert: { key, cert } }));
}

let passed = 0;
const failures = [];
async function test(name, fn) {
  try { await fn(); passed++; console.log(`  ok — ${name}`); }
  catch (error) { failures.push({ name, error }); console.log(`  FAIL — ${name}`); console.log(`    ${error.message}`); }
}

async function initPage(context, bffBase) {
  await context.addInitScript(base => { window.DDA_BFF_BASE_URL = base; }, bffBase);
  const page = await context.newPage();
  await page.goto(`${SITE_BASE}/academy.html#access`);
  return page;
}

(async () => {
  const site = await startSiteServer();
  const browser = await chromium.launch();

  try {
    // ---- Scenario A — the button navigates to Supabase's authorize URL with the right parameters ----
    await test('A. clicking "Continuer avec Google" navigates to the Supabase authorize URL with provider=google and the configured redirect_to', async () => {
      const auth = makeFakeGoTrue();
      const logs = [];
      const { server: bff, cert } = await startBffServer(auth, logs);
      const bffBase = `https://127.0.0.1:${bff.address().port}`;
      const authorizeServer = await startFakeAuthorizeServer(auth, cert);
      auth.authorizeBase = `https://127.0.0.1:${authorizeServer.address().port}`;
      try {
        const context = await browser.newContext({ ignoreHTTPSErrors: true });
        const page = await initPage(context, bffBase);
        const authorizeRequests = [];
        page.on('request', req => { if (req.url().includes('/auth/v1/authorize')) authorizeRequests.push(req.url()); });
        await page.waitForSelector('#bff-oauth-google:not([hidden])', { state: 'visible' }).catch(() => {});
        assert.equal(await page.isVisible('#bff-oauth-google'), true, 'the Google button must be visible alongside the email/password form');
        // academy.html's own inline head script strips the OAuth return's
        // query string from the address bar on the way back (the same
        // privacy hygiene it already applies to recovery/signup `code`
        // links — see its comment), so this waits for the actual network
        // request to Supabase's authorize endpoint, never for a URL that is
        // deliberately never left visible.
        const [authorizeRequest] = await Promise.all([
          page.waitForRequest(req => req.url().includes('/auth/v1/authorize'), { timeout: 10000 }),
          page.click('#bff-oauth-google')
        ]);
        assert.equal(authorizeRequests.length, 1, 'exactly one navigation reached the Supabase authorize endpoint');
        const authorizeUrl = new URL(authorizeRequest.url());
        assert.equal(authorizeUrl.searchParams.get('provider'), 'google');
        assert.equal(authorizeUrl.searchParams.get('redirect_to'), OAUTH_REDIRECT_TO);
        assert.equal(authorizeUrl.searchParams.get('code_challenge_method'), 'S256');
        assert.ok(authorizeUrl.searchParams.get('code_challenge'), 'a real PKCE code_challenge was sent');
        await context.close();
      } finally { await new Promise(resolve => authorizeServer.close(resolve)); await new Promise(resolve => bff.close(resolve)); }
    });

    // ---- Scenario B — a valid code + the browser's own verifier cookie completes sign-in ----
    await test('B. a valid code returned to the same browser that started the flow creates a session and lands on onboarding/Academy', async () => {
      const auth = makeFakeGoTrue();
      const logs = [];
      const { server: bff, cert } = await startBffServer(auth, logs);
      const bffBase = `https://127.0.0.1:${bff.address().port}`;
      const authorizeServer = await startFakeAuthorizeServer(auth, cert);
      auth.authorizeBase = `https://127.0.0.1:${authorizeServer.address().port}`;
      auth.nextOAuthEmail = 'scenario-b@example.com';
      try {
        const context = await browser.newContext({ ignoreHTTPSErrors: true });
        const page = await initPage(context, bffBase);
        await page.click('#bff-oauth-google');
        await page.waitForSelector('#onboarding-form:not([hidden]), .view.active#lesson', { timeout: 10000 });
        const meStatus = await page.evaluate(async base => (await fetch(`${base}/v1/me`, { credentials: 'include' })).status, bffBase);
        assert.equal(meStatus, 200, 'the Google sign-in actually created a real BFF session');
        const cookies = await context.cookies(bffBase);
        assert.equal(cookies.some(c => c.name === '__Host-dda_oauth_verifier'), false, 'the one-time OAuth verifier cookie must be cleared after a successful exchange');
        assert.equal(auth.users.get('scenario-b@example.com').id ? true : false, true, 'a real user record now exists for the Google account email');
        await context.close();
      } finally { await new Promise(resolve => authorizeServer.close(resolve)); await new Promise(resolve => bff.close(resolve)); }
    });

    // ---- Scenario C — no verifier cookie (different browser, or expired) gets an honest message ----
    await test('C. a return with no verifier cookie (e.g. a different browser) is refused with a specific, honest reason — not a generic error', async () => {
      const auth = makeFakeGoTrue();
      const logs = [];
      const { server: bff } = await startBffServer(auth, logs);
      const bffBase = `https://127.0.0.1:${bff.address().port}`;
      try {
        const bareContext = await browser.newContext({ ignoreHTTPSErrors: true });
        const barePage = await bareContext.newPage();
        await barePage.goto(`${SITE_BASE}/academy.html#access`);
        const bareAttempt = await barePage.evaluate(async ({ base }) => {
          const r = await fetch(`${base}/v1/auth/oauth/google/exchange`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: 'some-code-value-123456' }), credentials: 'omit' });
          return { status: r.status, body: await r.json() };
        }, { base: bffBase });
        assert.equal(bareAttempt.status, 400);
        assert.equal(bareAttempt.body.code, 'oauth_verifier_expired', 'without the verifier cookie, the code alone must be refused with an honest, specific reason');
        await bareContext.close();

        // Same check end-to-end through the real UI: a page that lands on
        // the OAuth return URL without ever having clicked the button (no
        // cookie) must show the honest "same browser tab" message, not a
        // blank or generic failure.
        const uiContext = await browser.newContext({ ignoreHTTPSErrors: true });
        await uiContext.addInitScript(base => { window.DDA_BFF_BASE_URL = base; }, bffBase);
        const uiPage = await uiContext.newPage();
        await uiPage.goto(`${SITE_BASE}/academy.html?auth=oauth-google&code=some-code-value-123456#access`);
        await uiPage.waitForFunction(() => !document.getElementById('bff-verify-panel').hidden);
        const message = await uiPage.textContent('#bff-verify-message');
        assert.match(message, /même onglet|navigateur/i, `expected the "same browser/tab" honest message, got: "${message}"`);
        await uiContext.close();
      } finally { await new Promise(resolve => bff.close(resolve)); }
    });

    // ---- Scenario D — an invalid/already-dead code gets an honest message ----
    await test('D. a code the provider rejects (invalid or already used) is refused with an honest message, from the same browser that started the flow', async () => {
      const auth = makeFakeGoTrue();
      const logs = [];
      const { server: bff, cert } = await startBffServer(auth, logs);
      const bffBase = `https://127.0.0.1:${bff.address().port}`;
      const authorizeServer = await startFakeAuthorizeServer(auth, cert);
      auth.authorizeBase = `https://127.0.0.1:${authorizeServer.address().port}`;
      auth.nextOAuthOutcome = 'invalid_code';
      try {
        const context = await browser.newContext({ ignoreHTTPSErrors: true });
        const page = await initPage(context, bffBase);
        // The verifier cookie IS set here (same browser, real /start hit) —
        // only the code itself is bad, so this must fail on the code, not on
        // a missing verifier.
        await page.click('#bff-oauth-google');
        await page.waitForFunction(() => !document.getElementById('bff-verify-panel').hidden);
        await page.waitForFunction(() => !/en cours/i.test(document.getElementById('bff-verify-message')?.textContent || ''), null, { timeout: 5000 });
        const message = await page.textContent('#bff-verify-message');
        assert.doesNotMatch(message, /même onglet/i, 'this must be reported as a bad code, not a missing/expired verifier');
        assert.match(message, /échoué|expiré/i, `expected an honest "sign-in failed/expired" message, got: "${message}"`);
        assert.equal(await page.evaluate(() => document.getElementById('bff-verify-panel').hidden), false);
        await context.close();
      } finally { await new Promise(resolve => authorizeServer.close(resolve)); await new Promise(resolve => bff.close(resolve)); }
    });

    // ---- Provider-not-yet-configured — the founder may still be finishing the Supabase dashboard setup ----
    await test('provider not yet enabled in Supabase: the button bounces back with an honest "not configured" message, never Supabase\'s raw error page', async () => {
      const auth = makeFakeGoTrue();
      auth.googleEnabled = false;
      const logs = [];
      const { server: bff, cert } = await startBffServer(auth, logs);
      const bffBase = `https://127.0.0.1:${bff.address().port}`;
      const authorizeServer = await startFakeAuthorizeServer(auth, cert);
      auth.authorizeBase = `https://127.0.0.1:${authorizeServer.address().port}`;
      try {
        const context = await browser.newContext({ ignoreHTTPSErrors: true });
        const page = await initPage(context, bffBase);
        const authorizeRequests = [];
        page.on('request', req => { if (req.url().includes('/auth/v1/authorize')) authorizeRequests.push(req.url()); });
        await page.click('#bff-oauth-google');
        await page.waitForFunction(() => !document.getElementById('bff-verify-panel').hidden);
        assert.equal(authorizeRequests.length, 0, 'the browser must never be sent to Supabase/Google when the provider is disabled');
        const message = await page.textContent('#bff-verify-message');
        assert.match(message, /pas encore activée/i, `expected the honest "not enabled yet" message, got: "${message}"`);
        await context.close();
      } finally { await new Promise(resolve => authorizeServer.close(resolve)); await new Promise(resolve => bff.close(resolve)); }
    });

    // ---- The user refuses/cancels the Google consent screen ----
    await test('the user cancels at the Google consent screen: an honest "you cancelled" message, not a generic failure', async () => {
      const auth = makeFakeGoTrue();
      auth.nextOAuthOutcome = 'deny';
      const logs = [];
      const { server: bff, cert } = await startBffServer(auth, logs);
      const bffBase = `https://127.0.0.1:${bff.address().port}`;
      const authorizeServer = await startFakeAuthorizeServer(auth, cert);
      auth.authorizeBase = `https://127.0.0.1:${authorizeServer.address().port}`;
      try {
        const context = await browser.newContext({ ignoreHTTPSErrors: true });
        const page = await initPage(context, bffBase);
        await page.click('#bff-oauth-google');
        await page.waitForFunction(() => !document.getElementById('bff-verify-panel').hidden);
        const message = await page.textContent('#bff-verify-message');
        assert.match(message, /annulé/i, `expected the honest "you cancelled" message, got: "${message}"`);
        await context.close();
      } finally { await new Promise(resolve => authorizeServer.close(resolve)); await new Promise(resolve => bff.close(resolve)); }
    });

    // ---- Scenario E — the existing email/password flow is not regressed by adding OAuth to the same BFF/page ----
    await test('E. the existing e-mail/password sign-up and login still work on the exact same BFF instance and page that now also serves Google OAuth', async () => {
      const auth = makeFakeGoTrue();
      const logs = [];
      const { server: bff } = await startBffServer(auth, logs);
      const bffBase = `https://127.0.0.1:${bff.address().port}`;
      try {
        const context = await browser.newContext({ ignoreHTTPSErrors: true });
        const page = await initPage(context, bffBase);
        await page.fill('#first-name', 'Eve');
        await page.fill('#email', 'scenario-e@example.com');
        await page.fill('#access-password', 'EmailPassword123!');
        await page.check('#consent');
        await page.click('#signup-form button[type=submit]');
        await page.waitForFunction(() => document.getElementById('bff-auth-status').textContent.length > 0);
        await page.click('#bff-mode-login');
        await page.fill('#email', 'scenario-e@example.com');
        await page.fill('#access-password', 'EmailPassword123!');
        await page.click('#signup-form button[type=submit]');
        await page.waitForSelector('#onboarding-form:not([hidden]), .view.active#lesson', { timeout: 10000 });
        const meStatus = await page.evaluate(async base => (await fetch(`${base}/v1/me`, { credentials: 'include' })).status, bffBase);
        assert.equal(meStatus, 200, 'the ordinary e-mail/password flow must still fully work');
        await context.close();
      } finally { await new Promise(resolve => bff.close(resolve)); }
    });

    // ---- Scenario F — mobile viewport: button visible, no overflow, full redirect flow works ----
    await test('F. at a 390px mobile viewport, the Google button is visible with no horizontal overflow, and the full redirect flow still completes', async () => {
      const auth = makeFakeGoTrue();
      auth.nextOAuthEmail = 'scenario-f@example.com';
      const logs = [];
      const { server: bff, cert } = await startBffServer(auth, logs);
      const bffBase = `https://127.0.0.1:${bff.address().port}`;
      const authorizeServer = await startFakeAuthorizeServer(auth, cert);
      auth.authorizeBase = `https://127.0.0.1:${authorizeServer.address().port}`;
      try {
        const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 390, height: 844 } });
        const page = await initPage(context, bffBase);
        assert.equal(await page.isVisible('#bff-oauth-google'), true, 'the Google button must be visible on mobile');
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        assert.ok(overflow <= 1, `the access card must not overflow at 390px (overflow=${overflow})`);
        const box = await page.locator('#bff-oauth-google').boundingBox();
        assert.ok(box.width <= 390, 'the Google button must fit within the 390px viewport');
        // The redirect-based flow (no popup) must still work end to end on
        // this viewport — mobile browsers are the whole reason this is a
        // full-page navigation rather than a popup.
        await page.click('#bff-oauth-google');
        await page.waitForSelector('#onboarding-form:not([hidden]), .view.active#lesson', { timeout: 10000 });
        const meStatus = await page.evaluate(async base => (await fetch(`${base}/v1/me`, { credentials: 'include' })).status, bffBase);
        assert.equal(meStatus, 200, 'the mobile redirect flow actually completed sign-in');
        await context.close();
      } finally { await new Promise(resolve => authorizeServer.close(resolve)); await new Promise(resolve => bff.close(resolve)); }
    });

    // ---- Bonus — GoTrue's documented Automatic Linking behavior: the same verified e-mail via Google reaches the SAME account, never a duplicate ----
    await test('bonus. an existing e-mail/password account signing in with Google under the same e-mail lands in the SAME account, never a duplicate', async () => {
      const auth = makeFakeGoTrue();
      const logs = [];
      const { server: bff, cert } = await startBffServer(auth, logs);
      const bffBase = `https://127.0.0.1:${bff.address().port}`;
      const authorizeServer = await startFakeAuthorizeServer(auth, cert);
      auth.authorizeBase = `https://127.0.0.1:${authorizeServer.address().port}`;
      auth.users.set('linked@example.com', { id: 'pre-existing-user-id', password: 'OriginalPassword123!', confirmed: true, displayName: 'Original Name' });
      auth.nextOAuthEmail = 'linked@example.com';
      try {
        const context = await browser.newContext({ ignoreHTTPSErrors: true });
        const page = await initPage(context, bffBase);
        await page.click('#bff-oauth-google');
        await page.waitForSelector('#onboarding-form:not([hidden]), .view.active#lesson', { timeout: 10000 });
        const me = await page.evaluate(async base => (await fetch(`${base}/v1/me`, { credentials: 'include' })).json(), bffBase);
        assert.equal(me.user_id, 'pre-existing-user-id', 'the Google sign-in must land in the SAME pre-existing account, matched by e-mail (GoTrue automatic linking), not create a new one');
        assert.equal(auth.users.size, 1, 'no duplicate account was created for the same e-mail');
        await context.close();
      } finally { await new Promise(resolve => authorizeServer.close(resolve)); await new Promise(resolve => bff.close(resolve)); }
    });
  } finally {
    await browser.close();
    await new Promise(resolve => site.close(resolve));
  }

  console.log(`\n${passed} passed, ${failures.length} failed`);
  if (failures.length) {
    failures.forEach(f => console.log(`FAIL: ${f.name}\n${f.error.stack}`));
    process.exit(1);
  }
  console.log('RESULT: Google OAuth sign-in E2E (real BFF + real browser) — PASS');
})();
