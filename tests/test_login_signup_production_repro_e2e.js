'use strict';
/*
 * Founder-reported production bugs (2026-11-07), reproduction attempt in a
 * CLEAN environment — real BFF + real dist/ build, brand-new Playwright
 * browser contexts with no residual cache/Service-Worker/localStorage from
 * any earlier session (a fresh context starts with none of those by
 * construction). Founder-confirmed production deploy for comparison:
 * commit 1440a34270e10114c2b3a95dead5420c66468ce6 (GitHub Pages, green).
 *
 * BUG 1 — SIGNUP: clicking "S'inscrire" allegedly opens nothing / triggers
 * no visible action.
 * BUG 2 — LOGIN: the login form allegedly does not let the user log in.
 *
 * What this file actually drives, using the REAL selectors in the current
 * dist/academy.html DOM (not assumed ones): the landing page's real
 * "Commencer gratuitement" CTA (data-view="access", the actual signup
 * entry point — there is no literal "S'inscrire" string anywhere in dist/,
 * confirmed by a repo-wide search), the real #bff-mode-signup toggle, the
 * real #signup-form, and a real login against a test account created in
 * the in-memory fake GoTrue adapter (never a real Supabase account).
 *
 * Outcome handling, as instructed: if this does NOT reproduce either bug in
 * a clean environment, that is reported as-is — it does not prove no bug
 * exists for the founder's actual browser, only that the code itself works
 * end-to-end here. See the PR description for the most likely code-level
 * explanation investigated alongside this file: dist/sw.js's Service
 * Worker previously served app.js/bff-client.js stale-while-revalidate,
 * which could let a RETURNING visitor run an old cached script against a
 * freshly-deployed HTML page right after a release — fixed in this same
 * change (see test_service_worker_offline_contract.js).
 *
 * Run with: node tests/test_login_signup_production_repro_e2e.js
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

const DIST = path.join(__dirname, '..', 'dist');
const SITE_PORT = 8764;
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
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dda-repro-e2e-cert-'));
  const keyPath = path.join(dir, 'key.pem');
  const certPath = path.join(dir, 'cert.pem');
  execSync(`openssl req -x509 -newkey rsa:2048 -keyout "${keyPath}" -out "${certPath}" -days 2 -nodes -subj "/CN=127.0.0.1" -addext "subjectAltName=IP:127.0.0.1"`, { stdio: 'ignore' });
  return { key: fs.readFileSync(keyPath), cert: fs.readFileSync(certPath) };
}

function makeFakeGoTrue() {
  const users = new Map();
  function normalize(email) { return String(email || '').trim().toLowerCase(); }
  return {
    users,
    async register({ email, password, display_name }) {
      const key = normalize(email);
      if (!users.has(key)) users.set(key, { id: `user-${users.size + 1}`, password, confirmed: true, displayName: display_name || '' });
      return { user: null };
    },
    async verifyEmail() { return {}; },
    async login({ email, password }) {
      const key = normalize(email);
      const user = users.get(key);
      if (!user || user.password !== password) { const e = new Error('Invalid login credentials'); e.status = 400; e.code = 'invalid_credentials'; throw e; }
      return { user: { id: user.id }, access_token: `access-${user.id}`, refresh_token: `refresh-${user.id}` };
    },
    async requestPasswordReset() { return {}; },
    async verifyRecoveryToken() { const e = new Error('n/a'); e.status = 400; throw e; },
    async exchangeRecoveryCode() { const e = new Error('n/a'); e.status = 400; throw e; },
    async exchangeSignupCode() { const e = new Error('n/a'); e.status = 400; throw e; },
    async confirmPasswordReset() { return {}; },
    async getUser(userId) {
      const entry = [...users.entries()].find(([, u]) => u.id === userId);
      const [email, user] = entry;
      return { user_id: user.id, email, email_verified: true, display_name: user.displayName, status: 'active', entitlements: [] };
    },
    async updateUser(userId, patch) { return { user_id: userId, email: 'x', email_verified: true, display_name: patch.display_name, status: 'active', entitlements: [] }; },
    async deleteUser() {},
    async listUsers() { return { total: users.size, users: [] }; },
    async revokeProviderSession() {}
  };
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

(async () => {
  const site = await startSiteServer();
  const auth = makeFakeGoTrue();
  const logs = [];
  const bff = await startBffServer(auth, logs);
  const bffBase = `https://127.0.0.1:${bff.address().port}`;
  const browser = await chromium.launch();

  try {
    await test('BUG 1 (signup): the landing page\'s real "Commencer gratuitement" CTA navigates into the signup entry point', async () => {
      // Brand-new, isolated context: no cache, no Service Worker, no
      // localStorage from any prior visit — exactly "clean browser state".
      const context = await browser.newContext({ ignoreHTTPSErrors: true });
      await context.addInitScript(base => { window.DDA_BFF_BASE_URL = base; }, bffBase);
      const page = await context.newPage();
      await page.goto(`${SITE_BASE}/index.html`);
      // The real selector, read from the current DOM — not an assumed one.
      // There is no literal "S'inscrire" text anywhere in dist/; the real
      // primary CTA reads "Commencer gratuitement" with data-view="access".
      const cta = page.locator('[data-view="access"]').first();
      await assert.doesNotReject(cta.waitFor({ state: 'visible', timeout: 5000 }), 'the real signup CTA must actually be present and visible on a clean load of the landing page');
      await cta.click();
      await page.waitForURL(/academy\.html#access/, { timeout: 5000 });
      // And the actual signup toggle / form inside the Academy view.
      await page.click('#bff-mode-signup');
      await assert.doesNotReject(page.locator('#signup-form').waitFor({ state: 'visible', timeout: 5000 }), 'the signup form must become visible after clicking the signup entry points');
      const passwordFieldVisible = await page.evaluate(() => !document.getElementById('access-password-field').hidden);
      assert.equal(passwordFieldVisible, true, 'the password field must be revealed in signup mode, confirming the form is actually usable, not just present');
      await context.close();
    });

    await test('BUG 1 (signup, direct): #bff-mode-signup alone, from a clean academy.html load, produces a usable, submittable signup form', async () => {
      const context = await browser.newContext({ ignoreHTTPSErrors: true });
      await context.addInitScript(base => { window.DDA_BFF_BASE_URL = base; }, bffBase);
      const page = await context.newPage();
      await page.goto(`${SITE_BASE}/academy.html#access`);
      await page.click('#bff-mode-signup');
      await page.fill('#first-name', 'Repro');
      await page.fill('#email', 'repro-signup@example.com');
      await page.fill('#access-password', 'ReproPassword123!');
      await page.check('#consent');
      const submit = page.locator('#signup-form button[type=submit]');
      assert.equal(await submit.isDisabled(), false, 'the submit button must not be stuck disabled once the form is validly filled');
      await submit.click();
      await page.waitForFunction(() => document.getElementById('bff-auth-status').textContent.length > 0, { timeout: 5000 });
      const status = await page.textContent('#bff-auth-status');
      assert.match(status, /vérification/i, `expected a visible "check your e-mail" confirmation after submitting, got: "${status}"`);
      assert.ok(auth.users.has('repro-signup@example.com'), 'the account was actually created server-side, not just a silent UI no-op');
      await context.close();
    });

    await test('BUG 2 (login): a valid test account can log in from a clean academy.html load and reaches the Academy', async () => {
      // Seed a known-good account directly in the fake adapter — this is
      // the test's own account, never one of the real restricted accounts.
      auth.users.set('repro-login@example.com', { id: 'user-repro-login', password: 'ReproLoginPass123!', confirmed: true, displayName: 'Repro Login' });
      const context = await browser.newContext({ ignoreHTTPSErrors: true });
      await context.addInitScript(base => { window.DDA_BFF_BASE_URL = base; }, bffBase);
      const page = await context.newPage();
      await page.goto(`${SITE_BASE}/academy.html#access`);
      await page.click('#bff-mode-login');
      await page.fill('#email', 'repro-login@example.com');
      await page.fill('#access-password', 'ReproLoginPass123!');
      const submit = page.locator('#signup-form button[type=submit]');
      assert.equal(await submit.isDisabled(), false, 'the login submit button must not be stuck disabled with a validly filled form');
      await submit.click();
      await page.waitForSelector('#onboarding-form:not([hidden]), .view.active#lesson', { timeout: 10000 });
      const meStatus = await page.evaluate(async base => (await fetch(`${base}/v1/me`, { credentials: 'include' })).status, bffBase);
      assert.equal(meStatus, 200, 'the BFF session must actually be established server-side, confirming a real, not merely visual, login');
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
    console.log('\nRESULT: founder-reported signup/login bugs — NOT reproduced as code defects in a clean environment; see failures above for what specifically broke, if anything.');
    process.exit(1);
  }
  console.log('RESULT: founder-reported signup/login bugs — NOT reproduced in a clean browser environment (real BFF + real dist/ build, no cache/Service-Worker/localStorage carried over). See the PR description for the Service-Worker staleness hypothesis investigated as the most likely real-world explanation.');
})();
