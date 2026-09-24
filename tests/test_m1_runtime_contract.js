'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'dist', 'app.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'dist', 'index.html'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'dist', 'sw.js'), 'utf8');
const m11 = require('../dist/m1-1-lesson.js');
const m12 = require('../dist/m1-2-lesson.js');
const m13 = require('../dist/m1-3-lesson.js');
const m21 = require('../dist/m2-1-lesson.js');

let pass = 0;
function test(name, fn) { fn(); pass++; console.log('PASS -', name); }

test('M1.1, M1.2, M1.3 and M2.1 all have dedicated rendered lesson views', () => {
  ['lesson-m11', 'lesson-m11-main', 'lesson-m11-outline',
   'lesson-m12', 'lesson-m12-main', 'lesson-m12-outline',
   'lesson-m13', 'lesson-m13-main', 'lesson-m13-outline',
   'lesson-m21', 'lesson-m21-main', 'lesson-m21-outline']
    .forEach(id => assert.ok(html.includes(`id="${id}"`), id));
});

// Lesson Registry tranche: the prerequisite chain is declared once per lesson
// inside LESSON_REGISTRY and derived into LESSON_PREREQUISITE — asserted here
// in registry form instead of the old hand-typed literal map.
test('lesson prerequisites enforce M0.3 → M1.1 → M1.2 → M1.3 → M2.1 sequence', () => {
  assert.ok(/id: 'M1\.1', viewId: 'lesson-m11', suffix: 'm11', title: '[^']+', prerequisite: 'M0\.3'/.test(app), 'M1.1 declares M0.3 as its prerequisite');
  assert.ok(/id: 'M1\.2', viewId: 'lesson-m12', suffix: 'm12', title: '[^']+', prerequisite: 'M1\.1'/.test(app), 'M1.2 declares M1.1 as its prerequisite');
  assert.ok(/id: 'M1\.3', viewId: 'lesson-m13', suffix: 'm13', title: '[^']+', prerequisite: 'M1\.2'/.test(app), 'M1.3 declares M1.2 as its prerequisite');
  assert.ok(/id: 'M2\.1', viewId: 'lesson-m21', suffix: 'm21', title: '[^']+', prerequisite: 'M1\.3'/.test(app), 'M2.1 declares M1.3 as its prerequisite');
  assert.ok(app.includes('const LESSON_PREREQUISITE = Object.freeze(Object.fromEntries(LESSON_REGISTRY.filter'), 'the sequential gate is derived from the registry, not a parallel hand-written chain');
});

test('M1.1 → M1.2 → M1.3 → M2.1 continuity is authored, while M2.1 closes this tranche', () => {
  const m11Summary = m11.blocks.find(block => block.type === 'summary');
  assert.strictEqual(m11Summary.continueTo.view, 'lesson-m12');
  const m12Summary = m12.blocks.find(block => block.type === 'summary');
  assert.strictEqual(m12Summary.continueTo.view, 'lesson-m13');
  const m13Summary = m13.blocks.find(block => block.type === 'summary');
  assert.strictEqual(m13Summary.continueTo.view, 'lesson-m21');
  const m21Summary = m21.blocks.find(block => block.type === 'summary');
  assert.ok(!m21Summary.continueTo, 'M2.1 closes this authored M2 tranche without inventing M2.2');
});

test('every M1 lesson restores its progress UI from stored state on every render', () => {
  assert.ok(app.includes('renderLessonProgressUI(entry.id, entry.meta.lesson, lessonUiIds(entry))'), 'one registry-driven restore loop covers every mounted lesson');
  assert.ok(app.includes("id: 'M1.1', viewId: 'lesson-m11', suffix: 'm11'"), 'M1.1 declared in the registry');
  assert.ok(app.includes("id: 'M1.2', viewId: 'lesson-m12', suffix: 'm12'"), 'M1.2 declared in the registry');
  assert.ok(app.includes("id: 'M1.3', viewId: 'lesson-m13', suffix: 'm13'"), 'M1.3 declared in the registry');
  assert.ok(app.includes("id: 'M2.1', viewId: 'lesson-m21', suffix: 'm21'"), 'M2.1 declared in the registry');
  assert.ok(app.includes("quizBlock: 'm1-quiz'") && app.includes("quizBlock: 'm12-quiz'") && app.includes("quizBlock: 'm13-quiz'") && app.includes("quizBlock: 'm21-quiz'"), 'all authored advanced quiz gates derive from their lesson blocks');
  // Full id-by-id proof that lessonUiIds() produces ids the real renderer
  // actually emits (lesson-loop-m13, result-card-m13, …) lives in
  // tests/test_lesson_registry.js, which renders each registered lesson.
});

test('M1.3 remains inside the same curriculum/navigation source of truth', () => {
  assert.ok(app.includes("id: 'M1.2', viewId: 'lesson-m12'"), 'M1.2 route declared once, in the registry');
  assert.ok(app.includes("id: 'M1.3', viewId: 'lesson-m13'"), 'M1.3 route declared once, in the same registry');
  assert.ok(app.includes("...Object.fromEntries(LESSON_REGISTRY.map(entry => [entry.viewId, entry.permission || 'lesson_m01']))"), 'lesson views derive their entitlement from the registry');
});

test('low-data shell cache includes all authored M1 lesson dependencies', () => {
  assert.ok(sw.includes('./m1-1-lesson.js'));
  assert.ok(sw.includes('./m1-2-lesson.js'));
  assert.ok(sw.includes('./m1-3-lesson.js'));
  assert.ok(sw.includes('./m2-1-lesson.js'));
});

console.log(`RESULT: ${pass} M1 runtime integration checks passed`);
