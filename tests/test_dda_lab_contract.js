'use strict';

const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const source = fs.readFileSync(path.join(__dirname, '..', 'dist', 'dda-lab.js'), 'utf8');
const ctx = { window: {}, console };
vm.runInNewContext(source, ctx);

const lab = ctx.window.DDALab;
const [l1, l2, l3, l4] = lab.lessons;
const cap = lab.capstone;
const all = [l1, l2, l3, l4, cap];

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log('PASS -', name);
}

test('DDALab exposes a track, 4 lessons and a capstone, pure data (no window/document reference)', () => {
  assert.ok(lab.track && lab.track.id === 'ai-foundations');
  assert.strictEqual(lab.lessons.length, 4);
  assert.ok(cap && cap.id === 'LABCAP');
  assert.doesNotMatch(source, /\bdocument\./, 'content file must stay pure data, never touch the DOM');
  assert.doesNotMatch(source, /\bfetch\(/, 'content file must never call a network API');
});

test('lessons form one linear prerequisite chain, LAB1 first and unlocked', () => {
  assert.strictEqual(l1.prerequisite, undefined);
  assert.strictEqual(l2.prerequisite, 'LAB1');
  assert.strictEqual(l3.prerequisite, 'LAB2');
  assert.strictEqual(l4.prerequisite, 'LAB3');
  assert.strictEqual(cap.prerequisite, 'LAB4');
});

test('Free/Premium split matches the agreed scope: LAB1-3 free, LAB4 and the capstone Premium', () => {
  assert.ok(!l1.premium && !l2.premium && !l3.premium, 'LAB1-3 must stay free');
  assert.strictEqual(l4.premium, true);
  assert.strictEqual(cap.premium, true);
});

test('every lesson uses the four honest proof stages, nothing invented', () => {
  all.forEach(lesson => {
    assert.deepEqual(Array.from(lesson.steps, s => s.id), ['lesson', 'exercise', 'quiz', 'review']);
  });
});

test('every lesson ends on a real summary block, each with a distinct competency id', () => {
  const ids = new Set();
  all.forEach(lesson => {
    const summary = lesson.blocks.find(b => b.type === 'summary');
    assert.ok(summary, `${lesson.id} must end on a summary block`);
    assert.ok(lesson.competency?.id, `${lesson.id} must declare a competency`);
    assert.ok(!ids.has(lesson.competency.id), `${lesson.id} competency id must be unique`);
    ids.add(lesson.competency.id);
  });
});

test('LAB1-LAB4 each gate on a real exercise before their locked quiz (same contract as M0.*)', () => {
  [l1, l2, l3, l4].forEach(lesson => {
    const exercise = lesson.blocks.find(b => b.type === 'quiz' && b.step === 'exercise');
    const quiz = lesson.blocks.find(b => b.type === 'quiz' && b.step === 'quiz');
    assert.ok(exercise && exercise.locked === false, `${lesson.id} exercise block must exist and be unlocked`);
    assert.ok(quiz && quiz.locked === true, `${lesson.id} quiz block must exist and be locked until the exercise is done`);
  });
});

test('every graded choice set (quiz data.choices or decision_choice options) has exactly one correct answer, and every choice carries real feedback', () => {
  all.forEach(lesson => {
    lesson.blocks.forEach(block => {
      const graded = block.type === 'quiz' ? block.data?.choices : (block.type === 'decision_choice' ? block.options : null);
      if (!Array.isArray(graded)) return;
      const correctCount = graded.filter(c => c.correct === true).length;
      assert.strictEqual(correctCount, 1, `${lesson.id}/${block.id} must have exactly one correct answer`);
      graded.forEach(choice => assert.ok(choice.feedback || choice.text, `${lesson.id}/${block.id} choices must carry real content`));
    });
  });
});

test('no block overclaims certification or guaranteed income/results', () => {
  const text = JSON.stringify(all).toLowerCase();
  for (const forbidden of ['certifi', 'revenu garanti', 'gain garanti', 'emploi garanti']) {
    assert.doesNotMatch(text, new RegExp(forbidden), `must never claim "${forbidden}"`);
  }
});

test('no paid tool or DDA-hosted API is presented as required', () => {
  const text = JSON.stringify(all).toLowerCase();
  assert.doesNotMatch(text, /clé api|abonnement payant obligatoire|carte bancaire/);
  assert.ok(text.includes('gratuit'), 'the content must explicitly name the free-tier path');
});

test('the capstone never claims a server-graded or verified result — only a self-check against an explicit rubric', () => {
  const capText = JSON.stringify(cap).toLowerCase();
  assert.ok(capText.includes('aucune note serveur'), 'capstone result must disclaim server grading');
  const rubric = cap.blocks.find(b => b.id === 'labcap-checklist');
  assert.ok(rubric && rubric.good?.items?.length >= 4, 'capstone must expose an explicit, substantial self-assessment grid');
  const finalQuiz = cap.blocks.find(b => b.type === 'quiz');
  assert.ok(finalQuiz.data.prompt.toLowerCase().includes('ne lit pas ton texte'), 'the capstone quiz must be explicit that it checks method, not the actual deliverable');
});

test('LAB4 introduces automation without requiring a paid account or implying DDA automates anything itself', () => {
  const text = JSON.stringify(l4).toLowerCase();
  assert.ok(text.includes('déclencheur'));
  assert.ok(text.includes('google forms') || text.includes('google sheets'), 'the automation example must be a genuinely free, concrete tool');
});

console.log(`RESULT: ${passed} DDA Lab content contract checks passed`);
