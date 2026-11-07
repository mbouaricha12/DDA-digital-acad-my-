'use strict';
/*
 * One-off script (not part of the regression harness) producing the visual
 * evidence for the signup reliability audit (P0, 2026-11): desktop signup,
 * mobile 390px signup, a real validation error, the post-signup success
 * state (with resend-confirmation now offered), the login form, and forgot
 * password — the real BFF behind the real dist/ site, driven by Playwright,
 * same method as tests/screenshots.js.
 */
const http = require('http');
const https = require('https');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execSync } = require('child_process');
try { require.resolve('playwright'); } catch { module.paths.push(execSync('npm root -g').toString().trim()); }
const { chromium } = require('playwright');

const { createBff } = require('../bff/src/app');
const { MemorySessionStore } = require('../bff/src/session-store');
const { MemoryMutationStore } = require('../bff/src/idempotency');

const DIST = path.join(__dirname, '..', 'dist');
const OUT = process.argv[2] || path.join(__dirname, '..', '..', 'screenshots-signup');
const SITE_PORT = 8764;
const SITE_BASE = `http://127.0.0.1:${SITE_PORT}`;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };

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

function makeFakeGoTrue() {
  const users = new Map();
  return {
    async register({ email, password, display_name }) {
      users.set(email, { id: `user-${users.size + 1}`, password, confirmed: false, displayName: display_name || '' });
      return { user: null };
    },
    async login({ email, password }) {
      const user = users.get(email);
      if (!user || user.password !== password) { const e = new Error('Invalid login credentials'); e.status = 400; e.code = 'invalid_credentials'; throw e; }
      return { user: { id: user.id }, access_token: `access-${user.id}`, refresh_token: `refresh-${user.id}` };
    },
    async verifyEmail() { return {}; },
    async requestPasswordReset() { return {}; },
    async verifyRecoveryToken() { const e = new Error('invalid'); e.status = 403; throw e; },
    async exchangeRecoveryCode() { const e = new Error('invalid'); e.status = 403; throw e; },
    async confirmPasswordReset() { return {}; },
    async getUser(userId) { const entry = [...users.entries()].find(([, u]) => u.id === userId); const [email, user] = entry; return { user_id: userId, email, email_verified: user.confirmed, display_name: user.displayName, status: 'active', entitlements: [] }; },
    async updateUser(userId, patch) { return { user_id: userId, email: 'x@example.com', email_verified: false, display_name: patch.display_name, status: 'active', entitlements: [] }; },
    async deleteUser() {},
    async listUsers() { return { total: users.size, users: [] }; },
    async revokeProviderSession() {}
  };
}

function makeSelfSignedCert() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dda-signup-shots-cert-'));
  const keyPath = path.join(dir, 'key.pem');
  const certPath = path.join(dir, 'cert.pem');
  execSync(`openssl req -x509 -newkey rsa:2048 -keyout "${keyPath}" -out "${certPath}" -days 2 -nodes -subj "/CN=127.0.0.1" -addext "subjectAltName=IP:127.0.0.1"`, { stdio: 'ignore' });
  return { key: fs.readFileSync(keyPath), cert: fs.readFileSync(certPath) };
}

function startBffServer(auth) {
  const sessions = new MemorySessionStore();
  const mutationStore = new MemoryMutationStore();
  const entitlements = { async getForUser() { return { membership: { plan: 'free', status: 'active', ends_at: null, revoked_at: null }, entitlements: [] }; } };
  const handler = createBff({
    auth, sessions, mutationStore, entitlements, logger: () => {},
    config: {
      allowedOrigins: [SITE_BASE], secureCookies: true, sessionIdleMs: 60 * 60 * 1000, sessionAbsoluteMs: 24 * 60 * 60 * 1000,
      sessionEncryptionKey: require('node:crypto').randomBytes(32).toString('base64url'),
      emailRedirectTo: `${SITE_BASE}/academy.html#access`, passwordRecoveryRedirectTo: `${SITE_BASE}/academy.html?type=recovery#access`
    },
    clock: () => new Date()
  });
  const { key, cert } = makeSelfSignedCert();
  const server = https.createServer({ key, cert }, handler);
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve(server)));
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const site = await startSiteServer();
  const auth = makeFakeGoTrue();
  const bff = await startBffServer(auth);
  const bffBase = `https://127.0.0.1:${bff.address().port}`;
  const browser = await chromium.launch();

  async function newPage(context) {
    await context.addInitScript(base => { window.DDA_BFF_BASE_URL = base; }, bffBase);
    const page = await context.newPage();
    await page.goto(`${SITE_BASE}/academy.html#access`);
    await page.click('#bff-mode-signup');
    return page;
  }

  // 1. Signup — desktop, empty form.
  {
    const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1440, height: 900 } });
    const page = await newPage(context);
    await page.waitForTimeout(150);
    await page.screenshot({ path: path.join(OUT, '1-signup-desktop.png') });
    await context.close();
  }

  // 2. Signup — mobile 390px.
  {
    const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 390, height: 844 } });
    const page = await newPage(context);
    await page.waitForTimeout(150);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    console.log(`mobile-390 horizontal overflow = ${overflow}px`);
    await page.screenshot({ path: path.join(OUT, '2-signup-mobile-390.png'), fullPage: true });
    await context.close();
  }

  // 3. Validation error — invalid e-mail rejected server-side (a@b).
  {
    const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1440, height: 900 } });
    const page = await newPage(context);
    await page.fill('#first-name', 'Ada');
    await page.fill('#email', 'a@b');
    await page.fill('#access-password', 'LongEnoughPassword1!');
    await page.check('#consent');
    await page.click('#signup-form button[type=submit]');
    await page.waitForFunction(() => document.getElementById('signup-error').textContent.length > 0);
    await page.screenshot({ path: path.join(OUT, '3-signup-validation-error.png') });
    await context.close();
  }

  // 4. Success confirmation — with resend-confirmation now offered.
  {
    const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1440, height: 900 } });
    const page = await newPage(context);
    await page.fill('#first-name', 'Ada');
    await page.fill('#email', 'shots-success@example.com');
    await page.fill('#access-password', 'LongEnoughPassword1!');
    await page.check('#consent');
    await page.click('#signup-form button[type=submit]');
    await page.waitForFunction(() => document.getElementById('bff-auth-status').textContent.length > 0);
    await page.screenshot({ path: path.join(OUT, '4-signup-success.png') });
    await context.close();
  }

  // 5. Login form.
  {
    const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1440, height: 900 } });
    const page = await newPage(context);
    await page.click('#bff-mode-login');
    await page.waitForTimeout(150);
    await page.screenshot({ path: path.join(OUT, '5-login.png') });
    await context.close();
  }

  // 6. Forgot password form.
  {
    const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1440, height: 900 } });
    const page = await newPage(context);
    await page.click('#bff-mode-login');
    await page.click('#bff-forgot-password');
    await page.waitForTimeout(150);
    await page.screenshot({ path: path.join(OUT, '6-forgot-password.png') });
    await context.close();
  }

  await browser.close();
  await new Promise(resolve => bff.close(resolve));
  await new Promise(resolve => site.close(resolve));
  console.log(`Screenshots written to ${OUT}`);
})();
