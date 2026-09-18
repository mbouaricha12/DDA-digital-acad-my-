const assert = require('assert');
const lesson = require('../dist/m1-2-lesson.js');

let pass = 0;
function test(name, fn) { fn(); pass++; console.log('PASS -', name); }

test('M1.2 exposes content expected by the existing renderer', () => {
  assert.strictEqual(lesson.id, 'M1.2');
  assert.ok(lesson.content && lesson.content.lead);
  assert.strictEqual(lesson.practice.id, 'm12-exercise');
  assert.strictEqual(lesson.evaluation.id, 'm12-quiz');
});

test('M1.2 teaches order execution without signals or prediction', () => {
  const text = JSON.stringify(lesson).toLowerCase();
  ['bid', 'ask', 'spread', 'ordre au marché', 'ordre limite', 'liquidité'].forEach(term => assert.ok(text.includes(term), term));
  assert.ok(text.includes('aucune donnée de marché réelle'));
  assert.ok(!text.includes('signal d’achat'));
  assert.ok(!text.includes('signal de vente'));
});

test('practice cases include wrong-answer feedback and retryable choices', () => {
  ['m12-market-order', 'm12-limit-order', 'm12-spread'].forEach(id => {
    const block = lesson.blocks.find(b => b.id === id);
    assert.ok(block);
    assert.ok(block.options.some(o => o.correct === true));
    assert.ok(block.options.some(o => o.correct === false && o.feedback));
  });
});

test('M1.2 has one exercise gate and one locked quiz gate', () => {
  const exercise = lesson.blocks.find(b => b.id === lesson.practice.id);
  const quiz = lesson.blocks.find(b => b.id === lesson.evaluation.id);
  assert.strictEqual(exercise.step, 'exercise');
  assert.strictEqual(quiz.step, 'quiz');
  assert.strictEqual(quiz.locked, true);
});

test('synthetic execution exercise requires reasoning across multiple price levels', () => {
  const exercise = lesson.blocks.find(b => b.id === 'm12-exercise');
  const correct = exercise.options.find(o => o.correct);
  assert.ok(correct.text.includes('50,10'));
  assert.ok(correct.text.includes('50,12'));
  assert.ok(correct.text.toLowerCase().includes('prix moyen'));
});

console.log(`RESULT: ${pass} M1.2 checks passed`);
