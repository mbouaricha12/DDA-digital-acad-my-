'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const lessonPath = path.join(__dirname, '..', 'dist', 'm2-1-lesson.js');
const lesson = require(lessonPath);
const source = fs.readFileSync(lessonPath, 'utf8');

let pass = 0;
function test(name, fn) { fn(); pass++; console.log('PASS -', name); }

test('M2.1 exposes the authored Golden Lesson contract and UMD global', () => {
  assert.strictEqual(lesson.id, 'M2.1');
  assert.strictEqual(lesson.title, 'Protéger son capital');
  assert.ok(lesson.content && lesson.content.lead);
  assert.strictEqual(lesson.practice.id, 'm21-exercise');
  assert.strictEqual(lesson.evaluation.id, 'm21-quiz');
  assert.deepStrictEqual(lesson.steps.map(step => step.id), ['lesson', 'exercise', 'quiz', 'review']);

  const browserContext = { self: {} };
  vm.runInNewContext(source, browserContext);
  assert.strictEqual(browserContext.self.DDAM21GoldenLesson.id, 'M2.1');
});

test('M2.1 teaches the mathematical asymmetry and the capital-first priority', () => {
  const text = JSON.stringify(lesson).toLowerCase();
  ['50 %', '100 %', 'invalidation', 'stop', 'survie du capital', 'rentabilité', 'capital restant']
    .forEach(term => assert.ok(text.includes(term), `missing teaching point: ${term}`));
  assert.ok(text.includes('aucun dogme') || text.includes('sans pourcentage universel'), 'sizing remains contextual, not rigid');
  assert.ok(text.includes('aucun prix réel') || text.includes('aucune cotation en direct'), 'no live/fake price data is presented');
  assert.ok(!/[0-9]+[,.][0-9]{2}/.test(text), 'no fabricated price-like figures');
});

test('the arithmetic is explicit: a 50 percent loss needs a 100 percent recovery', () => {
  const check = lesson.blocks.find(block => block.id === 'm21-asymmetry-check');
  assert.ok(check);
  assert.ok(check.options.some(option => option.correct && option.text.includes('50 %') && option.text.includes('100 %')));
  assert.ok(check.options.filter(option => !option.correct).every(option => option.feedback && option.feedback.length > 20));
});

test('invalidation is prepared before the decision and never presented as a prediction or guarantee', () => {
  const block = lesson.blocks.find(item => item.id === 'm21-invalidation');
  assert.ok(block.body.includes('à l’avance'));
  assert.ok(block.body.includes('ne garantit ni une exécution ni une perte exacte'));
  const choice = lesson.blocks.find(item => item.id === 'm21-invalidation-check');
  assert.ok(choice.options.some(option => option.correct && option.text.includes('avant la décision')));
  assert.ok(choice.options.some(option => !option.correct && option.text.includes('stop')));
});

test('M2.1 keeps the two-gate learning contract and retryable explanatory feedback', () => {
  const exercise = lesson.blocks.find(block => block.id === lesson.practice.id);
  const quiz = lesson.blocks.find(block => block.id === lesson.evaluation.id);
  assert.strictEqual(exercise.step, 'exercise');
  assert.strictEqual(quiz.step, 'quiz');
  assert.strictEqual(quiz.locked, true);
  assert.ok(exercise.options.some(option => option.correct === true));
  exercise.options.filter(option => option.correct === false).forEach(option => {
    assert.ok(typeof option.feedback === 'string' && option.feedback.length > 20);
  });
});

test('M2.1 refuses signals, predictions, promises and rigid sizing dogma', () => {
  const text = JSON.stringify(lesson).toLowerCase();
  ['signal d’achat', 'signal de vente', 'rendement garanti', 'profit assuré']
    .forEach(term => assert.ok(!text.includes(term), `forbidden claim leaked: ${term}`));
  assert.ok(text.includes('sans signal'));
  assert.ok(text.includes('ne prédit pas') || text.includes('zéro prédiction'));
  assert.ok(text.includes('aucun dogme') || text.includes('sans dogme rigide'));
});

test('the result closes M2.1 honestly without inventing a later lesson', () => {
  const summary = lesson.blocks.find(block => block.type === 'summary');
  assert.ok(summary);
  assert.ok(summary.data.heading.includes('protection du capital'));
  assert.ok(summary.data.body.includes('asymétrie'));
  assert.ok(!summary.continueTo);
});

console.log(`RESULT: ${pass} M2.1 risk-discipline checks passed`);
