'use strict';
/*
 * DDA — Playwright product regression harness.
 *
 * Context: the Master Build Register described 33+ test files (test_dda_v2..v34,
 * test_e2e_nav_integrity.js, etc.) with over 1200 assertions. None of them exist
 * in this git repository or its history — they were run in ephemeral sessions and
 * never committed. The committed safety net now covers state/migration,
 * visitor/free/premium permissions, deep-link routing, signup/onboarding, M0.1,
 * acquisition events, fail-closed local forms, profile-reset navigation purge,
 * Terminal practice, Journal proof handoff, responsive touch targets, and the
 * authored-curriculum completion state. Scenarios use real
 * browser actions; local learner fixtures seed once per page context so reloads
 * test persistence rather than resetting the state.
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
const ACADEMY_BASE = `${BASE}/academy.html`;
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
    if (error.stack) console.log(error.stack.split('\n').slice(1, 3).map(line => `    ${line.trim()}`).join('\n'));
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
  await page.goto(`${ACADEMY_BASE}#access`);
  await fillSignup(page, opts);
  await fillOnboarding(page, opts);
  // Onboarding submit simulates a short loading delay before navigating to the lesson.
  await page.waitForSelector('.view.active#lesson');
}

async function seedLocalLearner(context, lessonProgress = {}, membershipPlan = 'free') {
  await context.addInitScript(({ lessons, plan }) => {
    if (localStorage.getItem('dda-prototype-state-v4')) return;
    const lessonIds = ['M0.1', 'M0.2', 'M0.3', 'M1.1', 'M1.2', 'M1.3'];
    const progress = Object.fromEntries(lessonIds.map(id => [id, {
      lessonViewed: false, exerciseComplete: false, quizComplete: false, ...(lessons[id] || {})
    }]));
    localStorage.setItem('dda-prototype-state-v4', JSON.stringify({
      schemaVersion: 4,
      user: { id: 'e2e-learner', name: 'Ada', email: 'ada@example.com', mode: 'device-demo' },
      membership: { plan, status: 'demo' },
      onboarding: { level: 'Débutant', goal: 'Comprendre les marchés', time: '10 minutes par jour', complete: true },
      lessons: progress,
      journal: { entries: [], plan: {} },
      preferences: { lowData: false, reminders: false },
      terminal: {},
      events: [],
      acquisition: {},
      updatedAt: null
    }));
  }, { lessons: lessonProgress, plan: membershipPlan });
}

(async () => {
  const server = await startServer();
  const browser = await chromium.launch();

  console.log('DDA — Acquisition V1 regression harness\n');
  console.log('-- A. État / migration --');

  await test('emptyState() has the current schema shape', async () => {
    const context = await freshContext(browser);
    const page = await context.newPage();
    await page.goto(`${ACADEMY_BASE}#access`);
    const state = await page.evaluate(() => window.DDA.load());
    assert.equal(state.schemaVersion, 4);
    assert.equal(state.user, null);
    assert.deepEqual(state.lessons, {});
    assert.equal(Array.isArray(state.events), true);
    await context.close();
  });

  await test('local forms fail closed without JavaScript and activate after their handlers bind', async () => {
    const disabledContext = await browser.newContext({ javaScriptEnabled: false });
    const disabledPage = await disabledContext.newPage();
    await disabledPage.goto(`${ACADEMY_BASE}#access`);
    const withoutJs = await disabledPage.evaluate(() => ({
      forms: [...document.querySelectorAll('form[data-js-submit]')].map(form => ({ method: form.method, disabled: form.querySelector('button[type="submit"]')?.disabled })),
      referrerPolicy: document.querySelector('meta[name="referrer"]')?.content
    }));
    assert.equal(withoutJs.forms.length, 6, 'all six local-submit forms must be marked fail-closed');
    assert.ok(withoutJs.forms.every(form => form.method === 'dialog' && form.disabled), 'forms cannot GET-fallback or submit before JavaScript is ready');
    assert.equal(withoutJs.referrerPolicy, 'no-referrer');
    assert.equal(await disabledPage.evaluate(() => document.querySelectorAll('link[href*="fonts.googleapis.com"], link[href*="fonts.gstatic.com"]').length), 0);
    await disabledContext.close();

    const enabledContext = await freshContext(browser);
    const enabledPage = await enabledContext.newPage();
    await enabledPage.goto(`${ACADEMY_BASE}#access`);
    const enabled = await enabledPage.evaluate(() => [...document.querySelectorAll('form[data-js-submit] button[type="submit"]')].map(button => button.disabled));
    assert.equal(enabled.length, 6);
    assert.ok(enabled.every(value => value === false), 'handlers must be installed before submit controls become active');
    await enabledContext.close();
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
    await page.goto(`${ACADEMY_BASE}#access`);
    const migrated = await page.evaluate(() => window.DDA.load());
    assert.equal(migrated.user.name, 'Ada');
    assert.equal(migrated.user.email, 'ada@example.com');
    assert.equal(migrated.lessons['M0.1'].exerciseComplete, true);
    assert.equal(migrated.lessons['M0.1'].quizComplete, true);
    const migratedKeys = await page.evaluate(() => ({
      v4: localStorage.getItem('dda-prototype-state-v4'),
      legacy: ['dda-prototype-state-v3', 'dda-prototype-state-v2', 'dda-prototype-state'].map(key => localStorage.getItem(key))
    }));
    assert.ok(migratedKeys.v4, 'a successful migration must commit the normalized v4 state');
    assert.deepEqual(migratedKeys.legacy, [null, null, null], 'legacy copies are deleted only after the v4 commit');
    await context.close();
  });

  await test('legacy storage is preserved when the v4 migration write fails', async () => {
    const context = await freshContext(browser);
    await context.addInitScript(() => {
      localStorage.setItem('dda-prototype-state', JSON.stringify({ name: 'Ada', email: 'ada@example.com' }));
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key, value) {
        if (key === 'dda-prototype-state-v4') throw new DOMException('quota', 'QuotaExceededError');
        return original.call(this, key, value);
      };
    });
    const page = await context.newPage();
    await page.goto(`${ACADEMY_BASE}#access`);
    const keys = await page.evaluate(() => ({
      v4: localStorage.getItem('dda-prototype-state-v4'),
      legacy: localStorage.getItem('dda-prototype-state')
    }));
    assert.equal(keys.v4, null, 'the simulated failed migration must not create a partial v4 record');
    assert.ok(keys.legacy, 'legacy data must remain recoverable when the v4 write fails');
    await context.close();
  });

  await test('profile reset purges remembered navigation and no previous view returns after reload', async () => {
    const context = await freshContext(browser);
    await context.addInitScript(() => {
      localStorage.setItem('dda-prototype-state-v4', JSON.stringify({
        schemaVersion: 4,
        user: { id: 'reset-user', name: 'Private Name', email: 'private@example.com', mode: 'device-demo' },
        membership: { plan: 'free', status: 'demo' },
        onboarding: { level: 'Débutant', goal: 'Comprendre les marchés', time: '10 minutes par jour', complete: true },
        lessons: {}, journal: { entries: [], plan: {} }, preferences: {}, events: [], acquisition: {}, updatedAt: null
      }));
      if (!sessionStorage.getItem('__profile_reset_test_seeded')) {
        sessionStorage.setItem('dda-nav-previous-view', 'journal');
        sessionStorage.setItem('__profile_reset_test_seeded', '1');
      }
    });
    const page = await context.newPage();
    await page.goto(`${ACADEMY_BASE}#profile`);
    await page.click('#profile-reset');
    const afterReset = await page.evaluate(() => ({
      previous: sessionStorage.getItem('dda-nav-previous-view'),
      text: localStorage.getItem('dda-prototype-state-v4') || '',
      active: document.querySelector('.view.active')?.id
    }));
    assert.equal(afterReset.previous, null, 'session-only back navigation is part of a full profile reset');
    assert.equal(afterReset.text.includes('private@example.com'), false);
    assert.equal(afterReset.text.includes('Private Name'), false);
    assert.equal(afterReset.active, 'access');
    await page.reload();
    assert.equal(await page.evaluate(() => document.querySelector('.view.active')?.id), 'access');
    assert.equal(await page.evaluate(() => sessionStorage.getItem('dda-nav-previous-view')), null);
    await context.close();
  });

  await test('event log caps at 50 entries and rejects unknown event names', async () => {
    const context = await freshContext(browser);
    const page = await context.newPage();
    await page.goto(`${ACADEMY_BASE}#access`);
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
    await page.goto(`${ACADEMY_BASE}#access`);
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
    await page.goto(`${ACADEMY_BASE}#access`);
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

  await test('free tier does not receive authored P2 content before local Premium preview', async () => {
    const context = await freshContext(browser, { width: 390, height: 844 });
    await seedLocalLearner(context, {}, 'free');
    const page = await context.newPage();
    await page.goto(`${ACADEMY_BASE}#premium-track`);
    const freeContent = await page.locator('#lesson-p21-main').innerText();
    assert.equal(freeContent.includes('Before the trade, define the risk.'), false, 'authored P2 content must not be mounted for Free');
    await page.click('#gate-unlock');
    await page.waitForTimeout(50);
    assert.equal(await page.evaluate(() => location.hash), '#premium-track');
    assert.equal((await page.locator('#lesson-p21-main').innerText()).includes('Before the trade, define the risk.'), true, 'Premium Demo mounts the authored lesson after preview activation');
    await context.close();
  });

  await test('Premium P2 completes lesson → lab → assessment → proof → progression → Journal with reloads', async () => {
    const context = await freshContext(browser, { width: 390, height: 844 });
    await seedLocalLearner(context, {}, 'premium');
    const page = await context.newPage();
    await page.goto(`${ACADEMY_BASE}#premium-track`);
    assert.equal(await page.locator('#premium-track').isVisible(), true);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'Premium Track must not overflow on mobile');

    await page.click('#premium-track [data-view="lesson-p21"]');
    await page.reload();
    assert.equal(await page.locator('#lesson-p21').isVisible(), true, 'P2.1 deep-link survives reload for Premium Demo');
    await page.locator('[data-question="p21-decision"] button[data-correct="true"]').click();
    await page.locator('[data-question="p21-quiz"] button[data-correct="true"]').click();
    let state = await page.evaluate(() => window.DDA.load());
    assert.equal(state.lessons['P2.1'].exerciseComplete, true);
    assert.equal(state.lessons['P2.1'].quizComplete, true);

    await page.locator('#lesson-p21 [data-view="lesson-p22"]').last().click();
    await page.reload();
    assert.equal(await page.locator('#lesson-p22').isVisible(), true, 'P2.2 opens only after P2.1 and survives reload');
    await page.locator('[data-question="p22-sequence"] button[data-correct="true"]').click();
    await page.locator('[data-question="p22-quiz"] button[data-correct="true"]').click();
    state = await page.evaluate(() => window.DDA.load());
    assert.equal(state.lessons['P2.2'].exerciseComplete, true);
    assert.equal(state.lessons['P2.2'].quizComplete, true);

    await page.locator('#lesson-p22 [data-view="premium-lab"]').last().click();
    await page.reload();
    assert.equal(await page.locator('#premium-lab').isVisible(), true);
    await page.selectOption('#p2-direction', 'Long');
    await page.fill('#p2-setup', 'The support zone matches the controlled bullish setup context.');
    await page.fill('#p2-entry', 'Wait for a clear reaction before considering an entry.');
    await page.fill('#p2-invalidation', 'The bullish hypothesis is invalid if the support structure fails clearly.');
    await page.fill('#p2-risk', '50');
    await page.fill('#p2-target', 'Review the scenario after a coherent move away from the zone.');
    await page.fill('#p2-no-trade', 'Do not trade when the invalidation or entry condition cannot be defined.');
    await page.locator('#premium-lab-form button[type="submit"]').click();
    state = await page.evaluate(() => window.DDA.load());
    assert.equal(state.premium.labs['p2-risk-plan'].status, 'validated');
    assert.ok((await page.locator('#premium-lab-feedback').textContent()).includes('Good'));

    await page.click('#premium-lab [data-view="premium-track"]');
    await page.click('#premium-track [data-view="premium-assessment"]');
    await page.waitForSelector('#premium-assessment.view.active');
    const assessmentLabels = page.locator('#premium-assessment.view.active label');
    await assessmentLabels.filter({ hasText: 'Entrer avec une petite position.' }).click();
    await assessmentLabels.filter({ hasText: 'Ne pas exécuter dans ces conditions' }).click();
    await assessmentLabels.filter({ hasText: 'Le trade peut être perdant tout en étant correctement exécuté.' }).click();
    await assessmentLabels.filter({ hasText: 'Trader B : perdant, setup valide' }).click();
    await page.locator('#premium-assessment-form button[type="submit"]').click();
    state = await page.evaluate(() => window.DDA.load());
    assert.equal(state.premium.assessments['p2-controlled-decision'].passed, false);
    assert.equal(state.premium.assessments['p2-controlled-decision'].attempts, 1);
    await assessmentLabels.filter({ hasText: 'Attendre de pouvoir définir clairement' }).click();
    await page.locator('#premium-assessment-form button[type="submit"]').click();
    state = await page.evaluate(() => window.DDA.load());
    assert.equal(state.premium.assessments['p2-controlled-decision'].passed, true);
    assert.equal(state.premium.assessments['p2-controlled-decision'].attempts, 2);
    assert.equal(state.premium.proofs['p2-risk-foundations'].level, 'Level 3 — Apply');

    await page.reload();
    assert.equal(await page.locator('#premium-proof-receipt').isVisible(), true, 'proof receipt survives assessment reload');
    await page.click('#p2-journal-bridge');
    assert.equal(await page.evaluate(() => location.hash), '#journal');
    assert.equal(await page.locator('#journal-composer').isVisible(), true);
    assert.equal(await page.locator('#journal-market').inputValue(), 'XAUUSD — scénario synthétique');
    assert.ok((await page.locator('#journal-context').inputValue()).includes('support zone'));
    await page.click('#journal-step-next');
    await page.click('#journal-step-next');
    await page.click('#journal-step-save');
    state = await page.evaluate(() => window.DDA.load());
    assert.equal(state.journal.entries.length, 1);
    assert.equal(state.journal.entries[0].sourceLesson, 'P2.2');
    assert.equal(state.journal.entries[0].proofId, 'p2-risk-foundations');

    await page.reload();
    assert.equal(await page.locator('#journal-list details').count(), 1, 'Journal entry survives reload');
    await page.click('.mobile-nav button[data-view="progress"]');
    const proofProgress = await page.locator('#premium-proof-progress').innerText();
    assert.ok(proofProgress.includes('Risk Foundations'));
    assert.ok(proofProgress.includes('Level 3 — Apply'));
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'Progression must not overflow on mobile');
    await context.close();
  });

  await test('premium tier unlocks resources_premium and certificate_preview', async () => {
    const context = await freshContext(browser);
    const page = await context.newPage();
    await page.goto(`${ACADEMY_BASE}#access`);
    const can = await page.evaluate(() => {
      const state = { user: { id: 'x' }, membership: { plan: 'premium' } };
      return { resourcesPremium: window.DDA.can(state, 'resources_premium'), certificate: window.DDA.can(state, 'certificate_preview') };
    });
    assert.equal(can.resourcesPremium, true);
    assert.equal(can.certificate, true);
    await context.close();
  });

  await test('Weekly Review stays locked for Free and persists a Premium local review', async () => {
    const freeContext = await freshContext(browser, { width: 390, height: 844 });
    await seedLocalLearner(freeContext, {}, 'free');
    const freePage = await freeContext.newPage();
    await freePage.goto(`${ACADEMY_BASE}#journal`);
    await freePage.click('#weekly-review-open');
    assert.equal(await freePage.locator('#weekly-review-locked').isVisible(), true);
    assert.equal(await freePage.locator('#weekly-review-content').isVisible(), false);
    await freeContext.close();

    const premiumContext = await freshContext(browser, { width: 390, height: 844 });
    await seedLocalLearner(premiumContext, {}, 'premium');
    const premiumPage = await premiumContext.newPage();
    await premiumPage.goto(`${ACADEMY_BASE}#journal`);
    await premiumPage.evaluate(() => {
      let state = window.DDA.load();
      state = window.DDA.addJournalEntry(state, { market: 'XAUUSD', context: 'Support zone observed.', scenario: 'Wait for confirmation.', process: 'Checklist before decision.', decision: 'No trade until invalidation is clear.', outcome: 'Observation retained.', whatWorked: 'Risk boundary written first.', toImprove: 'Describe the trigger more clearly.' });
      state = window.DDA.addJournalEntry(state, { market: 'BRVM Composite', context: 'Range observed.', scenario: 'Study the structure.', process: 'Context before conclusion.', decision: 'Continue observing.', outcome: 'No execution.', note: 'Local learning trace.' });
      window.DDA.save(state);
    });
    await premiumPage.reload();
    await premiumPage.click('#weekly-review-open');
    assert.equal(await premiumPage.locator('#weekly-review-content').isVisible(), true);
    assert.ok((await premiumPage.locator('#weekly-review-evidence').innerText()).includes('2'));
    await premiumPage.fill('#weekly-review-strength', 'J’ai gardé le risque et le contexte visibles avant toute décision.');
    await premiumPage.fill('#weekly-review-pattern', 'Je dois mieux décrire les conditions qui invalident le scénario.');
    await premiumPage.fill('#weekly-review-focus', 'Observer une décision complète avant de conclure.');
    await premiumPage.fill('#weekly-review-next-action', 'Relire ma checklist avant chaque nouvelle observation.');
    await premiumPage.click('#weekly-review-save');
    let state = await premiumPage.evaluate(() => window.DDA.load());
    assert.equal(state.premium.reviews['weekly-review'].status, 'completed');
    assert.equal(state.premium.reviews['weekly-review'].entryCount, 2);
    await premiumPage.reload();
    assert.equal(await premiumPage.evaluate(() => window.DDA.load().premium.reviews['weekly-review']?.status), 'completed');
    await premiumPage.click('#weekly-review-open');
    assert.equal((await premiumPage.locator('#weekly-review-status').textContent()).trim(), 'Enregistrée');
    assert.ok((await premiumPage.locator('#weekly-review-focus').inputValue()).includes('Observer une décision'));
    assert.equal(await premiumPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await premiumContext.close();
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
    await page.goto(`${ACADEMY_BASE}#dashboard`);
    const activeId = await page.evaluate(() => document.querySelector('.view.active')?.id);
    assert.equal(activeId, 'access');
    await context.close();
  });

  await test('#access deep-link still renders the real signup form', async () => {
    const context = await freshContext(browser);
    const page = await context.newPage();
    await page.goto(`${ACADEMY_BASE}#access`);
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

  await test('custom onboarding select supports keyboard selection, Escape and native form state', async () => {
    const context = await freshContext(browser);
    const page = await context.newPage();
    await page.goto(`${ACADEMY_BASE}#access`);
    await fillSignup(page);
    await page.waitForSelector('#onboarding-form:not([hidden])');

    const wrapper = page.locator('[data-select-for="level"]');
    const trigger = wrapper.locator('.dda-select-trigger');
    await trigger.focus();
    await page.keyboard.press('ArrowDown');
    await page.waitForSelector('#level-dda-menu[role="listbox"]');
    assert.equal(await wrapper.locator('.dda-select-menu').isVisible(), true);
    await page.waitForFunction(() => document.activeElement?.matches('.dda-select-option'));
    assert.equal(await page.evaluate(() => document.activeElement?.textContent), 'Débutant', 'ArrowDown opens the list and focuses the next option');
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('#level').inputValue(), 'Débutant', 'custom option updates the native select used by form validation');
    assert.equal(await trigger.getAttribute('aria-expanded'), 'false');

    await trigger.focus();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Escape');
    assert.equal(await trigger.getAttribute('aria-expanded'), 'false', 'Escape closes the listbox');
    await page.waitForFunction(() => getComputedStyle(document.querySelector('#level-dda-menu')).visibility === 'hidden');
    assert.equal(await wrapper.locator('.dda-select-menu').isVisible(), false);
    await context.close();
  });

  await test('mobile onboarding dropdown bottom sheet stays above the fixed navigation', async () => {
    const context = await freshContext(browser, { width: 390, height: 844 });
    const page = await context.newPage();
    await page.goto(`${ACADEMY_BASE}#access`);
    await fillSignup(page);
    await page.waitForSelector('#onboarding-form:not([hidden])');
    const wrapper = page.locator('[data-select-for="goal"]');
    await wrapper.locator('.dda-select-trigger').click();
    await page.waitForTimeout(220);
    const geometry = await page.evaluate(() => {
      const menu = document.querySelector('[data-select-for="goal"] .dda-select-menu');
      const nav = document.querySelector('.mobile-nav');
      const menuBox = menu.getBoundingClientRect();
      const navBox = nav.getBoundingClientRect();
      return { position: getComputedStyle(menu).position, menuBottom: menuBox.bottom, navTop: navBox.top, visible: getComputedStyle(menu).visibility === 'visible' };
    });
    assert.equal(geometry.position, 'fixed');
    assert.equal(geometry.visible, true);
    assert.ok(geometry.menuBottom <= geometry.navTop, `dropdown must stay above mobile navigation: ${JSON.stringify(geometry)}`);
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
    await page.goto(`${BASE}/?utm_source=newsletter&utm_medium=email&utm_campaign=launch-2026-09-27#landing`);
    const acquisition = await page.evaluate(() => window.DDA.load().acquisition);
    assert.equal(acquisition.source, 'newsletter');
    assert.equal(acquisition.medium, 'email');
    assert.equal(acquisition.campaign, 'launch-2026-09-27');
    assert.equal(typeof acquisition.visitorId, 'string');
    assert.ok(acquisition.visitorId.length > 0);
    await context.close();
  });

  await test('acquisition keeps only known route fragments and scrubs query values from the address bar', async () => {
    const context = await freshContext(browser);
    const page = await context.newPage();
    await page.goto(`${BASE}/?utm_source=ada%40example.com&utm_campaign=launch#landing`);
    const result = await page.evaluate(() => {
      const state = window.DDA.load();
      const unsafe = window.DDA.save({ ...state, acquisition: { ...state.acquisition, landingPath: '#richard-darius@example.com', visitorId: 'ada@example.com' } });
      const safe = window.DDA.save({ ...unsafe, acquisition: { ...unsafe.acquisition, landingPath: '#lesson-m02' } });
      return {
        url: location.href,
        query: location.search,
        capturedRoute: state.acquisition.landingPath,
        unsafeRoute: unsafe.acquisition.landingPath,
        unsafeVisitorId: unsafe.acquisition.visitorId,
        safeRoute: safe.acquisition.landingPath
      };
    });
    assert.equal(result.query, '', 'captured UTM parameters must not remain in the address bar');
    assert.equal(result.url.includes('ada%40example.com'), false, 'the address bar must not retain an email-like attribution value');
    assert.equal(result.capturedRoute, '#landing');
    assert.equal(result.unsafeRoute, null, 'arbitrary fragments are not persisted as acquisition data');
    assert.equal(result.unsafeVisitorId, null, 'caller-controlled PII cannot become an analytics identifier');
    assert.equal(result.safeRoute, '#lesson-m02', 'a known product route remains available for attribution');
    await context.close();
  });

  await test('UTM values containing an email or phone number are omitted before state persistence and analytics props', async () => {
    const context = await freshContext(browser);
    const page = await context.newPage();
    await page.goto(`${BASE}/?utm_source=ada%40example.com&utm_medium=email&utm_campaign=tel-2250700000000-launch-2026-09-27#landing`);
    const { acquisition, entry } = await page.evaluate(() => ({
      acquisition: window.DDA.load().acquisition,
      entry: window.DDAAnalytics.getDebugQueue().find(event => event.localName === 'landing_visit')
    }));
    assert.equal(acquisition.source, null, 'email-like UTM source must not be persisted');
    assert.equal(acquisition.medium, 'email');
    assert.equal(acquisition.campaign, null, 'a phone number embedded in a campaign label must not be persisted');
    assert.equal(JSON.stringify(acquisition).includes('ada@example.com'), false);
    assert.equal(JSON.stringify(acquisition).includes('2250700000000'), false);
    assert.ok(entry, 'landing_visit should reach the analytics adapter');
    assert.equal('source' in entry.props, false);
    assert.equal(entry.props.medium, 'email');
    assert.equal('campaign' in entry.props, false);
    assert.equal(JSON.stringify(entry).includes('ada@example.com'), false);
    assert.equal(JSON.stringify(entry).includes('2250700000000'), false);
    await context.close();
  });

  await test('unrecognized free-text attribution values are rejected even when they contain no email or phone', async () => {
    const context = await freshContext(browser);
    const page = await context.newPage();
    await page.goto(`${BASE}/?utm_source=Richard&utm_medium=email&utm_campaign=richard-project#landing`);
    const result = await page.evaluate(() => ({
      acquisition: window.DDA.load().acquisition,
      event: window.DDAAnalytics.getDebugQueue().find(entry => entry.localName === 'landing_visit')
    }));
    assert.equal(result.acquisition.source, null, 'a free-text name is not a source taxonomy value');
    assert.equal(result.acquisition.campaign, null, 'unapproved campaign strings are not persisted');
    assert.equal(result.event.props.source, undefined, 'analytics repeats the allowlist at the transport boundary');
    assert.equal(result.event.props.campaign, undefined);
    assert.equal(result.event.props.medium, 'email', 'known categorical values remain measurable');
    await context.close();
  });

  await test('referrer attribution keeps only a credential-free HTTP(S) origin', async () => {
    const context = await freshContext(browser);
    const page = await context.newPage();
    await page.goto(`${BASE}/#landing`);
    const acquisition = await page.evaluate(() => {
      const state = window.DDA.load();
      return window.DDA.captureAcquisition({
        ...state,
        acquisition: { ...state.acquisition, visitorId: null }
      }, {
        source: 'newsletter',
        medium: 'email',
        campaign: 'launch',
        referrer: 'https://ada%40example.com:secret@referrer.example/path?email=ada%40example.com#phone-2250700000000'
      }).acquisition;
    });
    assert.equal(acquisition.referrer, 'https://referrer.example');
    assert.equal(JSON.stringify(acquisition).includes('ada@example.com'), false);
    assert.equal(JSON.stringify(acquisition).includes('secret'), false);
    assert.equal(JSON.stringify(acquisition).includes('2250700000000'), false);
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

  await test('PostHog transport applies the UTM privacy filter even to unsanitized caller props', async () => {
    const context = await freshContext(browser);
    await context.addInitScript(() => {
      window.__posthogCalls = [];
      window.DDA_ANALYTICS_CONFIG = { posthogKey: 'playwright-test-key', posthogHost: 'https://analytics.test' };
      window.posthog = {
        init: (...args) => window.__posthogCalls.push({ method: 'init', args }),
        identify: (...args) => window.__posthogCalls.push({ method: 'identify', args }),
        capture: (...args) => window.__posthogCalls.push({ method: 'capture', args })
      };
    });
    const page = await context.newPage();
    let analyticsLoadedWithUrl = '';
    await page.route('https://analytics.test/static/array.js', route => {
      analyticsLoadedWithUrl = page.url();
      return route.fulfill({
        status: 200,
        contentType: 'application/javascript',
        body: '/* PostHog is stubbed by this test. */'
      });
    });
    await page.goto(`${BASE}/?utm_source=ada%40example.com&utm_medium=email#landing`);
    await page.waitForFunction(() => window.DDAAnalytics?.getTransport() === 'posthog');
    await page.evaluate(() => window.DDAAnalytics.send('landing_visit', {
      source: 'ada@example.com',
      medium: '+225 07 00 00 00 00',
      campaign: 'launch-2026',
      referrer: 'https://referrer.example/path?email=ada%40example.com#phone-2250700000000',
      visitorId: window.DDA.load().acquisition.visitorId,
      view: 'ada@example.com',
      position: 'mobile_sticky',
      broker: 'XM',
      section: 'free',
      step: 'private-note@example.com'
    }));
    const calls = await page.evaluate(() => window.__posthogCalls);
    const capture = calls.findLast(call => call.method === 'capture');
    assert.ok(capture, 'the mocked PostHog transport should receive a capture call');
    assert.equal(capture.args[0], 'landing_visit');
    assert.equal(new URL(analyticsLoadedWithUrl).search, '', 'the analytics script must not see raw UTM query values');
    assert.equal(analyticsLoadedWithUrl.includes('ada%40example.com'), false);
    assert.deepEqual(capture.args[1], {
      campaign: 'launch-2026', referrer: 'https://referrer.example',
      position: 'mobile_sticky', broker: 'XM', section: 'free'
    });
    assert.equal(JSON.stringify(calls).includes('ada@example.com'), false);
    assert.equal(JSON.stringify(calls).includes('2250700000000'), false);
    assert.equal(JSON.stringify(calls).includes('/path?'), false);
    assert.equal(JSON.stringify(calls).includes('private-note'), false, 'unrecognized keys and free-text values are dropped');
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
      sidebar: document.querySelector('.sidebar') ? getComputedStyle(document.querySelector('.sidebar')).display : 'none',
      topbar: document.querySelector('.topbar') ? getComputedStyle(document.querySelector('.topbar')).display : 'none',
      mobileNav: document.querySelector('.mobile-nav') ? getComputedStyle(document.querySelector('.mobile-nav')).display : 'none',
      banner: document.querySelector('.prototype-banner') ? getComputedStyle(document.querySelector('.prototype-banner')).display : 'none'
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
    await page.goto(`${ACADEMY_BASE}#access`);
    const topbarDisplay = await page.evaluate(() => getComputedStyle(document.querySelector('.topbar')).display);
    assert.notEqual(topbarDisplay, 'none');
    await context.close();
  });

  await test('a first-time anonymous visitor with no hash lands on #landing, and its CTA reaches #access', async () => {
    const context = await freshContext(browser);
    const page = await context.newPage();
    await page.goto(`${BASE}/`);
    assert.equal(await page.evaluate(() => document.getElementById('landing')?.classList.contains('active')), true);
    await page.click('#landing [data-view="access"]');
    await page.waitForURL('**/academy.html#access');
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

  await test('M1.3 completed leaves no phantom lesson and keeps M2 honestly coming soon', async () => {
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
          'M1.2': done,
          'M1.3': done
        },
        journal: { entries: [], plan: {} },
        preferences: { lowData: false, reminders: false },
        events: [],
        acquisition: {},
        updatedAt: null
      }));
    });
    const page = await context.newPage();
    await page.goto(`${ACADEMY_BASE}#dashboard`);

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
    assert.equal(productState.next, null, 'there must be no fabricated next lesson after M1.3');
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
    assert.equal(pathState.target, 'lesson-m13', 'Parcours review target must be the last real authored lesson');

    await page.reload();
    assert.equal(await page.evaluate(() => window.DDALearning.nextActionable(window.DDA.curriculum, window.DDA.load())), null, 'completion state must survive reload');
    await context.close();
  });

  console.log('\n-- L. Landing — Private Alpha acquisition readiness --');

  await test('#landing demonstrates the real product (demo/steps/plans/guardrails) with no fabricated numbers', async () => {
    const context = await freshContext(browser);
    const page = await context.newPage();
    await page.goto(`${BASE}/#landing`);

    const counts = await page.evaluate(() => ({
      demo: document.querySelectorAll('.landing-demo-grid article').length,
      problem: document.querySelectorAll('.landing-problem-list li').length,
      steps: document.querySelectorAll('.landing-steps-list li').length,
      plans: document.querySelectorAll('.landing-plan-card').length,
      guardrails: document.querySelectorAll('.landing-guardrail-list li').length,
      finalCtaView: document.querySelector('.landing-final-cta [data-view]')?.dataset?.view
    }));
    assert.ok(counts.demo >= 3, 'product demonstration must list several real screens');
    assert.ok(counts.problem >= 3, 'problem section must name concrete pain points');
    assert.ok(counts.steps >= 3 && counts.steps <= 5, 'how-it-works must stay to 3-5 steps per the mandate');
    assert.equal(counts.plans, 2, 'exactly Free and Premium, no invented third tier');
    assert.ok(counts.guardrails >= 3, 'trust section must state concrete guardrails');
    assert.equal(counts.finalCtaView, 'access', 'closing CTA must lead to the real signup entry point');

    const bodyText = await page.evaluate(() => document.getElementById('landing').textContent);
    assert.doesNotMatch(bodyText, /\d+[\s ]*(000|k)?\s*(utilisateurs|membres|apprenants|élèves)/i, 'no fabricated user-count claim');
    assert.doesNotMatch(bodyText, /gagnez|devenez rentable|rendement garanti|par jour\b.*FCFA/i, 'no financial-promise language');
    assert.doesNotMatch(bodyText, /témoignage|"[^"]{20,}"\s*[-—]\s*[A-Z]/i, 'no testimonial-shaped content');
    await context.close();
  });

  await test('landing market cards preserve the existing visitor access gate', async () => {
    const context = await freshContext(browser, { width: 390, height: 844 });
    const page = await context.newPage();
    await page.goto(`${BASE}/#landing`);
    assert.equal(await page.locator('.landing-market-card').count(), 5);
    await page.locator('.landing-market-card').first().click();
    await page.waitForFunction(() => document.querySelector('#access')?.classList.contains('active'));
    assert.equal(await page.locator('#markets').evaluate(node => node.classList.contains('active')), false, 'anonymous visitors must not bypass the existing access gate');
    assert.equal(await page.locator('#access').isVisible(), true, 'the existing signup/access view is the visitor destination');
    await context.close();
  });

  await test('the Elite theme covers every route and remaining product surface', async () => {
    const context = await freshContext(browser, { width: 1440, height: 1000 });
    await seedLocalLearner(context);
    const page = await context.newPage();
    await page.goto(`${ACADEMY_BASE}#progress`);
    await page.waitForFunction(() => document.querySelector('.view.active')?.id === 'progress');
    const theme = await page.evaluate(() => {
      const deepNavy = [6, 13, 23];
      const views = [...document.querySelectorAll('.view')].map(node => ({
        id: node.id,
        color: getComputedStyle(node).backgroundColor
      }));
      const selectors = '.prototype-banner,.access-card,.principle,.example-callout,.result-card,.result-stats,.certificate-mock,.practice-proof-row,.brvm-panel,.plan-card,.premium-lab-form,.premium-assessment-form,.broker-row,.support-contact,.support-faq-panel,.community-tile,.profile-panel,.preference-panel,.journal-panel,.journal-composer,.resource-feature,.journey-future-note,.mastery-context-note,.gate-card,.toast,.storage-warning';
      const surfaces = [...document.querySelectorAll(selectors)].map(node => {
        const style = getComputedStyle(node);
        const values = style.backgroundColor.match(/[\d.]+/g)?.map(Number) || [0, 0, 0, 0];
        const alpha = values.length > 3 ? values[3] : 1;
        const effective = values.slice(0, 3).map((channel, index) => channel * alpha + deepNavy[index] * (1 - alpha));
        return { selector: node.id || node.className, color: style.backgroundColor, luminanceCeiling: Math.max(...effective) };
      });
      const progressPhotoFilter = getComputedStyle(document.querySelector('#progress .view-photo-band .photo-fill')).filter;
      return { views, surfaces, progressPhotoFilter };
    });
    assert.ok(theme.views.length >= 24, `all app views must be audited (got ${theme.views.length})`);
    for (const view of theme.views) {
      assert.equal(view.color, 'rgb(6, 13, 23)', `${view.id} must use the resting Deep Navy canvas`);
    }
    assert.ok(theme.surfaces.length >= 20, `expected to inspect common page surfaces (got ${theme.surfaces.length})`);
    for (const surface of theme.surfaces) {
      assert.ok(surface.luminanceCeiling < 150, `${surface.selector} must not regress to a light/cream surface (${surface.color})`);
    }
    assert.match(theme.progressPhotoFilter, /saturate\(0\.68\)/, 'the Progress poster keeps an atmospheric feel while DDA color remains visible');
    await page.locator('.nav-item[data-scroll-to="analysis-terminal"]').click();
    await page.waitForFunction(() => {
      const chart = document.querySelector('#terminal-chart')?.getBoundingClientRect();
      return document.querySelector('.view.active')?.id === 'dashboard' && chart && chart.top >= 0 && chart.top < innerHeight;
    });
    assert.equal(await page.locator('.view.active').getAttribute('id'), 'dashboard', 'the desktop shortcut scrolls to the existing Terminal inside Dashboard');
    await context.close();
  });

  await test('DDA Aurora carries branded glass light and respects motion preferences', async () => {
    const context = await freshContext(browser, { width: 1440, height: 900 });
    await seedLocalLearner(context);
    const page = await context.newPage();
    await page.goto(`${BASE}/#landing`);
    const visuals = await page.evaluate(() => {
      const get = selector => document.querySelector(selector);
      const style = selector => getComputedStyle(get(selector));
      const views = [...document.querySelectorAll('.view')];
      return {
        viewsWithLightField: views.filter(node => getComputedStyle(node).backgroundImage.includes('radial-gradient')).length,
        viewCount: views.length,
        apertureLight: style('#landing .landing-aperture .photo-scrim').backgroundImage,
        stageMotion: style('#landing .landing-device-stage').animationName,
        reflectionMotion: getComputedStyle(get('#landing .landing-device-stage'), '::before').animationName,
        glass: style('#landing .landing-market-card').backdropFilter,
        action: style('#landing .landing-actions .primary-action').backgroundImage,
        landingFeatureBackground: style('#landing .landing-free-grid article').backgroundImage
      };
    });
    const academyPage = await context.newPage();
    await academyPage.goto(`${ACADEMY_BASE}#dashboard`);
    await academyPage.waitForFunction(() => document.querySelector('.view.active')?.id === 'dashboard');
    const academyLightFields = await academyPage.evaluate(() => [...document.querySelectorAll('.view')].filter(node => getComputedStyle(node).backgroundImage.includes('radial-gradient')).length);
    assert.ok(academyLightFields >= 24, 'the route light field should apply throughout the Academy views');
    assert.match(visuals.apertureLight, /radial-gradient/, 'the DDA Aperture has a custom instrument-light treatment');
    assert.match(visuals.stageMotion, /dda-aperture-float/, 'the laptop/phone stage has gentle 3D movement');
    assert.match(visuals.glass, /blur\(8px\)/, 'market cards use restrained glass on desktop');
    assert.match(visuals.action, /linear-gradient/, 'the landing action uses the DDA electric-blue finish');
    assert.match(visuals.landingFeatureBackground, /linear-gradient/, 'feature modules use smoked glass rather than a generic light card');

    await page.emulateMedia({ reducedMotion: 'reduce' });
    const reducedMotion = await page.locator('#landing .landing-device-stage').evaluate(node => getComputedStyle(node).animationName);
    assert.equal(reducedMotion, 'none', 'reduced-motion turns off decorative 3D movement');
    const reducedReflection = await page.locator('#landing .landing-device-stage').evaluate(node => getComputedStyle(node, '::before').animationName);
    assert.equal(reducedReflection, 'none', 'reduced-motion also stops the reflected light animation');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.evaluate(() => document.body.classList.add('low-data'));
    const lowDataMotion = await page.locator('#landing .landing-device-stage').evaluate(node => getComputedStyle(node).animationName);
    assert.equal(lowDataMotion, 'none', 'low-data mode keeps the scene static');
    const lowDataReflection = await page.locator('#landing .landing-device-stage').evaluate(node => getComputedStyle(node, '::before').animationName);
    assert.equal(lowDataReflection, 'none', 'low-data mode also stops the reflected light animation');
    await context.close();
  });

  await test('mobile Back, Forward and in-app Retour follow DDA screen history', async () => {
    const context = await freshContext(browser, { width: 390, height: 844 });
    await seedLocalLearner(context);
    const page = await context.newPage();
    await page.goto(`${ACADEMY_BASE}#dashboard`);
    await page.waitForFunction(() => document.querySelector('.view.active')?.id === 'dashboard');

    await page.locator('.mobile-nav button[data-view="path"]').click();
    await page.waitForFunction(() => document.querySelector('.view.active')?.id === 'path');
    await page.locator('.mobile-nav button[data-view="progress"]').click();
    await page.waitForFunction(() => document.querySelector('.view.active')?.id === 'progress');

    await page.goBack();
    await page.waitForFunction(() => document.querySelector('.view.active')?.id === 'path');
    assert.equal(await page.evaluate(() => history.state?.__ddaAppView), 'path');
    await page.goForward();
    await page.waitForFunction(() => document.querySelector('.view.active')?.id === 'progress');

    await page.locator('.mobile-nav button[data-view="journal"]').click();
    await page.waitForFunction(() => document.querySelector('.view.active')?.id === 'journal');
    await page.locator('#journal > .back-link[data-view="back"]').click();
    await page.waitForFunction(() => document.querySelector('.view.active')?.id === 'progress');
    assert.equal(await page.evaluate(() => location.hash), '#progress', 'the in-app back button returns to the previous route');
    await page.goForward();
    await page.waitForFunction(() => document.querySelector('.view.active')?.id === 'journal');
    assert.equal(await page.evaluate(() => location.origin), new URL(BASE).origin, 'mobile Back/Forward stays in the DDA document');

    await page.locator('.mobile-nav button[data-view="dashboard"]').click();
    await page.waitForFunction(() => document.querySelector('.view.active')?.id === 'dashboard');
    await page.locator('.terminal-divider-go').click();
    await page.waitForTimeout(500);
    assert.equal(await page.locator('.terminal-practice-mission').count(), 1, 'the Dashboard keeps the guided Terminal mission mounted after the shortcut');
    assert.equal(await page.evaluate(() => document.querySelector('.view.active')?.id), 'dashboard', 'Terminal shortcut keeps the existing Dashboard route');
    await context.close();
  });

  await test('#landing renders with no horizontal overflow at 360px, 390px and 1440px', async () => {
    for (const width of [360, 390, 1440]) {
      const context = await freshContext(browser, { width, height: 900 });
      const page = await context.newPage();
      await page.goto(`${BASE}/#landing`);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      assert.ok(overflow <= 1, `#landing must not overflow horizontally at ${width}px (got ${overflow}px)`);
      await context.close();
    }
  });

  await test('mobile landing is full-bleed Deep Navy with inset cards and no sticky-CTA overlap', async () => {
    const context = await freshContext(browser, { width: 390, height: 844 });
    const page = await context.newPage();
    await page.goto(`${BASE}/#landing`);

    const shell = await page.evaluate(() => {
      const landing = document.getElementById('landing');
      const style = getComputedStyle(landing);
      return {
        width: landing.getBoundingClientRect().width,
        viewportWidth: window.innerWidth,
        background: style.backgroundColor,
        paddingBottom: parseFloat(style.paddingBottom),
        visibleDialogs: [...document.querySelectorAll('[role="dialog"], dialog, [aria-modal="true"]')]
          .filter(node => !node.hidden && getComputedStyle(node).display !== 'none' && node.getBoundingClientRect().width > 0)
          .length,
        visibleCloseButtons: [...document.querySelectorAll('.reader-close')]
          .filter(node => getComputedStyle(node).display !== 'none' && getComputedStyle(node).visibility !== 'hidden' && node.getBoundingClientRect().width > 0)
          .length
      };
    });
    assert.equal(shell.width, shell.viewportWidth, 'landing must occupy the full mobile viewport width');
    assert.equal(shell.background, 'rgb(6, 13, 23)', 'landing must use Deep Navy #060d17');
    assert.ok(shell.paddingBottom >= 120, `landing needs substantial bottom clearance (got ${shell.paddingBottom}px)`);
    assert.equal(shell.visibleDialogs, 0, 'no closeable modal/dialog should appear over the idle landing');
    assert.equal(shell.visibleCloseButtons, 0, 'no modal close button should appear over the idle landing');

    const cards = await page.locator('.landing-free-grid article').evaluateAll(nodes => nodes.map(node => {
      const rect = node.getBoundingClientRect();
      return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
    }));
    assert.equal(cards.length, 4, 'DDA Free must keep all four numbered cards');
    assert.ok(cards[0].left >= 15, `cards need visible mobile gutters (left=${cards[0].left}px)`);
    assert.ok(cards[0].right <= 375, `cards need visible mobile gutters (right=${cards[0].right}px)`);
    assert.ok(cards[1].top - cards[0].bottom >= 10, 'cards should have consistent breathing room');

    await page.evaluate(() => window.scrollTo({ top: 960, behavior: 'instant' }));
    await page.waitForFunction(() => document.body.classList.contains('landing-has-scrolled'));
    await page.waitForTimeout(40);
    assert.equal(await page.locator('.landing-mobile-cta').isVisible(), true, 'CTA should appear in a safe mobile scroll interval');
    const touchTargetMinHeight = await page.locator('.landing-mobile-cta button').evaluate(node => parseFloat(getComputedStyle(node).minHeight));
    assert.ok(touchTargetMinHeight >= 44, 'the sticky CTA should retain a usable touch target');
    await page.evaluate(() => {
      const card = document.querySelector('.landing-free-grid article:last-child');
      const cta = document.querySelector('.landing-mobile-cta');
      const top = card.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: top - (window.innerHeight - cta.getBoundingClientRect().height / 2), behavior: 'instant' });
    });
    await page.waitForTimeout(40);
    await page.waitForFunction(() => document.body.classList.contains('landing-cta-covering-content'));
    assert.equal(await page.locator('.landing-mobile-cta').isVisible(), false, 'sticky CTA must yield while it geometrically overlaps card 04');
    const overlap = await page.evaluate(() => {
      const card = document.querySelector('.landing-free-grid article:last-child').getBoundingClientRect();
      return {
        intersectsStickyBounds: card.bottom > window.innerHeight - 12 - 62 && card.top < window.innerHeight - 12,
        guardActive: document.body.classList.contains('landing-cta-covering-content')
      };
    });
    assert.ok(overlap.intersectsStickyBounds, 'the regression fixture must position the CTA over the last card to exercise the guard');
    assert.equal(overlap.guardActive, true, 'the overlap guard should activate when the last card enters the sticky area');
    await context.close();

    const learnerContext = await freshContext(browser, { width: 390, height: 844 });
    await seedLocalLearner(learnerContext);
    const learnerPage = await learnerContext.newPage();
    await learnerPage.goto(`${ACADEMY_BASE}#dashboard`);
    const learnerHome = await learnerPage.evaluate(() => ({
      activeView: document.querySelector('.view.active')?.id,
      background: getComputedStyle(document.body).backgroundColor,
      dialogs: [...document.querySelectorAll('[role="dialog"], dialog, [aria-modal="true"]')]
        .filter(node => !node.hidden && getComputedStyle(node).display !== 'none' && node.getBoundingClientRect().width > 0).length,
      closeButtons: [...document.querySelectorAll('.reader-close')]
        .filter(node => getComputedStyle(node).display !== 'none' && getComputedStyle(node).visibility !== 'hidden' && node.getBoundingClientRect().width > 0).length
    }));
    assert.equal(learnerHome.activeView, 'dashboard', 'a local learner should see the actual learning home');
    assert.equal(learnerHome.background, 'rgb(6, 13, 23)', 'learning home should use the same Deep Navy canvas');
    assert.equal(learnerHome.dialogs, 0, 'learning home should not be enclosed by a fake white dialog');
    assert.equal(learnerHome.closeButtons, 0, 'learning home should not show an unrelated dialog close button');
    await learnerContext.close();
  });

  await test('landing funnel records a reached section once and reveals the mobile sticky CTA after scroll', async () => {
    const context = await freshContext(browser, { width: 390, height: 844 });
    const page = await context.newPage();
    await page.goto(`${BASE}/#landing`);
    assert.equal(await page.locator('.landing-mobile-cta').isVisible(), false, 'sticky CTA must not cover the first landing decision');

    await page.evaluate(() => window.scrollTo({ top: 960, behavior: 'instant' }));
    await page.waitForFunction(() => document.body.classList.contains('landing-has-scrolled'));
    await page.waitForTimeout(40);
    assert.equal(await page.locator('.landing-mobile-cta').isVisible(), true, 'sticky CTA should appear in a safe interval after the hero');

    await page.locator('[data-funnel-section="free"]').scrollIntoViewIfNeeded();
    await page.waitForFunction(() => window.DDA.load().events.some(event => event.name === 'landing_section_reached' && event.metadata?.section === 'free'));
    await page.waitForTimeout(40);
    const freeCardOverlap = await page.evaluate(() => document.body.classList.contains('landing-cta-covering-content'));
    assert.equal(await page.locator('.landing-mobile-cta').isVisible(), !freeCardOverlap, 'sticky CTA should yield whenever readable content intersects its bounds');

    await page.evaluate(() => window.scrollTo({ top: 960, behavior: 'instant' }));
    await page.waitForTimeout(40);
    assert.equal(await page.locator('.landing-mobile-cta').isVisible(), true, 'CTA should be visible once a safe interval follows the hero');
    await page.locator('[data-funnel-section="free"]').scrollIntoViewIfNeeded();
    await page.waitForTimeout(80);
    const funnel = await page.evaluate(() => window.DDA.load().events.filter(event => event.name === 'landing_section_reached' && event.metadata?.section === 'free'));
    assert.equal(funnel.length, 1, 'each funnel section is recorded once per page visit');
    await context.close();
  });

  await test('landing sticky CTA never covers readable copy across mobile sections', async () => {
    const targets = [
      '#landing-experience h2', '#landing-experience p',
      '#landing-product h2', '#landing-product h3',
      '#landing-proof h2', '#landing-proof p',
      '#landing-free h2', '#landing-free h3',
      '#landing-ecosystem h2', '#landing-ecosystem p',
      '#landing-future h2', '#landing-future p',
      '#landing-trust h2', '.landing-final-cta h2', '.landing-final-cta p'
    ];
    for (const width of [360, 390, 414]) {
      const context = await freshContext(browser, { width, height: 844 });
      const page = await context.newPage();
      await page.goto(`${BASE}/#landing`);
      for (const selector of targets) {
        const geometry = await page.evaluate(async (targetSelector) => {
          const target = document.querySelector(targetSelector);
          const cta = document.querySelector('.landing-mobile-cta');
          const targetRect = target.getBoundingClientRect();
          const ctaHeight = cta.getBoundingClientRect().height;
          const targetTop = targetRect.top + window.scrollY;
          window.scrollTo({ top: targetTop - (window.innerHeight - ctaHeight / 2), behavior: 'instant' });
          await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
          const rect = target.getBoundingClientRect();
          const sticky = cta.getBoundingClientRect();
          return { intersects: rect.bottom > sticky.top && rect.top < sticky.bottom };
        }, selector);
        await page.waitForFunction(() => document.body.classList.contains('landing-cta-covering-content'));
        assert.equal(geometry.intersects, true, `${selector} must intersect sticky bounds at ${width}px`);
        assert.equal(await page.locator('.landing-mobile-cta').isVisible(), false, `sticky CTA must yield over ${selector} at ${width}px`);
      }
      await context.close();
    }
  });

  await test('the hero CTA fires hero_cta_click, and #access records signup_started + qualification_started exactly once', async () => {
    const context = await freshContext(browser);
    const page = await context.newPage();
    await page.goto(`${BASE}/#landing`);

    await page.click('#landing .landing-actions [data-view="access"][data-analytics="hero_cta_click"]');
    await page.waitForURL('**/academy.html#access');
    const afterHero = await page.evaluate(() => window.DDA.load().events.map(e => e.name));
    assert.ok(afterHero.includes('hero_cta_click'), 'hero CTA click must be recorded');
    assert.ok(afterHero.includes('signup_started'), '#access entry must record signup_started');
    assert.ok(afterHero.includes('qualification_started'), '#access entry must record qualification_started');

    await page.goto(`${ACADEMY_BASE}#access`);
    await page.goto(`${ACADEMY_BASE}#access`);
    const afterRevisit = await page.evaluate(() => window.DDA.load().events.filter(e => e.name === 'signup_started').length);
    assert.equal(afterRevisit, 1, 'signup_started must not be recorded again once the visitor already reached #access');
    await context.close();
  });

  await test('completing signup fires signup_completed, and completing onboarding fires qualification_completed', async () => {
    const context = await freshContext(browser);
    const page = await context.newPage();
    await completeSignupFlow(page);
    const names = await page.evaluate(() => window.DDA.load().events.map(e => e.name));
    assert.ok(names.includes('signup_completed'), 'signup_completed must fire once the account is created');
    assert.ok(names.includes('qualification_completed'), 'qualification_completed must fire once onboarding is submitted');
    await context.close();
  });

  console.log('\n-- M. Verrous directs et boucle Terminal → Journal --');

  await test('direct lesson URLs respect every declared prerequisite, and work once it is completed', async () => {
    const cases = [
      { view: 'lesson-m02', prerequisite: 'M0.1' },
      { view: 'lesson-m03', prerequisite: 'M0.2' },
      { view: 'lesson-m11', prerequisite: 'M0.3', plan: 'premium' },
      { view: 'lesson-m12', prerequisite: 'M1.1', plan: 'premium' },
      { view: 'lesson-m13', prerequisite: 'M1.2', plan: 'premium' }
    ];
    for (const item of cases) {
      const blockedContext = await freshContext(browser);
      await seedLocalLearner(blockedContext, {}, item.plan || 'free');
      const blockedPage = await blockedContext.newPage();
      await blockedPage.goto(`${ACADEMY_BASE}#${item.view}`);
      assert.equal(await blockedPage.evaluate(() => document.querySelector('.view.active')?.id), 'path', `${item.view} must be blocked without ${item.prerequisite}`);
      assert.ok((await blockedPage.locator('#toast').textContent()).includes('se débloque'), 'the blocked learner receives a clear explanation');
      await blockedContext.close();

      const unlockedContext = await freshContext(browser);
      await seedLocalLearner(unlockedContext, { [item.prerequisite]: { quizComplete: true } }, item.plan || 'free');
      const unlockedPage = await unlockedContext.newPage();
      await unlockedPage.goto(`${ACADEMY_BASE}#${item.view}`);
      const unlockedState = await unlockedPage.evaluate(() => ({
        active: [...document.querySelectorAll('.view.active')].map(view => view.id),
        plan: window.DDA.load().membership.plan,
        prerequisite: window.DDA.load().lessons,
        entitled: window.DDA.can(window.DDA.load(), 'advanced_modules')
      }));
      assert.deepEqual(unlockedState.active, [item.view], `${item.view} must open after ${item.prerequisite} is complete: ${JSON.stringify(unlockedState)}`);
      await unlockedContext.close();
    }
  });

  await test('Terminal annotation → failed retry → validated proof → saved Journal metadata → Progression and source lesson', async () => {
    const context = await freshContext(browser);
    await seedLocalLearner(context, { 'M0.1': { quizComplete: true } });
    const page = await context.newPage();
    await page.goto(`${ACADEMY_BASE}#lesson-m02`);
    await page.click('[data-practice-launch="M0.2"]');
    assert.equal(await page.evaluate(() => document.querySelector('.view.active')?.id), 'dashboard');
    assert.equal(await page.evaluate(() => window.DDA.load().terminal.practice.sourceLessonTitle), 'Support & Résistance');

    await page.fill('#terminal-observation', 'Plusieurs réactions apparaissent autour de la même zone centrale.');
    await page.click('#terminal-save-observation');
    await page.selectOption('#terminal-timeframe', '4H');
    await page.click('#terminal-zoom-in');
    assert.equal(await page.locator('[data-terminal-tool="crosshair"]').getAttribute('aria-pressed'), 'true', 'crosshair is the accessible initial tool');
    assert.equal(await page.locator('#terminal-zoom-value').textContent(), '2×', 'compact zoom dock reflects its selected level');
    await page.click('#terminal-practice-validate');
    let practice = await page.evaluate(() => window.DDA.load().terminal.practice);
    assert.ok(practice, 'Terminal state must be persisted after the first attempt');
    assert.equal(practice.status, 'retry', 'no drawing must not validate the exercise');
    assert.equal(practice.attempts, 1);
    assert.equal(practice.completedAt, undefined, 'a failed attempt must never receive a completion timestamp');

    const chart = page.locator('#terminal-chart');
    await chart.scrollIntoViewIfNeeded();
    const box = await chart.boundingBox();
    assert.ok(box && box.width > 100 && box.height > 100, 'interactive chart has a real pointer target');
    await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.4);
    assert.match(await page.locator('#terminal-candle-readout').textContent(), /Séquence \d{2}/, 'crosshair immediately reports the hovered synthetic candle');
    const crosshairValueY = await page.locator('#terminal-chart .crosshair-value-label').evaluate(node => Number(node.getAttribute('transform').match(/translate\(0\s*([^)]+)\)/)?.[1]));
    assert.ok(crosshairValueY > 100 && crosshairValueY < 250, `crosshair value label follows the hovered chart level (got ${crosshairValueY})`);
    await page.locator('[data-terminal-tool="zone"]').click();
    assert.equal(await page.locator('[data-terminal-tool="zone"]').getAttribute('aria-pressed'), 'true', 'selected drawing tool exposes its active state');
    await chart.scrollIntoViewIfNeeded();
    const drawingBox = await chart.boundingBox();
    assert.ok(drawingBox && drawingBox.width > 100 && drawingBox.height > 100, 'drawing gesture uses the chart box after toolbar selection');
    await page.mouse.move(drawingBox.x + drawingBox.width * 0.24, drawingBox.y + drawingBox.height * 0.35);
    await page.mouse.down();
    await page.mouse.move(drawingBox.x + drawingBox.width * 0.76, drawingBox.y + drawingBox.height * 0.54, { steps: 8 });
    await page.mouse.up();
    await page.click('#terminal-practice-validate');
    practice = await page.evaluate(() => window.DDA.load().terminal.practice);
    assert.equal(practice.status, 'validated', 'a learner-placed zone matching the taught range validates');
    assert.equal(practice.attempts, 2);
    assert.ok(practice.completedAt, 'successful proof is timestamped');
    const drawnTerminal = await page.evaluate(() => window.DDA.load().terminal);
    assert.equal(drawnTerminal.drawings.length, 1, 'a pointer drag creates and persists one annotation');
    assert.equal(drawnTerminal.drawings[0].type, 'zone');
    assert.equal(drawnTerminal.timeframe, '4H', 'compact timeframe selector persists in schema v4');
    assert.equal(drawnTerminal.zoom, 2, 'compact zoom controls persist their selected level');
    assert.deepEqual(practice.proof, {
      id: 'm02-zone-identification', type: 'zone_identification', lessonId: 'M0.2', status: 'validated'
    });
    assert.equal(await page.locator('#terminal-practice-proof').textContent(), 'Preuve conservée localement');

    await page.reload();
    const reloadedTerminal = await page.evaluate(() => window.DDA.load().terminal);
    assert.equal(reloadedTerminal.practice.status, 'validated', 'proof survives a full page reload');
    assert.equal(reloadedTerminal.observation, 'Plusieurs réactions apparaissent autour de la même zone centrale.');
    assert.equal(reloadedTerminal.timeframe, '4H');

    const unsavedObservation = 'Hypothèse de travail : plusieurs réactions encadrent cette aire pédagogique.';
    await page.fill('#terminal-observation', unsavedObservation);
    await page.click('#terminal-journal-handoff');
    assert.equal(await page.evaluate(() => document.querySelector('.view.active')?.id), 'journal');
    assert.equal(await page.locator('#journal-source-context').isVisible(), true, 'composer names the real Terminal source');
    assert.equal(await page.locator('#journal-market').inputValue(), 'BRVM Composite');
    assert.ok((await page.locator('#journal-context').inputValue()).includes('timeframe 4H'), 'handoff transfers the selected timeframe');
    assert.ok((await page.locator('#journal-context').inputValue()).includes('sans cotation en temps réel'), 'handoff preserves the no-live-quotes disclosure');
    assert.equal(await page.locator('#journal-scenario').inputValue(), unsavedObservation, 'one-click Journal handoff includes the current unsaved hypothesis');
    assert.ok((await page.locator('#journal-process').inputValue()).includes('zoom 2/3'));
    assert.ok((await page.locator('#journal-process').inputValue()).includes('annotations : zone Support/Résistance'));
    await page.click('#journal-step-next');
    await page.fill('#journal-decision', 'Je documente la zone observée sans en déduire un signal.');
    await page.click('#journal-step-next');
    await page.fill('#journal-whatworked', 'J’ai comparé plusieurs réactions avant de tracer.');
    await page.click('#journal-step-save');

    const savedEntry = await page.evaluate(() => window.DDA.load().journal.entries[0]);
    assert.equal(savedEntry.terminalSource, true);
    assert.equal(savedEntry.sourceLesson, 'M0.2');
    assert.equal(savedEntry.proofId, 'm02-zone-identification');
    assert.equal(savedEntry.proofType, 'zone_identification');
    assert.equal(savedEntry.decision, 'Je documente la zone observée sans en déduire un signal.');

    await page.click('.nav-item[data-view="progress"]');
    const progressProof = await page.locator('#progress-practice-proof').textContent();
    assert.ok(progressProof.includes('m02-zone-identification'), 'Progression surfaces the same stable practice proof');
    assert.ok(progressProof.includes('Identification de zone'), 'Progression classifies the artifact as practice, not as a quiz result');
    assert.ok(progressProof.includes('Après la leçon M0.2 · Support & Résistance'), 'Progression preserves the mission source');
    const lessonProgress = await page.evaluate(() => window.DDA.load().lessons['M0.2']);
    assert.equal(lessonProgress.quizComplete, false, 'a valid Practice Terminal proof does not fabricate lesson mastery');

    await page.click('.nav-item[data-view="journal"]');
    await page.locator('#journal-list details summary').click();
    await page.locator('#journal-list .journal-proof-source').click();
    assert.equal(await page.evaluate(() => document.querySelector('.view.active')?.id), 'lesson-m02', 'Journal source link reaches its real M0.2 lesson');
    await context.close();
  });

  await test('Terminal practice has no horizontal overflow and usable touch controls at 360/390/1440px', async () => {
    for (const width of [360, 390, 1440]) {
      const context = await freshContext(browser, { width, height: 900 });
      await seedLocalLearner(context, { 'M0.1': { quizComplete: true } });
      const page = await context.newPage();
      await page.goto(`${ACADEMY_BASE}#dashboard`);
      const result = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth - window.innerWidth,
        controls: [...document.querySelectorAll('[data-terminal-tool], #terminal-zoom-in, #terminal-zoom-out, #terminal-pan-left, #terminal-pan-right, #terminal-undo-drawing, #terminal-clear-drawings, #terminal-practice-validate, #terminal-save-observation, #terminal-journal-handoff')]
          .map(element => ({ id: element.id || element.dataset.terminalTool, width: element.getBoundingClientRect().width, height: element.getBoundingClientRect().height }))
      }));
      assert.ok(result.overflow <= 1, `Terminal must not overflow horizontally at ${width}px (got ${result.overflow}px)`);
      if (width <= 700) {
        const undersized = result.controls.filter(control => control.width < 44 || control.height < 44);
        assert.deepEqual(undersized, [], `Terminal touch controls must be at least 44×44px at ${width}px`);
      }
      await context.close();
    }
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
