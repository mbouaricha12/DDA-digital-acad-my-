'use strict';

const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const DIST = path.join(__dirname, '..', 'dist');
const userA = { user_id: 'user-a', email: 'a@example.com', display_name: 'Amina A', email_verified: true, status: 'active', entitlements: [] };
const userB = { user_id: 'user-b', email: 'b@example.com', display_name: 'Benoit B', email_verified: true, status: 'active', entitlements: [] };

function startStaticServer() {
  return new Promise(resolve => {
    const server = http.createServer((req, res) => {
      const requested = req.url.split('?')[0] || '/';
      const file = requested === '/' ? path.join(DIST, 'academy.html') : path.join(DIST, requested.replace(/^\/+/, ''));
      if (!file.startsWith(`${DIST}${path.sep}`) || !fs.existsSync(file)) { res.writeHead(404); return res.end('not found'); }
      res.writeHead(200, { 'Content-Type': file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : 'text/html' });
      res.end(fs.readFileSync(file));
    });
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

(async () => {
  const server = await startStaticServer();
  const browser = await chromium.launch({ headless: true });
  let activeUser = userA;
  try {
    const page = await browser.newPage();
    await page.addInitScript(() => {
      window.DDA_BFF_BASE_URL = 'http://bff.test';
      localStorage.setItem('dda-prototype-state-v4', JSON.stringify({
        schemaVersion: 4, user: { name: 'Ancien compte', email: 'old@example.com' }, membership: { plan: 'free', status: 'demo' },
        onboarding: { complete: true, level: 'Débutant', goal: 'Comprendre les marchés', time: '10 minutes par jour' }, lessons: {}, terminal: { instrument: 'BRVM Composite', timeframe: '1D', zoom: 1, pan: 0, drawings: [], observation: '', practice: null },
        journal: { entries: [], plan: {} }, premium: { trackId: null, modules: {}, labs: {}, assessments: {}, proofs: {}, reviews: {} }, preferences: { lowData: false, reminders: false }, events: [], acquisition: {}, updatedAt: null
      }));
    });
    await page.route('http://bff.test/**', async route => {
      const request = route.request();
      const url = new URL(request.url());
      const cors = { 'access-control-allow-origin': 'http://127.0.0.1:' + server.address().port, 'access-control-allow-credentials': 'true' };
      if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
      if (url.pathname === '/v1/me' && request.method() === 'GET') return route.fulfill({ status: activeUser ? 200 : 401, headers: { ...cors, 'content-type': 'application/json' }, body: activeUser ? JSON.stringify(activeUser) : JSON.stringify({ code: 'unauthenticated' }) });
      if (url.pathname === '/v1/auth/logout' || url.pathname === '/v1/auth/login' || url.pathname === '/v1/security/csrf') return route.fulfill({ status: 204, headers: cors });
      return route.fulfill({ status: 404, headers: cors, body: '{}' });
    });
    const origin = `http://127.0.0.1:${server.address().port}`;
    await page.goto(`${origin}/academy.html#profile`);
    await page.waitForFunction(() => document.querySelector('#profile-heading-name')?.textContent === 'Amina A');
    assert.equal(await page.locator('#profile-heading-email').innerText(), 'a@example.com');
    assert.equal(await page.locator('#dashboard-name').innerText(), 'Amina A');

    activeUser = null;
    await page.evaluate(() => window.DDABFF.logout());
    activeUser = userB;
    await page.evaluate(() => window.DDABFF.login({ email: 'b@example.com', password: 'long-enough-password' }));
    await page.reload();
    await page.waitForFunction(() => document.querySelector('#profile-heading-name')?.textContent === 'Benoit B');
    assert.equal(await page.locator('#profile-heading-email').innerText(), 'b@example.com');
    assert.equal(await page.locator('#dashboard-name').innerText(), 'Benoit B');
    assert.doesNotMatch(await page.locator('body').innerText(), /Amina A/);
    console.log('Authenticated identity switch E2E: PASS');
  } finally {
    await browser.close();
    server.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
