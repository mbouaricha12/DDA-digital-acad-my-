'use strict';
/*
 * DDA — minimal automated regression harness.
 *
 * Context: the Master Build Register described 33+ test files (test_dda_v2..v34,
 * test_e2e_nav_integrity.js, etc.) with over 1200 assertions. None of them exist
 * in this git repository or its history — they were run in ephemeral sessions and
 * never committed. This file is NOT an attempt to reconstruct that suite. It is
 * the minimum real, committed safety net for the surfaces the Acquisition V1
 * tranche actually touches, as directed by the CEO before any core modification:
 * state/migration, visitor/free/premium permissions, #access navigation,
 * signup/onboarding, M0.1, and the existing local event log — plus the new
 * acquisition instrumentation added on top of it.
 *
 * Run with: node tests/run.js
 * Requires Chromium (pre-installed in this environment) via the globally
 * installed `playwright` package — no project-local dependency is added.
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
const PORT = 8743;
const BASE = `http://localhost:${PORT}`;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webmanifest': 'application/manifest+json' };

function startServer() {
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

async function freshContext(browser, viewport) {
  return browser.newContext(viewport ? { viewport } : undefined);
}

async function fillSignup(page, { firstName = 'Ada', email = 'ada@example.com' } = {}) {
  await page.fill('#first-name', firstName);
  await page.fill('#email', email);
  await page.check('#consent');
  await page.click('#signup-form button[type=submit]');
}

async function fillOnboarding(page, { level = 'Débutant', goal = 'Comprendre les marchés', time = '10 minutes par jour' } = {}) {
  await page.selectOption('#level', level);
  await page.selectOption('#goal', goal);
  await page.selectOption('#time', time);
  await page.click('#onboarding-form button[type=submit]');
}

async function completeSignupFlow(page, opts) {
  await page.goto(`${BASE}/#access`);
  await fillSignup(page, opts);
  await fillOnboarding(page, opts);
  // Onboarding submit simulates a short loading delay before navigating to the lesson.
  await page.waitForSelector('.view.active#lesson');
}

(async () => {
  const server = await startServer();
  const browser = await chromium.launch();

  console.log('DDA — Acquisition V1 regression harness\n');
  console.log('-- A. État / migration --');

  await test('emptyState() has the current schema shape', async () => {
    const context = await freshContext(browser);
    const page = await context.newPage();
    await page.goto(`${BASE}/#access`);
    const state = await page.evaluate(() => window.DDA.load());
    assert.equal(state.schemaVersion, 4);
    assert.equal(state.user, null);
    assert.deepEqual(state.lessons, {});
    assert.equal(Array.isArray(state.events), true);
    await context.close();
  });

  await test('legacy v1 flat localStorage payload migrates without loss', async () => {
    const context = await freshContext(browser);
    // Must be seeded before app.js's own boot-time DDA.load()/track() ever writes
    // the current-schema key, or load() would find that key first and never
    // fall back to the legacy one — addInitScript runs before any page script.
    await context.addInitScript(() => {
      localStorage.setItem('dda-prototype-state', JSON.stringify({
        name: 'Ada', email: 'ada@example.com', onboardingComplete: true,
        exerciseComplete: true, quizComplete: true, level: 'Débutant', goal: 'Comprendre les marchés'
      }));
    });
    const page = await context.newPage();
    await page.goto(`${BASE}/#access`);
    const migrated = await page.evaluate(() => window.DDA.load());
    assert.equal(migrated.user.name, 'Ada');
    assert.equal(migrated.user.email, 'ada@example.com');
    assert.equal(migrated.lessons['M0.1'].exerciseComplete, true);
    assert.equal(migrated.lessons['M0.1'].quizComplete, true);
    await context.close();
  });

  await test('event log caps at 50 entries and rejects unknown event names', async () => {
    const context = await freshContext(browser);
    const page = await context.newPage();
    await page.goto(`${BASE}/#access`);
    const result = await page.evaluate(() => {
      let state = window.DDA.load();
      for (let i = 0; i < 60; i++) state = window.DDA.track(state, 'view_opened', { view: 'dashboard' });
      const beforeCount = state.events.length;
      const rejected = window.DDA.track(state, 'totally_made_up_event', { x: '1' });
      return { beforeCount, rejectedCount: rejected.events.length };
    });
    assert.equal(result.beforeCount, 50);
    assert.equal(result.rejectedCount, 50);
    await context.close();
  });

  console.log('\n-- B. Permissions visitor / free / premium --');

  await test('visitor tier cannot access free-tier surfaces', async () => {
    const context = await freshContext(browser);
    const page = await context.newPage();
    await page.goto(`${BASE}/#access`);
    const can = await page.evaluate(() => ({
      dashboard: window.DDA.can({ user: null }, 'dashboard'),
      access: window.DDA.can({ user: null }, 'access')
    }));
    assert.equal(can.dashboard, false);
    assert.equal(can.access, true);
    await context.close();
  });

  await test('free tier can reach free surfaces but not premium-only ones', async () => {
    const context = await freshContext(browser);
    const page = await context.newPage();
    await page.goto(`${BASE}/#access`);
    const can = await page.evaluate(() => {
      const state = { user: { id: 'x' }, membership: { plan: 'free' } };
      return {
        dashboard: window.DDA.can(state, 'dashboard'),
        brokerHub: window.DDA.can(state, 'broker_hub'),
        resourcesPremium: window.DDA.can(state, 'resources_premium')
      };
    });
    assert.equal(can.dashboard, true);
    assert.equal(can.brokerHub, true);
    assert.equal(can.resourcesPremium, false);
    await context.close();
  });

  await test('premium tier unlocks resources_premium and certificate_preview', async () => {
    const context = await freshContext(browser);
    const page = await context.newPage();
    await page.goto(`${BASE}/#access`);
    const can = await page.evaluate(() => {
      const state = { user: { id: 'x' }, membership: { plan: 'premium' } };
      return { resourcesPremium: window.DDA.can(state, 'resources_premium'), certificate: window.DDA.can(state, 'certificate_preview') };
    });
    assert.equal(can.resourcesPremium, true);
    assert.equal(can.certificate, true);
    await context.close();
  });

  console.log('\n-- C. Navigation critique #access --');

  await test('anonymous visitor with no local profile lands on a real entry view (never a fake dashboard)', async () => {
    const context = await freshContext(browser);
    const page = await context.newPage();
    await page.goto(`${BASE}/`);
    const activeId = await page.evaluate(() => document.querySelector('.view.active')?.id);
    assert.notEqual(activeId, 'dashboard');
    await context.close();
  });

  await test('anonymous deep-link straight to #dashboard is redirected to #access (V1.1 regression guard)', async () => {
    const context = await freshContext(browser);
    const page = await context.newPage();
    await page.goto(`${BASE}/#dashboard`);
    const activeId = await page.evaluate(() => document.querySelector('.view.active')?.id);
    assert.equal(activeId, 'access');
    await context.close();
  });

  await test('#access deep-link still renders the real signup form', async () => {
    const context = await freshContext(browser);
    const page = await context.newPage();
    await page.goto(`${BASE}/#access`);
    await page.waitForSelector('#signup-form:not([hidden])');
    assert.equal(await page.isVisible('#first-name'), true);
    await context.close();
  });

  console.log('\n-- D. Création utilisateur / onboarding --');

  await test('completing signup + onboarding creates a local user and lands on the lesson', async () => {
    const context = await freshContext(browser);
    const page = await context.newPage();
    await completeSignupFlow(page);
    const activeId = await page.evaluate(() => document.querySelector('.view.active')?.id);
    const state = await page.evaluate(() => window.DDA.load());
    assert.equal(activeId, 'lesson');
    assert.equal(state.user.name, 'Ada');
    assert.equal(state.onboarding.complete, true);
    await context.close();
  });

  await test('onboarding_complete event is recorded locally', async () => {
    const context = await freshContext(browser);
    const page = await context.newPage();
    await completeSignupFlow(page);
    const events = await page.evaluate(() => window.DDA.load().events.map(e => e.name));
    assert.equal(events.includes('onboarding_complete'), true);
    await context.close();
  });

  console.log('\n-- E. M0.1 (exercice + quiz) --');

  await test('answering the M0.1 exercise correctly unlocks the quiz and marks exerciseComplete', async () => {
    const context = await freshContext(browser);
    const page = await context.newPage();
    await completeSignupFlow(page);
    const correctExercise = page.locator('#lesson [data-question] button[data-correct="true"]').first();
    await correctExercise.scrollIntoViewIfNeeded();
    await correctExercise.click();
    const state = await page.evaluate(() => window.DDA.load());
    assert.equal(state.lessons['M0.1'].exerciseComplete, true);
    await context.close();
  });

  await test('completing the M0.1 quiz correctly marks quizComplete and reveals the result card', async () => {
    const context = await freshContext(browser);
    const page = await context.newPage();
    await completeSignupFlow(page);
    await page.locator('#lesson [data-question] button[data-correct="true"]').first().click();
    const quizButton = page.locator('#quiz-block [data-question] button[data-correct="true"]').first();
    await quizButton.scrollIntoViewIfNeeded();
    await quizButton.click();
    const state = await page.evaluate(() => window.DDA.load());
    assert.equal(state.lessons['M0.1'].quizComplete, true);
    assert.equal(await page.isHidden('#result-card'), false);
    await context.close();
  });

  await browser.close();
  await new Promise(resolve => server.close(resolve));

  console.log(`\n${passed} passed, ${failures.length} failed`);
  if (failures.length) {
    console.log('\nFailures:');
    failures.forEach(f => console.log(`  - ${f.name}: ${f.error.message}`));
    process.exit(1);
  }
})();
