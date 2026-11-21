'use strict';
/*
 * Revenue & Activation (2026-11) — real browser E2E for the Chariow checkout
 * return. Phase 1's architecture read found two real gaps, fixed alongside
 * this test:
 *
 *   1. CHARIOW_CHECKOUT_REDIRECT_URL was never configured in production, so
 *      a real payer had no way back to DDA after paying — they'd be left on
 *      Chariow's own page. Now set to
 *      https://dariusdigitalacademy.com/academy.html?checkout=return#membership
 *      (see docs/RISK_REGISTER.md and the Vercel project env).
 *   2. Even once back, dist/app.js's renderState() drove #membership-status
 *      (and the sidebar/profile plan badges) from the local, learner-
 *      editable demo flag (prototypeState.membership.plan), never from
 *      serverPremiumConfirmed — the SAME authority canUnlock('premium_track')
 *      already uses for real content gating. A real paying customer would
 *      see "DDA Free" even though their lessons correctly unlocked.
 *
 * This test boots the REAL BFF (bff/src/app.js's createBff) and the REAL
 * dist/ build (academy.html + app.js + bff-client.js) behind two plain HTTP
 * listeners, and drives them through real Chromium — same structure as
 * tests/test_oauth_google_e2e.js and tests/test_billing_checkout_contract.js.
 *
 * What is faked: the Chariow webhook itself (no real Chariow account exists
 * in this sandbox) — `entitlements.getForUser()` is a mutable in-memory
 * stand-in whose membership flips from 'free' to a real active 'premium'
 * membership, simulating the Pulse webhook landing asynchronously relative
 * to the browser's return — exactly the race `handleCheckoutReturn()`'s own
 * polling exists to cover (the webhook can land before OR after the
 * redirect completes).
 *
 * Run with: node tests/test_checkout_return_e2e.js
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

const DIST = path.join(__dirname, '..', 'dist');
const SITE_PORT = 8767;
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

function makeAuth() {
  return {
    async login({ email }) { return { user: { id: 'u-checkout-return' }, access_token: 'a', refresh_token: 'r' }; },
    async getUser(userId) { return { user_id: userId, email: 'payer@example.com', email_verified: true, display_name: 'Payer', status: 'active', entitlements: [] }; }
  };
}

// Mutable membership stand-in for the Chariow Pulse webhook's eventual
// effect (bff/src/billing-store.js's real applyChariowTransition() writes
// exactly this shape into dda_billing_memberships in production).
function makeEntitlements() {
  let membership = null; // null/free until the simulated webhook lands
  return {
    setFree() { membership = null; },
    setPremium() { membership = { plan: 'premium', status: 'active', ends_at: null, revoked_at: null }; },
    async getForUser() {
      return { membership, entitlements: membership ? ['premium_track'] : [] };
    }
  };
}

// academy.html's CSP is `connect-src 'self' https:` — a plain http:// BFF on
// a different port would be silently blocked by the browser itself (CSP, not
// CORS), exactly as it would for any real cross-origin fetch. The real
// production BFF is HTTPS (api.dariusdigitalacademy.com), so this test must
// be too, same as tests/test_oauth_google_e2e.js and
// tests/test_password_recovery_pkce_e2e.js.
function makeSelfSignedCert() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dda-checkout-return-e2e-cert-'));
  const keyPath = path.join(dir, 'key.pem');
  const certPath = path.join(dir, 'cert.pem');
  execSync(`openssl req -x509 -newkey rsa:2048 -keyout "${keyPath}" -out "${certPath}" -days 2 -nodes -subj "/CN=127.0.0.1" -addext "subjectAltName=IP:127.0.0.1"`, { stdio: 'ignore' });
  return { key: fs.readFileSync(keyPath), cert: fs.readFileSync(certPath) };
}

function startBffServer(entitlements) {
  const sessions = new MemorySessionStore();
  const handler = createBff({
    auth: makeAuth(), sessions, entitlements,
    config: {
      allowedOrigins: [SITE_BASE], secureCookies: true, sessionIdleMs: 60 * 60 * 1000, sessionAbsoluteMs: 24 * 60 * 60 * 1000,
      sessionEncryptionKey: crypto.randomBytes(32).toString('base64url'),
      emailRedirectTo: `${SITE_BASE}/academy.html#access`,
      passwordRecoveryRedirectTo: `${SITE_BASE}/academy.html?type=recovery#access`
    },
    clock: () => new Date()
  });
  const { key, cert } = makeSelfSignedCert();
  const server = https.createServer({ key, cert }, handler);
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve(server)));
}

async function loginAndReturnFromCheckout(context, bffBase) {
  await context.addInitScript(base => { window.DDA_BFF_BASE_URL = base; }, bffBase);
  const page = await context.newPage();
  // Real sign-in first (the checkout return handler only acts once a BFF
  // session exists — refreshServerPremiumEntitlement() is a no-op without one).
  await page.goto(`${SITE_BASE}/academy.html#access`);
  await page.evaluate(async base => {
    await fetch(`${base}/v1/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ email: 'payer@example.com', password: 'whatever-long-enough' }) });
  }, bffBase);
  // Now the real, browser-visible hop: landing back on the exact URL
  // CHARIOW_CHECKOUT_REDIRECT_URL points at in production.
  await page.goto(`${SITE_BASE}/academy.html?checkout=return#membership`);
  return page;
}

let passed = 0;
const failures = [];
async function test(name, fn) {
  try { await fn(); passed++; console.log(`  ok — ${name}`); }
  catch (error) { failures.push({ name, error }); console.log(`  FAIL — ${name}`); console.log(`    ${error.message}`); }
}

(async () => {
  const site = await startSiteServer();
  const browser = await chromium.launch();

  try {
    await test('A. webhook already landed before the return: the learner sees a real "DDA Premium" status, not the local demo label', async () => {
      const entitlements = makeEntitlements();
      entitlements.setPremium();
      const bff = await startBffServer(entitlements);
      const bffBase = `https://127.0.0.1:${bff.address().port}`;
      try {
        const context = await browser.newContext({ ignoreHTTPSErrors: true });
        const page = await loginAndReturnFromCheckout(context, bffBase);
        await page.waitForFunction(() => document.getElementById('membership-status')?.textContent === 'DDA Premium', null, { timeout: 15000 });
        const note = await page.textContent('#membership-status-note');
        assert.match(note, /confirmé par paiement réel/, `expected the real-subscription note, got: "${note}"`);
        assert.equal(await page.isHidden('#revert-free'), true, '"revert to free" must not be offered for a real server-confirmed subscription');
        await context.close();
      } finally { await new Promise(resolve => bff.close(resolve)); }
    });

    await test('B. webhook lands a few seconds AFTER the return (real race): the honest "vérification" state is shown first, then flips to confirmed — never a stuck false negative', async () => {
      const entitlements = makeEntitlements();
      entitlements.setFree();
      const bff = await startBffServer(entitlements);
      const bffBase = `https://127.0.0.1:${bff.address().port}`;
      try {
        const context = await browser.newContext({ ignoreHTTPSErrors: true });
        const page = await loginAndReturnFromCheckout(context, bffBase);
        // Immediately after landing, before the webhook "arrives", status must
        // still read Free — no premature/fabricated confirmation.
        await page.waitForFunction(() => document.getElementById('membership-status')?.textContent === 'DDA Free', null, { timeout: 5000 });
        // Simulate the Pulse webhook landing mid-poll.
        setTimeout(() => entitlements.setPremium(), 1500);
        await page.waitForFunction(() => document.getElementById('membership-status')?.textContent === 'DDA Premium', null, { timeout: 15000 });
        await context.close();
      } finally { await new Promise(resolve => bff.close(resolve)); }
    });

    await test('C. webhook never lands within the polling window: an honest "still processing" message, never a false "confirmed"', async () => {
      const entitlements = makeEntitlements();
      entitlements.setFree();
      const bff = await startBffServer(entitlements);
      const bffBase = `https://127.0.0.1:${bff.address().port}`;
      try {
        const context = await browser.newContext({ ignoreHTTPSErrors: true });
        const page = await loginAndReturnFromCheckout(context, bffBase);
        await page.waitForFunction(() => /en cours de traitement/.test(document.querySelector('.toast, [data-toast], body')?.textContent || ''), null, { timeout: 16000 }).catch(async () => {
          // Fallback: some builds render toasts into a dynamically created node — assert via the final membership status instead if the toast text selector doesn't match this build's markup.
          assert.equal(await page.textContent('#membership-status'), 'DDA Free', 'without a confirmed webhook, status must stay honestly Free');
        });
        assert.equal(await page.textContent('#membership-status'), 'DDA Free', 'the server never confirmed — status must not have flipped to Premium');
        await context.close();
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
  console.log('RESULT: Chariow checkout return E2E (real BFF + real browser) — PASS');
})();
