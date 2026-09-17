// Contract tests for the isolated M1.1 authored lesson definition.
const assert = require('assert');
const lesson = require('../dist/m1-1-lesson.js');

let passed = 0;
let failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('PASS -', name); }
  catch (err) { failed++; console.log('FAIL -', name, '->', err.message); }
}

function block(id) { return lesson.blocks.find((b) => b.id === id); }
function hasWrongAndCorrect(options) {
  return Array.isArray(options) && options.some((o) => o.correct === true) && options.some((o) => o.correct === false);
}

test('lesson id and title are M1.1 authored content', () => {
  assert.strictEqual(lesson.id, 'M1.1');
  assert.strictEqual(lesson.title, 'Pourquoi les prix évoluent ?');
});

test('competency is explicit and educational', () => {
  assert.strictEqual(lesson.competency.id, 'price_formation_understanding');
  assert.ok(lesson.competency.label.includes('formation du prix'));
});

test('lesson follows the four proof phases supported by the engine', () => {
  assert.deepStrictEqual(lesson.steps.map((s) => s.id), ['lesson', 'exercise', 'quiz', 'review']);
});

test('three distinct learning cases exist', () => {
  assert.ok(block('m1-buy-pressure'));
  assert.ok(block('m1-sell-pressure'));
  assert.ok(block('m1-balance'));
});

test('all three cases allow wrong answer and retry path', () => {
  ['m1-buy-pressure', 'm1-sell-pressure', 'm1-balance'].forEach((id) => {
    const b = block(id);
    assert.ok(hasWrongAndCorrect(b.options));
    b.options.filter((o) => !o.correct).forEach((o) => assert.ok(o.feedback && o.feedback.length > 20));
  });
});

test('exercise is a new scenario, not a duplicated quiz', () => {
  const exercise = block('m1-exercise');
  const quiz = block('m1-quiz');
  assert.strictEqual(exercise.step, 'exercise');
  assert.strictEqual(quiz.step, 'quiz');
  assert.ok(hasWrongAndCorrect(exercise.options));
  assert.ok(hasWrongAndCorrect(quiz.data.choices));
});

test('content never promises gain, signal, or prediction', () => {
  const text = JSON.stringify(lesson).toLowerCase();
  ['gain garanti', 'signal d’achat', 'signal de vente', 'profit garanti'].forEach((term) => {
    assert.ok(!text.includes(term), `forbidden phrase present: ${term}`);
  });
  assert.ok(text.includes('sans signal'));
  assert.ok(text.includes('sans') && text.includes('prédiction'));
});

test('lesson explicitly teaches counterparties and liquidity', () => {
  const text = JSON.stringify(lesson).toLowerCase();
  assert.ok(text.includes('liquidité'));
  assert.ok(text.includes('contrepartie'));
  assert.ok(text.includes('déséquilibre'));
  assert.ok(text.includes('acheteur'));
  assert.ok(text.includes('vendeur'));
});

test('quiz avoids the simplistic more buyers than sellers claim', () => {
  const quiz = block('m1-quiz').data;
  const correct = quiz.choices.find((c) => c.correct);
  assert.ok(correct.text.includes('liquidité'));
  const simplistic = quiz.choices.find((c) => c.text.includes('davantage de personnes'));
  assert.ok(simplistic && simplistic.correct === false);
});

test('result states proof without a trading-performance claim', () => {
  const result = block('m1-result').data;
  assert.ok(result.heading.includes('formation du prix'));
  assert.ok(result.body.includes('sans') && result.body.includes('signal'));
});

console.log('\n' + '='.repeat(50));
console.log(`RESULT: ${passed} passed, ${failed} failed (out of ${passed + failed})`);
console.log('='.repeat(50));
process.exit(failed ? 1 : 0);
