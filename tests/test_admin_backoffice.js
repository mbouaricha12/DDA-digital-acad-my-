'use strict';
/*
 * DDA — Back-office (admin.html) regression test.
 *
 * Read-only V1: the server exposes GET /v1/admin/overview, /v1/admin/users
 * and /v1/admin/memberships, gated server-side by the session cookie
 * (bff/src/app.js withAdmin) — never by anything the browser sends. This
 * test mocks those three routes exactly as tests/run.js already mocks
 * /v1/publications/brvm, and checks every honest-state branch: BFF not
 * configured, 401 (not logged in), 403 (logged in, not an admin), and the
 * real 200 render of metrics + paginated users + memberships.
 *
 * Run with: node tests/test_admin_backoffice.js
 */

const assert = require('assert/strict');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

try {
  require.resolve('playwright');
} catch {
  module.paths.push(execSync('npm root -g').toString().trim());
}
const { chromium } = require('playwright');

const DIST = path.join(__dirname, '..', 'dist');
const PORT = 8744;
const BASE = `http://localhost:${PORT}`;
const ADMIN_BASE = `${BASE}/admin.html`;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };

function startServer() {
  const server = http.createServer((req, res) => {
    const filePath = decodeURIComponent(req.url.split('?')[0].split('#')[0]);
    const full = path.join(DIST, filePath);
    fs.readFile(full, (err, data) => {
      if (err) { res.writeHead(404); res.end('not found'); return; }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(full)] || 'application/octet-stream' });
      res.end(data);
    });
  });
  return new Promise(resolve => server.listen(PORT, () => resolve(server)));
}

let passed = 0;
const failures = [];

async function test(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ok — ${name}`);
  } catch (error) {
    failures.push({ name, error });
    console.log(`  FAIL — ${name}`);
    console.log(`    ${error.message}`);
  }
}

async function withBffContext(browser) {
  const context = await browser.newContext();
  await context.addInitScript(() => { window.DDA_BFF_BASE_URL = 'https://bff.test'; });
  return context;
}

(async () => {
  const server = await startServer();
  const browser = await chromium.launch();

  console.log('DDA — Back-office (admin.html) regression test\n');

  await test('with no DDA_BFF_BASE_URL configured, the back-office honestly says it is unavailable, never a fake dashboard', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(ADMIN_BASE);
    await page.waitForSelector('#admin-gate:not([hidden])');
    assert.match(await page.textContent('#admin-gate-title'), /non disponible/i);
    assert.equal(await page.isHidden('.sidebar'), true, 'nav must not render while the server identity cannot be verified');
    await context.close();
  });

  await test('a 401 from /v1/admin/overview (not logged in) shows a sign-in gate, not an error page', async () => {
    const context = await withBffContext(browser);
    await context.route('https://bff.test/v1/admin/overview', route => route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ code: 'unauthenticated' }) }));
    const page = await context.newPage();
    await page.goto(ADMIN_BASE);
    await page.waitForSelector('#admin-gate:not([hidden])');
    assert.match(await page.textContent('#admin-gate-title'), /connecte-toi/i);
    assert.equal(await page.getAttribute('#admin-gate-action', 'href'), 'academy.html#access');
    await context.close();
  });

  await test('a 403 from /v1/admin/overview (logged in, not an admin) shows an access-denied gate, never the data', async () => {
    const context = await withBffContext(browser);
    await context.route('https://bff.test/v1/admin/overview', route => route.fulfill({ status: 403, contentType: 'application/json', body: JSON.stringify({ code: 'forbidden' }) }));
    const page = await context.newPage();
    await page.goto(ADMIN_BASE);
    await page.waitForSelector('#admin-gate:not([hidden])');
    assert.match(await page.textContent('#admin-gate-title'), /réservé aux administrateurs/i);
    assert.equal(await page.isHidden('.sidebar'), true);
    await context.close();
  });

  await test('an admin with real data sees the overview, can switch to Users and Memberships, and pagination reflects what the server actually returned', async () => {
    const context = await withBffContext(browser);
    await context.route('https://bff.test/v1/admin/overview', route => route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({
        contract: 'dda-admin-overview-v1', generated_at: new Date().toISOString(),
        caller: { user_id: 'admin-1', role: 'owner' },
        metrics: {
          active_sessions: { available: true, value: 4, source: 'dda_sessions' },
          memberships_by_status: { available: true, value: { active: 2, canceled: 1 } },
          registered_users_total: { available: false, value: null, reason: 'Not computed.' }
        }
      })
    }));
    await context.route(/https:\/\/bff\.test\/v1\/admin\/users.*page=1/, route => route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({ contract: 'dda-admin-users-v1', page: 1, per_page: 20, total: 1, users: [{ user_id: 'u1', email: 'ada@example.com', display_name: 'Ada', status: 'active', role: 'owner', created_at: '2026-01-01T00:00:00Z', last_sign_in_at: null }] })
    }));
    await context.route(/https:\/\/bff\.test\/v1\/admin\/memberships.*page=1/, route => route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({ contract: 'dda-admin-memberships-v1', page: 1, per_page: 20, items: [{ user_id: 'u1', provider: 'chariow', status: 'active', product_id: 'premium', starts_at: '2026-01-01T00:00:00Z', ends_at: null, updated_at: '2026-01-02T00:00:00Z' }] })
    }));
    const page = await context.newPage();
    await page.goto(ADMIN_BASE);
    await page.waitForSelector('.admin-metric-card');
    assert.equal(await page.isHidden('#admin-gate'), true);
    assert.equal((await page.locator('.admin-metric-card').count()) >= 3, true);

    await page.click('.sidebar .nav-item[data-admin-view="users"]');
    await page.waitForSelector('#admin-users-body tr');
    assert.match(await page.textContent('#admin-users-body'), /ada@example\.com/);
    assert.equal(await page.isDisabled('#admin-users-prev'), true, 'page 1 has no previous page');
    assert.equal(await page.isDisabled('#admin-users-next'), true, 'a page shorter than per_page has no next page');

    // The caller is an owner, so the role cell is an editable control, not just a tag.
    assert.equal(await page.locator('.admin-role-select').count(), 1);
    await context.route('https://bff.test/v1/security/csrf', route => route.fulfill({ status: 204 }));
    let roleRequestBody = null;
    await page.route('https://bff.test/v1/admin/roles', route => {
      roleRequestBody = route.request().postDataJSON();
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ contract: 'dda-admin-roles-v1', user_id: 'u1', role: 'admin' }) });
    });
    await page.selectOption('.admin-role-select', 'admin');
    await page.waitForSelector('#admin-role-feedback[data-kind="success"]');
    assert.deepEqual(roleRequestBody, { user_id: 'u1', role: 'admin' });

    await page.route('https://bff.test/v1/admin/roles/u1', route => route.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify({ code: 'last_owner_protected' }) }));
    await page.selectOption('.admin-role-select', '');
    await page.waitForSelector('#admin-role-feedback[data-kind="error"]');
    assert.equal(await page.inputValue('.admin-role-select'), 'admin', 'a refused change reverts the dropdown rather than showing a role that was never granted');

    await page.click('.sidebar .nav-item[data-admin-view="memberships"]');
    await page.waitForSelector('#admin-memberships-body tr');
    assert.match(await page.textContent('#admin-memberships-body'), /chariow/);
    await context.close();
  });

  await test('an admin (not an owner) sees roles as read-only tags, never an editable control', async () => {
    const context = await withBffContext(browser);
    await context.route('https://bff.test/v1/admin/overview', route => route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({ contract: 'dda-admin-overview-v1', generated_at: new Date().toISOString(), caller: { user_id: 'admin-1', role: 'admin' }, metrics: {} })
    }));
    await context.route(/https:\/\/bff\.test\/v1\/admin\/users.*page=1/, route => route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({ contract: 'dda-admin-users-v1', page: 1, per_page: 20, total: 1, users: [{ user_id: 'u1', email: 'ada@example.com', display_name: 'Ada', status: 'active', role: 'owner', created_at: '2026-01-01T00:00:00Z', last_sign_in_at: null }] })
    }));
    const page = await context.newPage();
    await page.goto(ADMIN_BASE);
    await page.waitForSelector('.admin-metrics');
    await page.click('.sidebar .nav-item[data-admin-view="users"]');
    await page.waitForSelector('#admin-users-body tr');
    assert.equal(await page.locator('.admin-role-select').count(), 0, 'a non-owner must never see a control the server would 403 anyway');
    assert.match(await page.textContent('#admin-users-body'), /owner/);
    await context.close();
  });

  await test('the mobile drawer opens and closes, and the bottom nav switches views, at 390px', async () => {
    const context = await withBffContext(browser);
    await context.route('https://bff.test/v1/admin/overview', route => route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({ contract: 'dda-admin-overview-v1', generated_at: new Date().toISOString(), caller: { user_id: 'admin-1', role: 'admin' }, metrics: {} })
    }));
    const page = await (await context.newPage());
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(ADMIN_BASE);
    await page.waitForSelector('.admin-metrics');
    await page.click('#admin-menu-toggle');
    await page.waitForSelector('#admin-drawer:not([hidden])');
    await page.click('#admin-drawer-close');
    await page.waitForFunction(() => document.getElementById('admin-drawer').hidden === true);
    await page.click('.admin-mobile-nav [data-admin-view="users"]');
    assert.equal(await page.evaluate(() => document.getElementById('admin-view-users').classList.contains('active')), true);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    assert.ok(overflow <= 1, `no horizontal overflow at 390px (got ${overflow}px)`);
    await context.close();
  });

  await browser.close();
  await new Promise(resolve => server.close(resolve));

  console.log(`\n${passed} passed, ${failures.length} failed`);
  if (failures.length) process.exit(1);
})();
