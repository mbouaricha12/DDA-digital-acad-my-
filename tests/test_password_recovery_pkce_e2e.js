'use strict';
/*
 * P0 auth reliability audit (2026-11) — PKCE fix, real reproduction.
 *
 * Production incident, confirmed via Resend (sent e-mails) and Supabase
 * (auth.users.recovery_token/recovery_sent_at, read-only): the founder's
 * own recovery e-mail, sent 2026-11-07 20:18:12 UTC, had its recovery_token
 * already empty by 20:18:24 UTC — 12 seconds later, and a second one sent
 * 20:26:47 UTC was consumed by 20:27:15 UTC — 28 seconds later. No human
 * opens an e-mail and clicks a link that fast; this is consistent with a
 * security scanner's sandboxed browser pre-visiting (and executing the JS
 * on) the link before the real user ever sees it, burning the classic
 * magic-link flow's single-use token before the real click.
 *
 * This file boots the REAL BFF (bff/src/app.js's createBff — exactly what
 * Vercel runs) behind a real HTTPS listener, the REAL static dist/ build
 * behind another real listener, and drives the REAL academy.html + app.js +
 * bff-client.js through real Chromium via Playwright. The fake GoTrue
 * adapter below is NOT a loose stand-in: its PKCE exchange genuinely
 * recomputes SHA-256(code_verifier) and rejects anything that does not
 * match the code_challenge given at /recover or /signup time, using this
 * project's own pkce.js — the same check real GoTrue performs — so a
 * "scanner" in this file is a real HTTP/browser actor, not a mocked
 * success.
 *
 * Run with: node tests/test_password_recovery_pkce_e2e.js
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
const SITE_PORT = 8763;
const SITE_BASE = `http://127.0.0.1:${SITE_PORT}`;
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
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dda-pkce-e2e-cert-'));
  const keyPath = path.join(dir, 'key.pem');
  const certPath = path.join(dir, 'cert.pem');
  execSync(`openssl req -x509 -newkey rsa:2048 -keyout "${keyPath}" -out "${certPath}" -days 2 -nodes -subj "/CN=127.0.0.1" -addext "subjectAltName=IP:127.0.0.1"`, { stdio: 'ignore' });
  return { key: fs.readFileSync(keyPath), cert: fs.readFileSync(certPath) };
}

// A GoTrue stand-in whose PKCE exchange actually enforces the RFC 7636
// relationship (code_challenge == BASE64URL(SHA256(code_verifier))) using
// this project's own pkce.js — not a loose approximation. Every method
// mirrors bff/src/supabase-auth.js's real signatures exactly.
function makeFakeGoTrue() {
  const users = new Map(); // email -> { id, password, confirmed, displayName }
  // Pending flows: code -> { email, codeChallenge, kind: 'recovery'|'signup', consumed }
  const flows = new Map();
  let nextId = 1;
  let nextCode = 1;

  function normalize(email) { return String(email || '').trim().toLowerCase(); }

  return {
    users,
    flows,
    async register({ email, password, display_name, codeChallenge }) {
      const key = normalize(email);
      if (!users.has(key)) users.set(key, { id: `user-${nextId++}`, password, confirmed: false, displayName: display_name || '' });
      if (codeChallenge) {
        const code = `signup-code-${nextCode++}`;
        flows.set(code, { email: key, codeChallenge, kind: 'signup', consumed: false });
        this.lastSignupCode = code;
      }
      return { user: null };
    },
    async verifyEmail() { const e = new Error('legacy path not used in this test'); e.status = 400; throw e; },
    async login({ email, password }) {
      const key = normalize(email);
      const user = users.get(key);
      if (!user || user.password !== password) { const e = new Error('Invalid login credentials'); e.status = 400; e.code = 'invalid_credentials'; throw e; }
      if (!user.confirmed) { const e = new Error('Email not confirmed'); e.status = 400; e.code = 'email_not_confirmed'; throw e; }
      return { user: { id: user.id }, access_token: `access-${user.id}`, refresh_token: `refresh-${user.id}` };
    },
    async requestPasswordReset(email, redirectTo, codeChallenge) {
      const key = normalize(email);
      if (users.has(key) && codeChallenge) {
        const code = `recovery-code-${nextCode++}`;
        flows.set(code, { email: key, codeChallenge, kind: 'recovery', consumed: false });
        this.lastRecoveryCode = code;
      }
      return {};
    },
    async verifyRecoveryToken() { const e = new Error('legacy path not used in this test'); e.status = 400; throw e; },
    // The real PKCE check: this is what makes a missing/wrong code_verifier
    // a hard failure, exactly like real GoTrue's /token?grant_type=pkce.
    async exchangePkceCode(code, codeVerifier, expectedKind) {
      const flow = flows.get(code);
      if (!flow || flow.kind !== expectedKind) { const e = new Error('invalid flow state, is expired or has already been used'); e.status = 404; e.code = 'flow_state_not_found'; throw e; }
      if (flow.consumed) { const e = new Error('code already used'); e.status = 400; e.code = 'invalid_grant'; throw e; }
      if (!codeVerifier || computeCodeChallenge(codeVerifier) !== flow.codeChallenge) {
        // Deliberately NOT consuming the flow on a failed verifier check —
        // exactly like real GoTrue: a wrong guess must not burn the code
        // for the legitimate holder of the real verifier.
        const e = new Error('invalid request: both auth code and code verifier should be non-empty'); e.status = 400; e.code = 'invalid_grant'; throw e;
      }
      flow.consumed = true;
      const user = users.get(flow.email);
      if (flow.kind === 'signup') user.confirmed = true;
      return { user: { id: user.id }, access_token: `access-${user.id}`, refresh_token: `refresh-${user.id}` };
    },
    async exchangeRecoveryCode(code, codeVerifier) { return this.exchangePkceCode(code, codeVerifier, 'recovery'); },
    async exchangeSignupCode(code, codeVerifier) { return this.exchangePkceCode(code, codeVerifier, 'signup'); },
    async confirmPasswordReset(accessToken, password) {
      const userId = accessToken.replace('access-', '');
      const entry = [...users.entries()].find(([, u]) => u.id === userId);
      if (!entry) { const e = new Error('invalid token'); e.status = 401; throw e; }
      entry[1].password = password;
      return {};
    },
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

function startBffServer(auth, logs, { recoveryVerifierTtlMs = 30 * 60 * 1000, signupVerifierTtlMs = 60 * 60 * 1000 } = {}) {
  const sessions = new MemorySessionStore();
  const mutationStore = new MemoryMutationStore();
  const entitlements = { async getForUser() { return { membership: { plan: 'free', status: 'active', ends_at: null, revoked_at: null }, entitlements: [] }; } };
  const handler = createBff({
    auth, sessions, mutationStore, entitlements,
    logger: (...entry) => logs.push(entry),
    config: {
      allowedOrigins: [SITE_BASE], secureCookies: true, sessionIdleMs: 60 * 60 * 1000, sessionAbsoluteMs: 24 * 60 * 60 * 1000,
      sessionEncryptionKey: crypto.randomBytes(32).toString('base64url'),
      emailRedirectTo: `${SITE_BASE}/academy.html#access`, passwordRecoveryRedirectTo: `${SITE_BASE}/academy.html?type=recovery#access`,
      recoveryVerifierTtlMs, signupVerifierTtlMs
    },
    clock: () => new Date()
  });
  const { key, cert } = makeSelfSignedCert();
  const server = https.createServer({ key, cert }, handler);
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve(server)));
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
    // ---- Scenario A — the e-mail link's `code` alone is useless ----
    await test('A. a recovery request issues a code, but the code alone cannot complete the reset without this browser\'s own verifier cookie', async () => {
      const auth = makeFakeGoTrue();
      const logs = [];
      const bff = await startBffServer(auth, logs);
      const bffBase = `https://127.0.0.1:${bff.address().port}`;
      auth.users.set('scenario-a@example.com', { id: 'user-a', password: 'OriginalPassword123!', confirmed: true, displayName: 'A' });
      try {
        const context = await browser.newContext({ ignoreHTTPSErrors: true });
        const page = await initPage(context, bffBase);
        await page.click('#bff-mode-login');
        await page.click('#bff-forgot-password');
        await page.fill('#recovery-email', 'scenario-a@example.com');
        await page.click('#bff-recovery-form button[type=submit]');
        await page.waitForFunction(() => document.getElementById('recovery-error').textContent.length > 0);
        assert.ok(auth.lastRecoveryCode, 'a real PKCE flow (code bound to a code_challenge) was actually issued server-side');
        // The verifier cookie must exist, httpOnly, and never be readable by
        // page JS — this IS the mechanism that makes the bare `code` useless
        // to anyone but this exact browser.
        const cookies = await context.cookies(bffBase);
        const verifierCookie = cookies.find(c => c.name === '__Host-dda_pw_verifier');
        assert.ok(verifierCookie, 'the recovery verifier cookie must be set on the browser that made the request');
        assert.equal(verifierCookie.httpOnly, true, 'the verifier must never be readable by page JavaScript');
        const readableByJs = await page.evaluate(() => document.cookie.includes('dda_pw_verifier'));
        assert.equal(readableByJs, false, 'document.cookie must never expose the verifier');
        // A bare, direct exchange attempt with no cookie context at all
        // (a plain unauthenticated HTTP request, standing in for "anyone
        // who merely has the code") must fail without ever touching GoTrue
        // successfully. Made from a brand-new browser context (real TLS
        // trust handling via ignoreHTTPSErrors, no cookie jar) rather than
        // Node's own fetch, which has no simple way to trust this test's
        // self-signed cert.
        const bareContext = await browser.newContext({ ignoreHTTPSErrors: true });
        const barePage = await bareContext.newPage();
        // Same origin as an allowed caller (so this isn't rejected by CORS/
        // CSRF before ever reaching the PKCE check this test means to
        // exercise) but a brand-new context that never submitted the
        // recovery form, so it holds no verifier cookie — standing in for
        // "anyone who merely has the code".
        await barePage.goto(`${SITE_BASE}/academy.html#access`);
        const bareAttempt = await barePage.evaluate(async ({ base, c }) => {
          const r = await fetch(`${base}/v1/auth/password-reset/exchange`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: c }), credentials: 'omit' });
          return r.json();
        }, { base: bffBase, c: auth.lastRecoveryCode });
        assert.equal(bareAttempt?.code, 'recovery_verifier_expired', 'without the verifier cookie, the code alone must be refused with an honest, specific reason');
        await bareContext.close();
        await context.close();
      } finally { await new Promise(resolve => bff.close(resolve)); }
    });

    // ---- Scenario B — the production incident itself: a scanner visiting first must not block the real user ----
    await test('B. a "scanner" visiting the redirect link before the real user cannot complete the reset, and the real user can still complete it afterwards', async () => {
      const auth = makeFakeGoTrue();
      const logs = [];
      const bff = await startBffServer(auth, logs);
      const bffBase = `https://127.0.0.1:${bff.address().port}`;
      auth.users.set('scenario-b@example.com', { id: 'user-b', password: 'OriginalPassword123!', confirmed: true, displayName: 'B' });
      try {
        // The real user's own browser requests the reset.
        const userContext = await browser.newContext({ ignoreHTTPSErrors: true });
        const userPage = await initPage(userContext, bffBase);
        await userPage.click('#bff-mode-login');
        await userPage.click('#bff-forgot-password');
        await userPage.fill('#recovery-email', 'scenario-b@example.com');
        await userPage.click('#bff-recovery-form button[type=submit]');
        await userPage.waitForFunction(() => document.getElementById('recovery-error').textContent.length > 0);
        const code = auth.lastRecoveryCode;
        assert.ok(code);

        // THE PRODUCTION INCIDENT: an automated "scanner" — a completely
        // separate browser context, exactly as a corporate e-mail security
        // scanner's sandboxed browser would be — loads the exact redirect
        // URL from the e-mail BEFORE the real user ever clicks it, and its
        // JavaScript runs exactly as it would for a real visitor (this is
        // the real, documented threat model: JS-executing link scanners,
        // e.g. Microsoft Defender Safe Links).
        const scannerContext = await browser.newContext({ ignoreHTTPSErrors: true });
        await scannerContext.addInitScript(base => { window.DDA_BFF_BASE_URL = base; }, bffBase);
        const scannerPage = await scannerContext.newPage();
        await scannerPage.goto(`${SITE_BASE}/academy.html?type=recovery&code=${encodeURIComponent(code)}#access`);
        await scannerPage.waitForFunction(() => document.getElementById('bff-reset-password-form').hidden || !document.getElementById('bff-verify-panel').hidden);
        const scannerFailed = await scannerPage.evaluate(() => !document.getElementById('bff-verify-panel').hidden);
        assert.equal(scannerFailed, true, 'the scanner (no verifier cookie) must be shown the invalid/expired panel, never a working reset form');
        await scannerContext.close();

        // auth.users.recovery state (modeled here as the flow's `consumed`
        // flag — the direct analogue of the real auth.users.recovery_token
        // the founder observed going empty) must NOT have been burned by
        // the scanner.
        assert.equal(auth.flows.get(code).consumed, false, 'the scanner must never have been able to consume the one-time code — this is the exact bug: previously ANY caller with the code could finish the exchange');

        // THE REAL USER now clicks the SAME link, in the SAME browser that
        // made the original request (holding the matching verifier cookie).
        await userPage.goto(`${SITE_BASE}/academy.html?type=recovery&code=${encodeURIComponent(code)}#access`);
        await userPage.waitForSelector('#bff-reset-password-form:not([hidden])');
        await userPage.fill('#reset-password', 'BrandNewPassword99!');
        await userPage.fill('#reset-password-confirm', 'BrandNewPassword99!');
        await userPage.click('#bff-reset-password-form button[type=submit]');
        await userPage.waitForFunction(() => document.getElementById('bff-auth-status').textContent.includes('modifié'));
        assert.equal(auth.users.get('scenario-b@example.com').password, 'BrandNewPassword99!', 'the real user\'s password was actually changed server-side');
        await userContext.close();
      } finally { await new Promise(resolve => bff.close(resolve)); }
    });

    // ---- Scenario C — ordinary happy path, same browser throughout ----
    await test('C. the real user (same browser/session throughout) can request, reset and log in with the new password', async () => {
      const auth = makeFakeGoTrue();
      const logs = [];
      const bff = await startBffServer(auth, logs);
      const bffBase = `https://127.0.0.1:${bff.address().port}`;
      auth.users.set('scenario-c@example.com', { id: 'user-c', password: 'OldPassword123!', confirmed: true, displayName: 'C' });
      try {
        const context = await browser.newContext({ ignoreHTTPSErrors: true });
        const page = await initPage(context, bffBase);
        await page.click('#bff-mode-login');
        await page.click('#bff-forgot-password');
        await page.fill('#recovery-email', 'scenario-c@example.com');
        await page.click('#bff-recovery-form button[type=submit]');
        await page.waitForFunction(() => document.getElementById('recovery-error').textContent.length > 0);
        await page.goto(`${SITE_BASE}/academy.html?type=recovery&code=${encodeURIComponent(auth.lastRecoveryCode)}#access`);
        await page.waitForSelector('#bff-reset-password-form:not([hidden])');
        await page.fill('#reset-password', 'FreshPassword456!');
        await page.fill('#reset-password-confirm', 'FreshPassword456!');
        await page.click('#bff-reset-password-form button[type=submit]');
        await page.waitForFunction(() => document.getElementById('bff-auth-status').textContent.includes('modifié'));

        await page.click('#bff-mode-login');
        await page.fill('#email', 'scenario-c@example.com');
        await page.fill('#access-password', 'OldPassword123!');
        await page.click('#signup-form button[type=submit]');
        await page.waitForFunction(() => document.getElementById('signup-error').textContent.length > 0);
        assert.match(await page.textContent('#signup-error'), /mot de passe incorrect/i, 'the old password must no longer work');

        await page.fill('#access-password', 'FreshPassword456!');
        await page.click('#signup-form button[type=submit]');
        await page.waitForSelector('#onboarding-form:not([hidden]), .view.active#lesson', { timeout: 10000 });
        const meStatus = await page.evaluate(async base => (await fetch(`${base}/v1/me`, { credentials: 'include' })).status, bffBase);
        assert.equal(meStatus, 200, 'the new password actually logs the user in');
        await context.close();
      } finally { await new Promise(resolve => bff.close(resolve)); }
    });

    // ---- Scenario D — expired verifier gets an honest message ----
    await test('D. an expired verifier fails with a specific, honest message — not the generic "invalid code" text', async () => {
      const auth = makeFakeGoTrue();
      const logs = [];
      const bff = await startBffServer(auth, logs, { recoveryVerifierTtlMs: 300 }); // 300ms — deterministic without a real multi-minute wait
      const bffBase = `https://127.0.0.1:${bff.address().port}`;
      auth.users.set('scenario-d@example.com', { id: 'user-d', password: 'OriginalPassword123!', confirmed: true, displayName: 'D' });
      try {
        const context = await browser.newContext({ ignoreHTTPSErrors: true });
        const page = await initPage(context, bffBase);
        await page.click('#bff-mode-login');
        await page.click('#bff-forgot-password');
        await page.fill('#recovery-email', 'scenario-d@example.com');
        await page.click('#bff-recovery-form button[type=submit]');
        await page.waitForFunction(() => document.getElementById('recovery-error').textContent.length > 0);
        const code = auth.lastRecoveryCode;
        await new Promise(resolve => setTimeout(resolve, 500)); // outlast the 300ms verifier cookie
        await page.goto(`${SITE_BASE}/academy.html?type=recovery&code=${encodeURIComponent(code)}#access`);
        await page.waitForFunction(() => !document.getElementById('bff-verify-panel').hidden);
        const message = await page.textContent('#bff-verify-message');
        assert.match(message, /même navigateur/i, `expected the specific "same browser / expired request" message, got: "${message}"`);
        await context.close();
      } finally { await new Promise(resolve => bff.close(resolve)); }
    });

    // ---- Signup confirmation — the founder's follow-up directive: same vulnerability class, same fix ----
    await test('E. a signup confirmation code alone (no verifier cookie) cannot confirm the account', async () => {
      const auth = makeFakeGoTrue();
      const logs = [];
      const bff = await startBffServer(auth, logs);
      const bffBase = `https://127.0.0.1:${bff.address().port}`;
      try {
        const context = await browser.newContext({ ignoreHTTPSErrors: true });
        const page = await initPage(context, bffBase);
        await page.click('#bff-mode-signup');
        await page.fill('#first-name', 'Eve');
        await page.fill('#email', 'scenario-e@example.com');
        await page.fill('#access-password', 'SignupPassword123!');
        await page.check('#consent');
        await page.click('#signup-form button[type=submit]');
        await page.waitForFunction(() => document.getElementById('bff-auth-status').textContent.length > 0);
        const code = auth.lastSignupCode;
        assert.ok(code, 'a PKCE signup flow was actually issued server-side');
        await context.close();

        const bareContext = await browser.newContext({ ignoreHTTPSErrors: true });
        const barePage = await bareContext.newPage();
        await barePage.goto(`${SITE_BASE}/academy.html#access`);
        const bareAttempt = await barePage.evaluate(async ({ base, c }) => {
          const r = await fetch(`${base}/v1/auth/verify-email`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: c }), credentials: 'omit' });
          return r.json();
        }, { base: bffBase, c: code });
        assert.equal(bareAttempt?.code, 'signup_verifier_expired', 'without the signup verifier cookie, the confirmation code alone must be refused');
        assert.equal(auth.users.get('scenario-e@example.com').confirmed, false, 'the account must not have been confirmed by a caller that never held the verifier');
        await bareContext.close();
      } finally { await new Promise(resolve => bff.close(resolve)); }
    });

    await test('F. a signup "scanner" visiting the confirmation link first does not block the real user\'s own confirmation afterwards', async () => {
      const auth = makeFakeGoTrue();
      const logs = [];
      const bff = await startBffServer(auth, logs);
      const bffBase = `https://127.0.0.1:${bff.address().port}`;
      try {
        const userContext = await browser.newContext({ ignoreHTTPSErrors: true });
        const userPage = await initPage(userContext, bffBase);
        await userPage.click('#bff-mode-signup');
        await userPage.fill('#first-name', 'Finn');
        await userPage.fill('#email', 'scenario-f@example.com');
        await userPage.fill('#access-password', 'SignupPassword123!');
        await userPage.check('#consent');
        await userPage.click('#signup-form button[type=submit]');
        await userPage.waitForFunction(() => document.getElementById('bff-auth-status').textContent.length > 0);
        const code = auth.lastSignupCode;
        assert.ok(code);

        const scannerContext = await browser.newContext({ ignoreHTTPSErrors: true });
        await scannerContext.addInitScript(base => { window.DDA_BFF_BASE_URL = base; }, bffBase);
        const scannerPage = await scannerContext.newPage();
        await scannerPage.goto(`${SITE_BASE}/academy.html?code=${encodeURIComponent(code)}#access`);
        await scannerPage.waitForFunction(() => !document.getElementById('bff-verify-panel').hidden);
        const scannerMessage = await scannerPage.textContent('#bff-verify-message');
        assert.doesNotMatch(scannerMessage, /confirmée/i, 'the scanner must never be shown (or cause) a successful confirmation');
        assert.equal(auth.users.get('scenario-f@example.com').confirmed, false, 'the scanner must not have confirmed the account — the flow stays intact for the real user');
        await scannerContext.close();

        // The real user, same browser that signed up, now clicks the link.
        await userPage.goto(`${SITE_BASE}/academy.html?code=${encodeURIComponent(code)}#access`);
        await userPage.waitForFunction(() => !document.getElementById('bff-verify-panel').hidden);
        const realMessage = await userPage.textContent('#bff-verify-message');
        assert.match(realMessage, /confirmée/i, 'the real user, from the browser that initiated signup, must still be able to confirm');
        assert.equal(auth.users.get('scenario-f@example.com').confirmed, true);
        await userContext.close();
      } finally { await new Promise(resolve => bff.close(resolve)); }
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
  console.log('RESULT: password recovery & signup confirmation PKCE E2E (real BFF + real browser) — PASS');
})();
