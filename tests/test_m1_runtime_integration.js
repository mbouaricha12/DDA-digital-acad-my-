'use strict';
/*
 * Runtime contract for the M0 → M1.1 curriculum bridge.
 *
 * This test deliberately uses the real browser scripts in an isolated VM with
 * a small in-memory localStorage implementation. It validates the curriculum
 * and learning-engine contract without requiring Chromium; real-click browser
 * coverage remains the responsibility of the Playwright harness.
 *
 * Run with: node tests/test_m1_runtime_integration.js
 */

const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const lesson = require(path.join(ROOT, 'dist', 'm1-1-lesson.js'));

function createRuntime() {
  const storage = new Map();
  const localStorage = {
    getItem(key) { return storage.has(key) ? storage.get(key) : null; },
    setItem(key, value) { storage.set(key, String(value)); },
    removeItem(key) { storage.delete(key); }
  };
  const context = { console, Date, Math, Object, Array, String, Boolean, Number, JSON, Set, Map, localStorage };
  context.window = context;
  context.globalThis = context;
  context.DDAM1GoldenLesson = lesson;
  vm.createContext(context);
  for (const file of ['dda-core.js', 'learning-engine.js']) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'dist', file), 'utf8'), context, { filename: file });
  }
  return context;
}

let passed = 0;
let failed = 0;
function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`PASS - ${name}`);
  } catch (error) {
    failed += 1;
    console.log(`FAIL - ${name} -> ${error.message}`);
  }
}

function signedInState(DDA) {
  const state = DDA.load();
  state.user = { id: 'local-ada', name: 'Ada', email: 'ada@example.com', mode: 'device-demo' };
  return state;
}

function completeLesson(DDA, state, lessonId) {
  return DDA.updateLesson(state, lessonId, {
    lessonViewed: true,
    exerciseComplete: true,
    quizComplete: true
  });
}

test('the runtime curriculum contains the independently-authored M1.1 lesson', () => {
  const { DDA } = createRuntime();
  const m1 = DDA.curriculum.modules.find(module => module.id === 'M1');
  assert.ok(m1, 'M1 must exist in the runtime curriculum');
  assert.equal(m1.lessons.length, 1);
  assert.equal(m1.lessons[0].id, 'M1.1');
  assert.equal(m1.lessons[0].title, 'Pourquoi les prix évoluent ?');
});

test('M1 is locked while M0 is incomplete and the engine keeps M0.1 as next action', () => {
  const { DDA, DDALearning } = createRuntime();
  const state = signedInState(DDA);
  assert.equal(DDALearning.moduleStatus(DDA.curriculum, 'M1', state), DDALearning.MODULE_STATUS.LOCKED);
  assert.equal(DDALearning.nextActionable(DDA.curriculum, state).lessonId, 'M0.1');
});

test('validating all M0 lessons promotes M1.1 as the one next actionable lesson', () => {
  const { DDA, DDALearning } = createRuntime();
  let state = signedInState(DDA);
  ['M0.1', 'M0.2', 'M0.3'].forEach(id => { state = completeLesson(DDA, state, id); });
  const next = DDALearning.nextActionable(DDA.curriculum, state);
  assert.equal(DDALearning.moduleStatus(DDA.curriculum, 'M0', state), DDALearning.MODULE_STATUS.COMPLETED);
  assert.equal(DDALearning.moduleStatus(DDA.curriculum, 'M1', state), DDALearning.MODULE_STATUS.AVAILABLE);
  assert.equal(next.lessonId, 'M1.1');
  assert.equal(next.step, 'lesson');
});

test('M1.1 resumes through the same lesson → exercise → quiz state engine', () => {
  const { DDA, DDALearning } = createRuntime();
  let state = signedInState(DDA);
  ['M0.1', 'M0.2', 'M0.3'].forEach(id => { state = completeLesson(DDA, state, id); });

  state = DDA.updateLesson(state, 'M1.1', { lessonViewed: true });
  assert.equal(DDALearning.nextActionable(DDA.curriculum, state).step, 'exercise');

  state = DDA.updateLesson(state, 'M1.1', { exerciseComplete: true });
  assert.equal(DDALearning.nextActionable(DDA.curriculum, state).step, 'quiz');

  state = DDA.updateLesson(state, 'M1.1', { quizComplete: true });
  assert.equal(DDALearning.moduleStatus(DDA.curriculum, 'M1', state), DDALearning.MODULE_STATUS.COMPLETED);
  assert.equal(DDALearning.nextActionable(DDA.curriculum, state), null);
});

test('the app maps M1.1 to a dedicated reader, focus mode, and a module prerequisite check', () => {
  const appSource = fs.readFileSync(path.join(ROOT, 'dist', 'app.js'), 'utf8');
  assert.match(appSource, /'M1\.1':\s*'lesson-m11'/);
  assert.match(appSource, /LESSON_VIEW_IDS\.has\(id\)/);
  assert.match(appSource, /isLockedModuleLessonView\(id\)/);
});

console.log(`\nRESULT: ${passed} passed, ${failed} failed (out of ${passed + failed})`);
process.exit(failed ? 1 : 0);
