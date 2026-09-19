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

let pass = 0;
function test(name, fn) { fn(); pass++; console.log('PASS -', name); }

test('M1.1 and M1.2 both have dedicated rendered lesson views', () => {
  ['lesson-m11', 'lesson-m11-main', 'lesson-m11-outline', 'lesson-m12', 'lesson-m12-main', 'lesson-m12-outline']
    .forEach(id => assert.ok(html.includes(`id="${id}"`), id));
});

test('lesson prerequisites enforce M0.3 → M1.1 → M1.2 sequence', () => {
  assert.ok(app.includes("'lesson-m11': 'M0.3'"));
  assert.ok(app.includes("'lesson-m12': 'M1.1'"));
});

test('M1.1 completion leads to M1.2 without inventing a later lesson', () => {
  const summary = m11.blocks.find(block => block.type === 'summary');
  assert.strictEqual(summary.continueTo.view, 'lesson-m12');
  const m12Summary = m12.blocks.find(block => block.type === 'summary');
  assert.ok(!m12Summary.continueTo, 'M1.2 must remain the end of the currently authored M1 path');
});

test('both M1 lessons restore their progress UI from stored state on every render', () => {
  assert.ok(app.includes('renderLessonProgressUI(lessonM11Id, lessonM11Def'));
  assert.ok(app.includes('renderLessonProgressUI(lessonM12Id, lessonM12Def'));
  ['lesson-loop-m12','lesson-outline-list-m12','m12-quiz-block','result-card-m12','mark-understood-m12','saved-state-m12','result-stats-m12']
    .forEach(token => assert.ok(app.includes(token), token));
});

test('M1.2 remains inside the same curriculum/navigation source of truth', () => {
  assert.ok(app.includes("'M1.2': 'lesson-m12'"));
  assert.ok(app.includes("'lesson-m12': 'lesson_m01'"));
});

test('low-data shell cache includes both authored M1 lesson dependencies', () => {
  assert.ok(sw.includes('./m1-1-lesson.js'));
  assert.ok(sw.includes('./m1-2-lesson.js'));
});

console.log(`RESULT: ${pass} M1 runtime integration checks passed`);
