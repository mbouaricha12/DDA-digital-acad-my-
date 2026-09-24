'use strict';

/*
 * DDA — full-app smoke boot (no browser required).
 *
 * Boots the real product (dist/index.html + every dist script, in the real
 * load order) inside jsdom, then walks the entire learner journey with real
 * DOM events, exactly like a user would:
 *
 *   landing → access → signup → onboarding → M0.1 (compris → exercice →
 *   mauvaise réponse quiz → bonne réponse → résultat) → verrou séquentiel
 *   vérifié FERMÉ (M1.1 refusé tant que M0.3 n'est pas validée) → M0.2 →
 *   M0.3 → verrou séquentiel vérifié OUVERT → M1.1 → verrou séquentiel
 *   vérifié FERMÉ (M1.3 refusée tant que M1.2 n'est pas validée) → M1.2 →
 *   M1.3 → Terminal en état « curriculum complété » → état persisté dans
 *   localStorage.
 *
 * This is the committed, dependency-light counterpart of tests/run.js
 * (Playwright/Chromium): it cannot measure layout or touch targets, but it
 * proves the whole wiring (Lesson Registry → renderer → gates → progression)
 * actually works end to end.
 *
 * Requires jsdom: `npm i jsdom` (no project-local dependency is added — the
 * test SKIPS cleanly when jsdom is unavailable, so CI stays green).
 *
 * Run with: node tests/smoke_app_boot.js
 */

let JSDOM;
try {
  ({ JSDOM } = require('jsdom'));
} catch {
  console.log('SKIP — jsdom not installed; run `npm i jsdom` to enable this smoke test.');
  process.exit(0);
}

const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const dist = (...segments) => path.join(root, 'dist', ...segments);
const SCRIPTS = ['m1-1-lesson.js', 'm1-2-lesson.js', 'm1-3-lesson.js', 'dda-core.js', 'learning-engine.js', 'lesson-renderer.js', 'dda-analytics.js', 'app.js'];

const dom = new JSDOM(fs.readFileSync(dist('index.html'), 'utf8'), {
  url: 'http://localhost/',
  runScripts: 'outside-only',
  pretendToBeVisual: true
});
const { window } = dom;
const { document } = window;

// jsdom gaps the product doesn't depend on (already guarded or presentational).
window.Element.prototype.scrollIntoView = window.Element.prototype.scrollIntoView || function () {};
try { window.scrollTo = () => {}; } catch { /* not writable in some jsdom versions — scrollTo is visual-only here */ }
if (!window.crypto || !window.crypto.randomUUID) {
  Object.defineProperty(window, 'crypto', { value: { randomUUID: () => `test-${Date.now()}-${Math.random()}` }, configurable: true });
}

SCRIPTS.forEach(file => window.eval(fs.readFileSync(dist(file), 'utf8')));

let pass = 0;
async function test(name, fn) { await fn(); pass++; console.log('PASS -', name); }
function click(el) {
  assert.ok(el, 'element to click must exist');
  el.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
}
function activeViewId() { return document.querySelector('.view.active')?.id; }
function correctOf(questionName) { return document.querySelector(`[data-question="${questionName}"] button[data-correct="true"]`); }
function wrongOf(questionName) { return document.querySelector(`[data-question="${questionName}"] button[data-correct="false"]`); }
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

async function completeLesson({ viewId, markId, exerciseName, quizName, resultId, nextViewId }) {
  await test(`${viewId} renders its authored lesson content`, () => {
    click(document.querySelector('#nav-current-lesson')); // sidebar shortcut follows the real continueTarget
    assert.equal(activeViewId(), viewId);
    const title = document.getElementById(`${viewId}-main`).querySelector('h1');
    assert.ok(title.textContent.trim().length > 3, 'lesson title rendered');
  });
  await test(`${viewId} : mark-understood -> exercise -> wrong quiz -> correct quiz -> result`, () => {
    click(document.getElementById(markId));
    click(correctOf(exerciseName));
    const gate = document.querySelector(`#${quizName}-block`);
    assert.equal(gate.getAttribute('aria-disabled'), 'false', 'quiz gate unlocked after the exercise');
    click(wrongOf(quizName));
    assert.ok(document.getElementById(`${quizName}-feedback`).textContent.length > 0, 'wrong quiz answer produces explanatory feedback');
    assert.equal(document.getElementById(resultId).hidden, true, 'wrong answer never reveals the result card');
    click(correctOf(quizName));
    assert.equal(document.getElementById(resultId).hidden, false, 'result card revealed after the correct quiz answer');
  });
  if (nextViewId) {
    await test(`${viewId} result CTA leads forward to ${nextViewId}`, () => {
      click(document.querySelector(`#${resultId} [data-view="${nextViewId}"]`));
      assert.equal(activeViewId(), nextViewId);
    });
  }
}

(async () => {
  await test('anonymous visitor lands on #landing, never a fake dashboard', () => {
    assert.equal(activeViewId(), 'landing');
  });

  await test('landing CTA reaches #access', () => {
    click(document.querySelector('#landing [data-view="access"]'));
    assert.equal(activeViewId(), 'access');
  });

  await test('signup + onboarding create the local user and land on M0.1', async () => {
    document.getElementById('first-name').value = 'Ada';
    document.getElementById('email').value = 'ada@example.com';
    document.getElementById('consent').checked = true;
    document.getElementById('signup-form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
    assert.equal(document.getElementById('onboarding-form').hidden, false, 'onboarding step revealed');
    document.getElementById('level').value = 'Débutant';
    document.getElementById('goal').value = 'Comprendre les marchés';
    document.getElementById('time').value = '10 minutes par jour';
    document.getElementById('onboarding-form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
    await wait(650); // simulated loading before entering the lesson
    assert.equal(activeViewId(), 'lesson');
  });

  await test('sequential gate CLOSED: opening M1.1 before M0.3 is validated sends back to Parcours', () => {
    click(document.querySelector('#result-card-m3 [data-view="lesson-m11"]'));
    assert.equal(activeViewId(), 'path');
  });

  await completeLesson({
    viewId: 'lesson', markId: 'mark-understood',
    exerciseName: 'exercise', quizName: 'quiz', resultId: 'result-card', nextViewId: 'lesson-m02'
  });
  await completeLesson({
    viewId: 'lesson-m02', markId: 'mark-understood-m2',
    exerciseName: 'm2-challenge-zone', quizName: 'm2-quiz', resultId: 'result-card-m2', nextViewId: 'lesson-m03'
  });
  await completeLesson({
    viewId: 'lesson-m03', markId: 'mark-understood-m3',
    exerciseName: 'm3-challenge', quizName: 'm3-quiz', resultId: 'result-card-m3'
  });

  await test('Standard entitlement gate (CDCP-OS §4.2, Option B): Free user attempting M1.1 opens the Standard preview gate', () => {
    click(document.querySelector('#result-card-m3 [data-view="lesson-m11"]'));
    assert.equal(document.getElementById('gate-layer').hidden, false, 'gate modal opens for unentitled M1 lesson');
    assert.ok(document.getElementById('gate-title').textContent.includes('Standard'), 'gate mentions Standard tier');
    click(document.getElementById('gate-unlock'));
    assert.equal(document.getElementById('gate-layer').hidden, true, 'gate closes on unlock');
    assert.equal(activeViewId(), 'lesson-m11', 'learner smoothly lands on M1.1 after unlock');
  });

  await completeLesson({
    viewId: 'lesson-m11', markId: 'mark-understood-m11',
    exerciseName: 'm1-exercise', quizName: 'm1-quiz', resultId: 'result-card-m11', nextViewId: 'lesson-m12'
  });

  await test('sequential gate CLOSED: opening M1.3 before M1.2 is validated sends back to Parcours', () => {
    click(document.querySelector('#result-card-m12 [data-view="lesson-m13"]'));
    assert.equal(activeViewId(), 'path');
  });

  await completeLesson({
    viewId: 'lesson-m12', markId: 'mark-understood-m12',
    exerciseName: 'm12-exercise', quizName: 'm12-quiz', resultId: 'result-card-m12', nextViewId: 'lesson-m13'
  });
  await completeLesson({
    viewId: 'lesson-m13', markId: 'mark-understood-m13',
    exerciseName: 'm13-exercise', quizName: 'm13-quiz', resultId: 'result-card-m13'
  });

  await test('Terminal shows the honest curriculum-complete state with a real next action', () => {
    click(document.querySelector('.mobile-nav [data-view="dashboard"], [data-view="dashboard"]'));
    assert.equal(activeViewId(), 'dashboard');
    assert.equal(document.getElementById('lesson-state-pill').textContent, 'Complété');
    const next = document.getElementById('lesson-primary-action').dataset.view;
    assert.ok(['journal', 'markets'].includes(next), `primary action is a real destination (${next}), not a phantom lesson`);
  });

  await test('full journey persisted: every lesson quizComplete is durably stored', () => {
    const state = JSON.parse(window.localStorage.getItem('dda-prototype-state-v4'));
    ['M0.1', 'M0.2', 'M0.3', 'M1.1', 'M1.2', 'M1.3'].forEach(id => {
      assert.equal(state.lessons[id]?.quizComplete, true, `${id} quizComplete persisted`);
    });
    assert.ok(state.acquisition?.visitorId, 'acquisition visitor id persisted');
  });

  console.log(`\nRESULT: ${pass} smoke-boot checks passed`);
})().catch(error => {
  console.error('SMOKE BOOT FAILED:', error);
  process.exit(1);
});
