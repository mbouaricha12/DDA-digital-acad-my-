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
    const correctExercise = page.locator('[data-question="exercise"] button[data-correct="true"]').first();
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
    await page.locator('[data-question="exercise"] button[data-correct="true"]').first().click();
    const quizButton = page.locator('#quiz-block [data-question] button[data-correct="true"]').first();
    await quizButton.scrollIntoViewIfNeeded();
    await quizButton.click();
    const state = await page.evaluate(() => window.DDA.load());
    assert.equal(state.lessons['M0.1'].quizComplete, true);
    assert.equal(await page.isHidden('#result-card'), false);
    await context.close();
  });

  console.log('\n-- F. Acquisition V1 — capture --');

  await test('UTM params are captured once into state.acquisition with a pseudonymous visitorId', async () => {
    const context = await freshContext(browser);
    const page = await context.newPage();
    await page.goto(`${BASE}/?utm_source=newsletter&utm_medium=email&utm_campaign=launch#landing`);
    const acquisition = await page.evaluate(() => window.DDA.load().acquisition);
    assert.equal(acquisition.source, 'newsletter');
    assert.equal(acquisition.medium, 'email');
    assert.equal(acquisition.campaign, 'launch');
    assert.equal(typeof acquisition.visitorId, 'string');
    assert.ok(acquisition.visitorId.length > 0);
    await context.close();
  });

  await test('first-touch attribution is preserved across a later visit with different UTM params', async () => {
    const context = await freshContext(browser);
    const page = await context.newPage();
    await page.goto(`${BASE}/?utm_source=newsletter&utm_medium=email&utm_campaign=launch#landing`);
    const first = await page.evaluate(() => window.DDA.load().acquisition);
    await page.goto(`${BASE}/?utm_source=facebook&utm_medium=cpc&utm_campaign=retarget#landing`);
    const second = await page.evaluate(() => window.DDA.load().acquisition);
    assert.equal(second.visitorId, first.visitorId);
    assert.equal(second.source, 'newsletter');
    assert.equal(second.campaign, 'launch');
    await context.close();
  });

  await test('no email, name or PII is ever present in state.acquisition', async () => {
    const context = await freshContext(browser);
    const page = await context.newPage();
    await completeSignupFlow(page, { firstName: 'Ada', email: 'ada@example.com' });
    const acquisition = await page.evaluate(() => window.DDA.load().acquisition);
    const serialized = JSON.stringify(acquisition);
    assert.equal(serialized.includes('ada@example.com'), false);
    assert.equal(serialized.includes('Ada'), false);
    await context.close();
  });

  console.log('\n-- G. Analytics adapter — funnel + data minimization --');

  await test('landing_visit reaches the analytics adapter with only safe acquisition props', async () => {
    const context = await freshContext(browser);
    const page = await context.newPage();
    await page.goto(`${BASE}/?utm_source=newsletter&utm_medium=email&utm_campaign=launch#landing`);
    const queue = await page.evaluate(() => window.DDAAnalytics.getDebugQueue());
    const entry = queue.find(e => e.localName === 'landing_visit');
    assert.ok(entry, 'landing_visit should reach the adapter');
    assert.equal(entry.externalName, 'landing_visit');
    assert.equal(entry.props.source, 'newsletter');
    assert.equal(entry.props.campaign, 'launch');
    assert.equal('level' in entry.props, false);
    assert.equal('goal' in entry.props, false);
    await context.close();
  });

  await test('signup forwards to the adapter as dda_signup without level/goal/name/email', async () => {
    const context = await freshContext(browser);
    const page = await context.newPage();
    await completeSignupFlow(page, { firstName: 'Ada', email: 'ada@example.com' });
    const queue = await page.evaluate(() => window.DDAAnalytics.getDebugQueue());
    const entry = queue.find(e => e.localName === 'onboarding_complete');
    assert.ok(entry, 'onboarding_complete should reach the adapter');
    assert.equal(entry.externalName, 'dda_signup');
    assert.equal('level' in entry.props, false);
    assert.equal('goal' in entry.props, false);
    assert.equal(JSON.stringify(entry).includes('ada@example.com'), false);
    assert.equal(JSON.stringify(entry).includes('Ada'), false);
    await context.close();
  });

  await test('purely local product-analytics events (e.g. exercise_attempt) never reach the external event map', async () => {
    const context = await freshContext(browser);
    const page = await context.newPage();
    await completeSignupFlow(page);
    await page.locator('[data-question="exercise"] button[data-correct="true"]').first().click();
    const queue = await page.evaluate(() => window.DDAAnalytics.getDebugQueue());
    const entry = queue.find(e => e.localName === 'exercise_attempt');
    assert.ok(entry, 'exercise_attempt should have reached the adapter boundary');
    assert.equal(entry.externalName, null, 'exercise_attempt must never be forwarded externally');
    assert.equal(entry.sent, false);
    await context.close();
  });

  await test('activation_v1 fires exactly once, the first time M0.1 quiz completes', async () => {
    const context = await freshContext(browser);
    const page = await context.newPage();
    await completeSignupFlow(page);
    await page.locator('[data-question="exercise"] button[data-correct="true"]').first().click();
    const quizButton = page.locator('#quiz-block [data-question] button[data-correct="true"]').first();
    await quizButton.scrollIntoViewIfNeeded();
    await quizButton.click();
    const state = await page.evaluate(() => window.DDA.load());
    const localActivations = state.events.filter(e => e.name === 'activation_v1');
    const queue = await page.evaluate(() => window.DDAAnalytics.getDebugQueue());
    const forwarded = queue.filter(e => e.localName === 'activation_v1');
    assert.equal(localActivations.length, 1);
    assert.equal(forwarded.length, 1);
    assert.equal(forwarded[0].externalName, 'activation_v1');
    await context.close();
  });

  console.log('\n-- H. Broker Hub --');

  await test('Deriv, HFM, XM and Weltrade are all present with strictly identical structure', async () => {
    const context = await freshContext(browser);
    const page = await context.newPage();
    await completeSignupFlow(page);
    // The app only re-routes via showView() calls (nav clicks), not via hash
    // changes without a full reload (documented navigation debt, DDA_ROUTE_MAP.md)
    // — so reaching #brokers here means clicking the real nav item, like a user.
    await page.click('.nav-item[data-view="brokers"]');
    assert.equal(await page.evaluate(() => document.querySelector('.view.active')?.id), 'brokers');
    const rows = await page.evaluate(() => Array.from(document.querySelectorAll('.broker-row')).map(row => ({
      broker: row.dataset.broker,
      hasVerificationBadge: Boolean(row.querySelector('.verification')),
      hasDetailButton: Boolean(row.querySelector('.broker-detail')),
      featured: row.classList.contains('featured') || row.classList.contains('recommended')
    })));
    const brokers = rows.map(r => r.broker).sort();
    assert.deepEqual(brokers, ['Deriv', 'HFM', 'Weltrade', 'XM']);
    assert.ok(rows.every(r => r.hasVerificationBadge && r.hasDetailButton && !r.featured), 'every broker row must carry the same honest, non-featured treatment');
    await context.close();
  });

  await test('clicking a broker card fires broker_selected with the right broker, never affiliate_link_click', async () => {
    const context = await freshContext(browser);
    const page = await context.newPage();
    await completeSignupFlow(page);
    await page.click('.nav-item[data-view="brokers"]');
    await page.locator('.broker-row[data-broker="XM"] .broker-detail').click();
    const state = await page.evaluate(() => window.DDA.load());
    const selected = state.events.find(e => e.name === 'broker_selected');
    assert.ok(selected);
    assert.equal(selected.metadata.broker, 'XM');
    assert.equal(state.events.some(e => e.name === 'affiliate_link_click'), false);
    await context.close();
  });

  console.log('\n-- I. Landing — public surface --');

  await test('#landing hides sidebar, topbar, mobile nav and the prototype banner', async () => {
    const context = await freshContext(browser);
    const page = await context.newPage();
    await page.goto(`${BASE}/#landing`);
    const visibility = await page.evaluate(() => ({
      sidebar: getComputedStyle(document.querySelector('.sidebar')).display,
      topbar: getComputedStyle(document.querySelector('.topbar')).display,
      mobileNav: getComputedStyle(document.querySelector('.mobile-nav')).display,
      banner: getComputedStyle(document.querySelector('.prototype-banner')).display
    }));
    assert.equal(visibility.sidebar, 'none');
    assert.equal(visibility.topbar, 'none');
    assert.equal(visibility.mobileNav, 'none');
    assert.equal(visibility.banner, 'none');
    await context.close();
  });

  await test('#access still shows its chrome as before (landing does not leak into other views)', async () => {
    const context = await freshContext(browser);
    const page = await context.newPage();
    await page.goto(`${BASE}/#access`);
    const topbarDisplay = await page.evaluate(() => getComputedStyle(document.querySelector('.topbar')).display);
    assert.notEqual(topbarDisplay, 'none');
    await context.close();
  });

  await test('a first-time anonymous visitor with no hash lands on #landing, and its CTA reaches #access', async () => {
    const context = await freshContext(browser);
    const page = await context.newPage();
    await page.goto(`${BASE}/`);
    assert.equal(await page.evaluate(() => document.querySelector('.view.active')?.id), 'landing');
    await page.click('#landing [data-view="access"]');
    assert.equal(await page.evaluate(() => document.querySelector('.view.active')?.id), 'access');
    await context.close();
  });

  console.log('\n-- J. Full funnel proof: landing → access → onboarding → M0.1 → activation --');

  await test('a single visitorId is traceable end-to-end through the full acquisition funnel', async () => {
    const context = await freshContext(browser);
    const page = await context.newPage();

    await page.goto(`${BASE}/?utm_source=youtube&utm_medium=video&utm_campaign=m0-launch#landing`);
    await page.click('#landing [data-view="access"]');
    await fillSignup(page, { firstName: 'Fatou', email: 'fatou@example.com' });
    await fillOnboarding(page);
    await page.waitForSelector('.view.active#lesson');
    await page.click('.nav-item[data-view="brokers"]');
    await page.locator('.broker-row[data-broker="Deriv"] .broker-detail').click();
    await page.click('.nav-item[data-view="lesson"]');
    await page.locator('[data-question="exercise"] button[data-correct="true"]').first().click();
    const quizButton = page.locator('#quiz-block [data-question] button[data-correct="true"]').first();
    await quizButton.scrollIntoViewIfNeeded();
    await quizButton.click();

    const { visitorId, queue } = await page.evaluate(() => ({
      visitorId: window.DDA.load().acquisition.visitorId,
      queue: window.DDAAnalytics.getDebugQueue()
    }));

    const forwardedNames = queue.filter(e => e.externalName).map(e => e.externalName);
    assert.ok(forwardedNames.includes('landing_visit'));
    assert.ok(forwardedNames.includes('dda_signup'));
    assert.ok(forwardedNames.includes('broker_selected'));
    assert.ok(forwardedNames.includes('activation_v1'));
    assert.equal(forwardedNames.includes('affiliate_link_click'), false);

    const funnelEvents = queue.filter(e => e.externalName);
    assert.ok(funnelEvents.every(e => e.distinctId === visitorId), 'every funnel event must carry the same visitorId');
    assert.ok(funnelEvents.every(e => !JSON.stringify(e).includes('fatou@example.com') && !JSON.stringify(e).includes('Fatou')), 'no PII may ever reach the adapter');

    const order = forwardedNames.filter(n => ['landing_visit', 'dda_signup', 'broker_selected', 'activation_v1'].includes(n));
    assert.deepEqual(order, ['landing_visit', 'dda_signup', 'broker_selected', 'activation_v1'], 'funnel steps must be recorded in the real order they happened');

    await context.close();
  });


  console.log('\n-- K. Fin du curriculum authored — cohérence M1 complète --');

  await test('M1.2 completed leaves no phantom lesson and keeps M2 honestly coming soon', async () => {
    const context = await freshContext(browser);
    await context.addInitScript(() => {
      const done = { lessonViewed: true, exerciseComplete: true, quizComplete: true };
      localStorage.setItem('dda-prototype-state-v4', JSON.stringify({
        schemaVersion: 4,
        user: { id: 'complete-path', name: 'Ada', email: 'ada@example.com', mode: 'device-demo' },
        membership: { plan: 'free', status: 'demo' },
        onboarding: { level: 'Débutant', goal: 'Comprendre les marchés', time: '10 minutes par jour', complete: true },
        lessons: {
          'M0.1': done,
          'M0.2': done,
          'M0.3': done,
          'M1.1': done,
          'M1.2': done
        },
        journal: { entries: [], plan: {} },
        preferences: { lowData: false, reminders: false },
        events: [],
        acquisition: {},
        updatedAt: null
      }));
    });
    const page = await context.newPage();
    await page.goto(`${BASE}/#dashboard`);

    const productState = await page.evaluate(() => ({
      active: document.querySelector('.view.active')?.id,
      next: window.DDALearning.nextActionable(window.DDA.curriculum, window.DDA.load()),
      m0: window.DDALearning.moduleStatus(window.DDA.curriculum, 'M0', window.DDA.load()),
      m1: window.DDALearning.moduleStatus(window.DDA.curriculum, 'M1', window.DDA.load()),
      m2: window.DDALearning.moduleStatus(window.DDA.curriculum, 'M2', window.DDA.load()),
      terminalTitle: document.getElementById('terminal-lead-title')?.textContent?.trim(),
      terminalIndex: document.getElementById('lesson-index-label')?.textContent?.trim(),
      primaryView: document.getElementById('lesson-primary-action')?.dataset?.view,
      progressNext: document.getElementById('progress-next-step')?.textContent?.trim()
    }));

    assert.equal(productState.active, 'dashboard');
    assert.equal(productState.next, null, 'there must be no fabricated next lesson after M1.2');
    assert.equal(productState.m0, 'completed');
    assert.equal(productState.m1, 'completed');
    assert.equal(productState.m2, 'coming_soon');
    assert.equal(productState.terminalTitle, 'Toutes les leçons disponibles sont validées.');
    assert.ok(productState.terminalIndex.includes('M0') && productState.terminalIndex.includes('M1'), 'Terminal completion label must reflect both completed authored modules');
    assert.equal(productState.primaryView, 'journal', 'with an empty journal, the honest daily action is Journal — not a phantom lesson');
    assert.equal(productState.progressNext, 'Toutes les leçons disponibles sont validées. Ton prochain module sera bientôt disponible.');

    await page.click('.nav-item[data-view="path"]');
    const pathState = await page.evaluate(() => ({
      active: document.querySelector('.view.active')?.id,
      module: document.querySelector('.journey-current-tag')?.textContent?.trim(),
      why: document.querySelector('.journey-current-why')?.textContent?.trim(),
      target: document.querySelector('.journey-current')?.dataset?.view
    }));
    assert.equal(pathState.active, 'path');
    assert.equal(pathState.module, 'Comprendre les marchés financiers');
    assert.ok(pathState.why.includes('Compétence validée'));
    assert.equal(pathState.target, 'lesson-m12', 'Parcours review target must be the last real authored lesson');

    await page.reload();
    assert.equal(await page.evaluate(() => window.DDALearning.nextActionable(window.DDA.curriculum, window.DDA.load())), null, 'completion state must survive reload');
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
