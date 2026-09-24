const assert = require('assert');
const lesson = require('../dist/m1-3-lesson.js');

let pass = 0;
function test(name, fn) { fn(); pass++; console.log('PASS -', name); }

test('M1.3 exposes content expected by the existing renderer', () => {
  assert.strictEqual(lesson.id, 'M1.3');
  assert.ok(lesson.content && lesson.content.lead);
  assert.strictEqual(lesson.practice.id, 'm13-exercise');
  assert.strictEqual(lesson.evaluation.id, 'm13-quiz');
  assert.deepStrictEqual(lesson.steps.map(s => s.id), ['lesson', 'exercise', 'quiz', 'review']);
});

test('M1.3 teaches market organization without signals, prediction or promises', () => {
  const text = JSON.stringify(lesson).toLowerCase();
  ['émetteur', 'investisseurs', 'intermédiaire', 'bourse', 'brvm', 'uemoa', 'primaire', 'secondaire']
    .forEach(term => assert.ok(text.includes(term), term));
  // Aucune promesse, aucun signal, aucune donnée chiffrée inventée.
  ['signal d’achat', 'signal de vente', 'gain garanti', 'rendement garanti', 'profit assuré']
    .forEach(term => assert.ok(!text.includes(term), `forbidden promise leaked: ${term}`));
  assert.ok(!/[0-9]+[,.][0-9]{2}/.test(text), 'no fabricated price-like figures');
});

test('practice cases include wrong-answer feedback and retryable choices', () => {
  ['m13-actor', 'm13-market-type', 'm13-organized'].forEach(id => {
    const block = lesson.blocks.find(b => b.id === id);
    assert.ok(block, id);
    assert.ok(block.options.some(o => o.correct === true));
    block.options.filter(o => o.correct === false).forEach(o => {
      assert.ok(typeof o.feedback === 'string' && o.feedback.length > 20, `${id}: every wrong option must explain, not just fail`);
    });
  });
});

test('M1.3 has one exercise gate and one locked quiz gate', () => {
  const exercise = lesson.blocks.find(b => b.id === lesson.practice.id);
  const quiz = lesson.blocks.find(b => b.id === lesson.evaluation.id);
  assert.strictEqual(exercise.step, 'exercise');
  assert.strictEqual(quiz.step, 'quiz');
  assert.strictEqual(quiz.locked, true);
});

test('the integrated exercise spans both markets — émission primaire, puis revente secondaire', () => {
  const exercise = lesson.blocks.find(b => b.id === 'm13-exercise');
  const correct = exercise.options.find(o => o.correct);
  assert.ok(correct.text.toLowerCase().includes('primaire'));
  assert.ok(correct.text.toLowerCase().includes('secondaire'));
  // Chaque mauvaise option réfute explicitement la confusion primaire/secondaire.
  exercise.options.filter(o => !o.correct).forEach(o => {
    assert.ok(o.feedback.toLowerCase().includes('secondaire') || o.feedback.toLowerCase().includes('émetteur'), 'wrong options refute the primary/secondary confusion');
  });
});

test('the result summary closes honestly: map of actors learned, no recommendation invented', () => {
  const summary = lesson.blocks.find(b => b.type === 'summary');
  assert.ok(summary.data.heading.includes('Compréhension de l’organisation des marchés confirmée'));
  const body = summary.data.body.toLowerCase();
  assert.ok(body.includes('recommandation') && body.includes('signal'), 'the body restates what DDA never does');
  assert.ok(!summary.continueTo, 'M1.3 closes the authored M1 path — no M2 CTA invented');
});

console.log(`RESULT: ${pass} M1.3 checks passed`);
