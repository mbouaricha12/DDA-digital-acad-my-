const assert = require('assert');
const lesson = require('../dist/m1-1-lesson.js');

let pass = 0;
function test(name, fn) { fn(); pass++; console.log('PASS -', name); }

test('M1.1 exposes content expected by the existing renderer', () => {
  assert.ok(lesson.content && lesson.content.lead);
  assert.ok(lesson.practice && lesson.practice.id === 'm1-exercise');
  assert.ok(lesson.evaluation && lesson.evaluation.id === 'm1-quiz');
});

test('M1.1 has one exercise gate and one quiz gate', () => {
  const exercise = lesson.blocks.find(b => b.id === lesson.practice.id);
  const quiz = lesson.blocks.find(b => b.id === lesson.evaluation.id);
  assert.strictEqual(exercise.step, 'exercise');
  assert.strictEqual(quiz.step, 'quiz');
  assert.strictEqual(quiz.locked, true);
});

test('three reasoning practice cases remain ungated and retryable', () => {
  ['m1-buy-pressure', 'm1-sell-pressure', 'm1-balance'].forEach(id => {
    const b = lesson.blocks.find(x => x.id === id);
    assert.ok(b);
    assert.strictEqual(b.step, 'lesson');
    assert.ok(b.options.some(o => o.correct));
    assert.ok(b.options.some(o => !o.correct && o.feedback));
  });
});

test('lesson remains educational and non-signal', () => {
  const text = JSON.stringify(lesson).toLowerCase();
  assert.ok(text.includes('liquidité'));
  assert.ok(text.includes('contrepartie'));
  assert.ok(text.includes('sans signal'));
  assert.ok(text.includes('sans') && text.includes('prédiction'));
});

console.log(`RESULT: ${pass} integration-contract checks passed`);
