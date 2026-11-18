'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const sandbox = { window: {} };
const source = fs.readFileSync(path.join(__dirname, '..', 'dist', 'learning-engine.js'), 'utf8');
vm.runInNewContext(source, sandbox, { filename: 'dist/learning-engine.js' });

const learning = sandbox.window.DDALearning;
const untouched = learning.getLessonProgress({}, 'M0.1');
assert.equal(learning.lessonProgressPercent(untouched), 0, 'an untouched lesson must not report progress');
assert.equal(learning.lessonProgressPercent({ lessonViewed: true }), 25, 'opening the authored lesson counts the first step');
assert.equal(learning.lessonProgressPercent({ lessonViewed: true, exerciseComplete: true }), 55, 'completing the exercise advances progress');
assert.equal(learning.lessonProgressPercent({ lessonViewed: true, exerciseComplete: true, quizComplete: true }), 100, 'a validated quiz completes lesson progress');

const curriculum = { modules: [{ id: 'M0', lessons: [{ id: 'M0.1' }, { id: 'M0.2' }, { id: 'M0.3' }] }] };
assert.equal(learning.moduleProgressPercent(curriculum, 'M0', {}), 0, 'an untouched module must start at 0%');
assert.equal(learning.moduleProgressPercent(curriculum, 'M0', { lessons: { 'M0.1': { lessonViewed: true } } }), 8, 'module progress must average the real lesson states');

console.log('RESULT: learning-engine progress percentages passed');
