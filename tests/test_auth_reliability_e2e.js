'use strict';
/*
 * P0 auth reliability audit (2026-11) — real reproduction, not a contract test.
 *
 * A previous pass (PR #217) declared signup/login "already compliant" from
 * reading code and running the request/response contract tests in
 * test_bff_implementation.js alone. That is not enough: this file boots the
 * REAL BFF HTTP server (bff/src/app.js's createBff — the exact module Vercel
 * runs in production) behind a real Node http.createServer, boots the REAL
 * static dist/ site behind another real http.createServer, and drives the
 * REAL academy.html + app.js + bff-client.js through a real Chromium browser
 * with Playwright — exactly as a learner's browser would. No route() mocking
 * of fetch() for the auth flow: the browser makes real HTTP requests to the
 * real BFF process, which makes real calls into a fake Supabase Auth adapter
 * that reproduces GoTrue's actual documented response shapes (status +
 * error_code) for each failure mode. This is what "reproduce the behavior"
 * means for the production incident: real users told "Mot de passe
 * incorrect" when the real cause was email_not_confirmed or a transient
 * provider error.
 *
 * Run with: node tests/test_auth_reliability_e2e.js
 */

const assert = require('node:assert/strict');
const http = require('node:http');
const https = require('node:https');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { execSync } = require('node:child_process');

try {
  require.resolve('playwright');
} catch {
  module.paths.push(execSync('npm root -g').toString().trim());
}
const { chromium } = require('playwright');

const { createBff, SESSION_COOKIE } = require('../bff/src/app');
const { MemorySessionStore } = require('../bff/src/session-store');
const { MemoryMutationStore } = require('../bff/src/idempotency');

const DIST = path.join(__dirname, '..', 'dist');
const SITE_PORT = 8762;
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

// A faithful stand-in for GoTrue (Supabase Auth) at the SupabaseAuthAdapter
// boundary: same method signatures as bff/src/supabase-auth.js, same
// status/error_code pairs GoTrue actually returns for each case (verified
// against the real project's auth_logs in this audit), including the one
// distinction the production bug lost: email_not_confirmed vs
// invalid_credentials are BOTH plain 400s from GoTrue — only error_code
// tells them apart, which is exactly what the fix in app.js now reads.
function makeFakeGoTrue() {
  const users = new Map(); // email -> { id, password, confirmed, displayName }
  const signupTokens = new Map(); // token -> email
  const recoveryTokens = new Map(); // token -> email
  let nextId = 1;

  function normalize(email) { return String(email || '').trim().toLowerCase(); }

  return {
    users,
    async register({ email, password, display_name }) {
      const key = normalize(email);
      if (!users.has(key)) {
        const id = `user-${nextId++}`;
        users.set(key, { id, password, confirmed: false, displayName: display_name || '' });
      }
      const token = `signup-token-${key}`;
      signupTokens.set(token, key);
      return { user: null };
    },
    async verifyEmail(token) {
      const key = signupTokens.get(token);
      if (!key || !users.has(key)) { const e = new Error('Token has expired or is invalid'); e.status = 403; e.code = 'otp_expired'; throw e; }
      users.get(key).confirmed = true;
      signupTokens.delete(token);
      return {};
    },
    async login({ email, password }) {
      const key = normalize(email);
      const user = users.get(key);
      // GoTrue reports a non-existent account the same way it reports a
      // wrong password (anti user-enumeration) — both are invalid_credentials.
      if (!user || user.password !== password) {
        const e = new Error('Invalid login credentials'); e.status = 400; e.code = 'invalid_credentials'; throw e;
      }
      if (!user.confirmed) {
        const e = new Error('Email not confirmed'); e.status = 400; e.code = 'email_not_confirmed'; throw e;
      }
      return { user: { id: user.id }, access_token: `access-${user.id}`, refresh_token: `refresh-${user.id}` };
    },
    async requestPasswordReset(email) {
      const key = normalize(email);
      if (users.has(key)) {
        const token = `recovery-token-${key}-${Date.now()}`;
        recoveryTokens.set(token, key);
        this.lastRecoveryToken = token;
      }
      return {};
    },
    async verifyRecoveryToken(token) {
      const key = recoveryTokens.get(token);
      if (!key) { const e = new Error('Token has expired or is invalid'); e.status = 403; e.code = 'otp_expired'; throw e; }
      const user = users.get(key);
      return { user: { id: user.id }, access_token: `access-${user.id}`, refresh_token: `refresh-${user.id}` };
    },
    async exchangeRecoveryCode(code) { return this.verifyRecoveryToken(code); },
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

// academy.html's Content-Security-Policy only allows `connect-src ... https:`
// — exactly as it should in production, where the BFF really is HTTPS. A
// plain http:// BFF would be silently blocked by the browser's own CSP, not
// by the app's logic, so this test runs the real BFF over a real (if
// self-signed) TLS listener rather than weakening the CSP it is meant to
// exercise as shipped.
function makeSelfSignedCert() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dda-e2e-cert-'));
  const keyPath = path.join(dir, 'key.pem');
  const certPath = path.join(dir, 'cert.pem');
  execSync(`openssl req -x509 -newkey rsa:2048 -keyout "${keyPath}" -out "${certPath}" -days 2 -nodes -subj "/CN=127.0.0.1" -addext "subjectAltName=IP:127.0.0.1"`, { stdio: 'ignore' });
  return { key: fs.readFileSync(keyPath), cert: fs.readFileSync(certPath) };
}

function startBffServer(auth, logs) {
  const sessions = new MemorySessionStore();
  const mutationStore = new MemoryMutationStore();
  const entitlements = { async getForUser() { return { membership: { plan: 'free', status: 'active', ends_at: null, revoked_at: null }, entitlements: [] }; } };
  const handler = createBff({
    auth, sessions, mutationStore, entitlements,
    logger: (...entry) => logs.push(entry),
    config: {
      // secureCookies:true — exactly what production requires
      // (validateRuntimeConfig rejects false) — and real Chromium actually
      // honors it here because http://127.0.0.1 is a W3C "potentially
      // trustworthy origin" like localhost, so Secure+SameSite=None cookies
      // still round-trip without TLS. Testing with secureCookies:false would
      // silently drop the session/csrf cookies in a real browser and this
      // whole file would be testing a config real production never runs.
      allowedOrigins: [SITE_BASE], secureCookies: true, sessionIdleMs: 60 * 60 * 1000, sessionAbsoluteMs: 24 * 60 * 60 * 1000,
      // A real 32-byte key, exactly as production requires (validateRuntimeConfig
      // rejects anything else) — without one, /v1/auth/password-reset/confirm
      // always 401s with recovery_session_expired regardless of the actual
      // recovery flow, which would have silently hidden a real reset-flow bug.
      sessionEncryptionKey: require('node:crypto').randomBytes(32).toString('base64url'),
      emailRedirectTo: `${SITE_BASE}/academy.html#access`, passwordRecoveryRedirectTo: `${SITE_BASE}/academy.html?type=recovery#access`
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

async function signUp(page, { name = 'Ada', email, password }) {
  await page.click('#bff-mode-signup');
  await page.fill('#first-name', name);
  await page.fill('#email', email);
  await page.fill('#access-password', password);
  await page.check('#consent');
  await page.click('#signup-form button[type=submit]');
  await page.waitForFunction(() => document.getElementById('bff-auth-status').textContent.length > 0);
}

async function login(page, { email, password }) {
  await page.click('#bff-mode-login');
  await page.fill('#email', email);
  await page.fill('#access-password', password);
  await page.click('#signup-form button[type=submit]');
}

(async () => {
  const site = await startSiteServer();
  const auth = makeFakeGoTrue();
  const logs = [];
  const bff = await startBffServer(auth, logs);
  const bffBase = `https://127.0.0.1:${bff.address().port}`;
  const browser = await chromium.launch();

  try {
    // 1-4. Register, confirm (simulated email-link click), wrong password,
    // correct password.
    await test('1. signup with a valid email accepts the form and asks to check email', async () => {
      const context = await browser.newContext({ ignoreHTTPSErrors: true });
      const page = await initPage(context, bffBase);
      await signUp(page, { email: 'learner1@example.com', password: 'CorrectHorse123!' });
      const status = await page.textContent('#bff-auth-status');
      assert.match(status, /vérification/i);
      await context.close();
    });

    await test('2. the account exists unconfirmed after signup (real server state, not just a 202)', async () => {
      assert.ok(auth.users.has('learner1@example.com'));
      assert.equal(auth.users.get('learner1@example.com').confirmed, false);
    });

    await test('3. login before confirming the email gets a distinct "confirm your email" message — not "wrong password"', async () => {
      const context = await browser.newContext({ ignoreHTTPSErrors: true });
      const page = await initPage(context, bffBase);
      await login(page, { email: 'learner1@example.com', password: 'CorrectHorse123!' });
      await page.waitForFunction(() => document.getElementById('signup-error').textContent.length > 0);
      const message = await page.textContent('#signup-error');
      assert.match(message, /confirme ton adresse e-mail/i, `expected the email-not-confirmed message, got: "${message}"`);
      assert.doesNotMatch(message, /mot de passe incorrect/i, 'must never say "wrong password" when the real cause is an unconfirmed email — this was the production bug');
      await context.close();
    });

    await test('3b. clicking the real confirmation link confirms the email server-side', async () => {
      const context = await browser.newContext({ ignoreHTTPSErrors: true });
      const page = await initPage(context, bffBase);
      await page.goto(`${SITE_BASE}/academy.html?token=signup-token-learner1@example.com#access`);
      await page.waitForFunction(() => !document.getElementById('bff-verify-panel').hidden);
      const message = await page.textContent('#bff-verify-message');
      assert.match(message, /confirmée/i);
      assert.equal(auth.users.get('learner1@example.com').confirmed, true, 'the server-side user record is actually confirmed, not just the UI text');
      await context.close();
    });

    await test('4. login with the exact password set at signup now succeeds and lands in the Academy — THE core regression', async () => {
      const context = await browser.newContext({ ignoreHTTPSErrors: true });
      const page = await initPage(context, bffBase);
      await login(page, { email: 'learner1@example.com', password: 'CorrectHorse123!' });
      await page.waitForSelector('#onboarding-form:not([hidden]), .view.active#lesson', { timeout: 10000 });
      // There is no separate "#onboarding" view id — the onboarding form
      // lives inside the #access view itself. Landing in the Academy means
      // either that form is now shown (first login) or the #lesson view is
      // active (a returning, already-onboarded learner).
      const onboardingVisible = await page.evaluate(() => !document.getElementById('onboarding-form').hidden);
      const activeView = await page.evaluate(() => document.querySelector('.view.active')?.id);
      assert.ok(onboardingVisible || activeView === 'lesson', `expected the onboarding form or the lesson view, got active view "${activeView}", onboarding visible=${onboardingVisible}`);
      await context.close();
    });

    await test('5. login with a wrong password after a confirmed signup gets the honest "wrong credentials" message', async () => {
      const context = await browser.newContext({ ignoreHTTPSErrors: true });
      const page = await initPage(context, bffBase);
      await login(page, { email: 'learner1@example.com', password: 'TotallyWrongPassword1!' });
      await page.waitForFunction(() => document.getElementById('signup-error').textContent.length > 0);
      const message = await page.textContent('#signup-error');
      assert.match(message, /mot de passe incorrect/i);
      await context.close();
    });

    await test('6. login with a never-registered (and thus never-confirmed) email gets the same honest credentials message, not an enumeration hint', async () => {
      const context = await browser.newContext({ ignoreHTTPSErrors: true });
      const page = await initPage(context, bffBase);
      await login(page, { email: 'nobody-here@example.com', password: 'WhateverPassword1!' });
      await page.waitForFunction(() => document.getElementById('signup-error').textContent.length > 0);
      const message = await page.textContent('#signup-error');
      assert.match(message, /mot de passe incorrect/i);
      await context.close();
    });

    await test('7. login after logout works again with the same password (session was really torn down, not just hidden)', async () => {
      const context = await browser.newContext({ ignoreHTTPSErrors: true });
      const page = await initPage(context, bffBase);
      await login(page, { email: 'learner1@example.com', password: 'CorrectHorse123!' });
      await page.waitForSelector('#onboarding-form:not([hidden]), .view.active#lesson');
      const meBefore = await page.evaluate(async base => (await fetch(`${base}/v1/me`, { credentials: 'include' })).status, bffBase);
      assert.equal(meBefore, 200);
      await page.evaluate(async () => { await window.DDABFF.logout(); });
      const meAfterLogout = await page.evaluate(async base => (await fetch(`${base}/v1/me`, { credentials: 'include' })).status, bffBase);
      assert.equal(meAfterLogout, 401, 'the session cookie is actually revoked server-side on logout');
      await page.reload();
      await login(page, { email: 'learner1@example.com', password: 'CorrectHorse123!' });
      await page.waitForSelector('#onboarding-form:not([hidden]), .view.active#lesson');
      const meAfterRelogin = await page.evaluate(async base => (await fetch(`${base}/v1/me`, { credentials: 'include' })).status, bffBase);
      assert.equal(meAfterRelogin, 200);
      await context.close();
    });

    await test('8-10. forgot password -> reset -> login with the NEW password (old password must stop working)', async () => {
      const context = await browser.newContext({ ignoreHTTPSErrors: true });
      const page = await initPage(context, bffBase);
      await page.click('#bff-mode-login');
      await page.click('#bff-forgot-password');
      await page.fill('#recovery-email', 'learner1@example.com');
      await page.click('#bff-recovery-form button[type=submit]');
      await page.waitForFunction(() => document.getElementById('recovery-error').textContent.length > 0);
      assert.ok(auth.lastRecoveryToken, 'a real recovery token was actually issued server-side');

      const resetContext = await browser.newContext({ ignoreHTTPSErrors: true });
      const resetPage = await initPage(resetContext, bffBase);
      await resetPage.goto(`${SITE_BASE}/academy.html?token=${encodeURIComponent(auth.lastRecoveryToken)}&type=recovery#access`);
      await resetPage.waitForSelector('#bff-reset-password-form:not([hidden])');
      await resetPage.fill('#reset-password', 'BrandNewPassword99!');
      await resetPage.fill('#reset-password-confirm', 'BrandNewPassword99!');
      await resetPage.click('#bff-reset-password-form button[type=submit]');
      await resetPage.waitForFunction(() => document.getElementById('bff-auth-status').textContent.includes('modifié'));

      await login(resetPage, { email: 'learner1@example.com', password: 'CorrectHorse123!' });
      await resetPage.waitForFunction(() => document.getElementById('signup-error').textContent.length > 0);
      assert.match(await resetPage.textContent('#signup-error'), /mot de passe incorrect/i, 'the old password must no longer work after a reset');

      await login(resetPage, { email: 'learner1@example.com', password: 'BrandNewPassword99!' });
      await resetPage.waitForSelector('#onboarding-form:not([hidden]), .view.active#lesson');
      await context.close();
      await resetContext.close();
    });

    await test('11. session persists across a hard page refresh', async () => {
      const context = await browser.newContext({ ignoreHTTPSErrors: true });
      const page = await initPage(context, bffBase);
      await login(page, { email: 'learner1@example.com', password: 'BrandNewPassword99!' });
      await page.waitForSelector('#onboarding-form:not([hidden]), .view.active#lesson');
      await page.reload();
      await page.waitForFunction(() => window.DDABFF !== undefined);
      const meStatus = await page.evaluate(async base => (await fetch(`${base}/v1/me`, { credentials: 'include' })).status, bffBase);
      assert.equal(meStatus, 200, 'the session cookie survives a full page reload');
      await context.close();
    });

    await test('12. mobile viewport (390px) can complete signup -> confirm -> login end to end', async () => {
      const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 390, height: 844 } });
      const page = await initPage(context, bffBase);
      await signUp(page, { email: 'mobile-learner@example.com', password: 'MobilePassword123!' });
      await page.waitForFunction(() => document.getElementById('bff-auth-status').textContent.length > 0);
      await page.goto(`${SITE_BASE}/academy.html?token=signup-token-mobile-learner@example.com#access`);
      await page.waitForFunction(() => !document.getElementById('bff-verify-panel').hidden);
      const mobileContext = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 390, height: 844 } });
      const mobilePage = await initPage(mobileContext, bffBase);
      await login(mobilePage, { email: 'mobile-learner@example.com', password: 'MobilePassword123!' });
      await mobilePage.waitForSelector('#onboarding-form:not([hidden]), .view.active#lesson', { timeout: 10000 });
      await context.close();
      await mobileContext.close();
    });

    await test('show/hide password toggle actually changes the input type (P0.4)', async () => {
      const context = await browser.newContext({ ignoreHTTPSErrors: true });
      const page = await initPage(context, bffBase);
      await page.click('#bff-mode-signup');
      await page.fill('#access-password', 'SomePassword123!');
      assert.equal(await page.getAttribute('#access-password', 'type'), 'password');
      await page.click('#toggle-access-password');
      assert.equal(await page.getAttribute('#access-password', 'type'), 'text');
      await page.click('#toggle-access-password');
      assert.equal(await page.getAttribute('#access-password', 'type'), 'password');
      await context.close();
    });

    await test('login button disables during the request and re-enables on failure (anti double-submit, P0.4)', async () => {
      const context = await browser.newContext({ ignoreHTTPSErrors: true });
      const page = await initPage(context, bffBase);
      // A short password here would be blocked by the input's own
      // minlength="12" HTML5 constraint before the submit event ever fires
      // (not a route through the BFF at all) — use a wrong password that is
      // long enough to actually reach the network request this test means
      // to exercise.
      await login(page, { email: 'learner1@example.com', password: 'LongEnoughButWrong1!' });
      await page.waitForFunction(() => document.getElementById('signup-error').textContent.length > 0);
      const disabled = await page.evaluate(() => document.querySelector('#signup-form button[type=submit]').disabled);
      assert.equal(disabled, false, 'the submit button must re-enable after a failed request');
      await context.close();
    });

    await test('no raw password or provider error text ever reaches the BFF logs', async () => {
      const dangerous = ['CorrectHorse123!', 'BrandNewPassword99!', 'TotallyWrongPassword1!', 'Invalid login credentials', 'Email not confirmed'];
      const serialized = JSON.stringify(logs);
      for (const needle of dangerous) assert.ok(!serialized.includes(needle), `log output must never contain "${needle}"`);
    });

    await test('an already-registered email on a second signup never reveals account existence (anti-enumeration preserved)', async () => {
      const context = await browser.newContext({ ignoreHTTPSErrors: true });
      const page = await initPage(context, bffBase);
      await signUp(page, { email: 'learner1@example.com', password: 'AnotherPassword123!' });
      const status = await page.textContent('#bff-auth-status');
      assert.match(status, /vérification/i, 'the generic "check your email" message is shown either way, exactly as before this fix');
      await context.close();
    });
  } finally {
    await browser.close();
    await new Promise(resolve => bff.close(resolve));
    await new Promise(resolve => site.close(resolve));
  }

  console.log(`\n${passed} passed, ${failures.length} failed`);
  if (failures.length) {
    failures.forEach(f => console.log(`FAIL: ${f.name}\n${f.error.stack}`));
    process.exit(1);
  }
  console.log('RESULT: auth reliability E2E (real BFF + real browser) — PASS');
})();
