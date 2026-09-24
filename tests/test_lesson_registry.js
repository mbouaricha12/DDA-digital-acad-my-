'use strict';

/*
 * DDA — Lesson Registry structural contract.
 *
 * dist/app.js declares every rendered lesson ONCE in LESSON_REGISTRY (pure
 * data) and derives mounting, screen titles, permissions, routes, the
 * sequential gate, the progress-UI ids and the question bindings from it.
 * This test proves the registry is coherent with everything it drives:
 *
 *   1. the registry literal itself is pure data (vm-evaluated verbatim) ;
 *   2. it covers exactly the authored curriculum, in order, no orphan lesson ;
 *   3. every declared mount point exists in dist/index.html ;
 *   4. every question descriptor points at a real block of the real lesson,
 *      with the role/step/gate conventions the interaction layer expects ;
 *   5. the ids app.js derives (lessonUiIds) are ids the REAL renderer
 *      actually emits for that lesson — rendered here, not string-sniffed ;
 *   6. the sequential gate (prerequisite) follows the authored curriculum
 *      order, never a divergent hand-written chain.
 *
 * Run with: node tests/test_lesson_registry.js
 */

const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const root = path.join(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'dist', 'app.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'dist', 'index.html'), 'utf8');

let pass = 0;
function test(name, fn) { fn(); pass++; console.log('PASS -', name); }

// --- Load the registry literal exactly as data -----------------------------

const registryMatch = app.match(/const LESSON_REGISTRY = Object\.freeze\(\[([\s\S]*?)\n\]\);/);
assert.ok(registryMatch, 'LESSON_REGISTRY literal must exist in app.js');
const REGISTRY = vm.runInNewContext(`[${registryMatch[1]}]`, {});

// --- Load the real curriculum the way dda-core.js builds it ----------------

const coreCtx = {
  window: {},
  console,
  localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  crypto: { randomUUID: () => 'test-visitor' },
  // M1.1/M1.2/M1.3 and M2.1 are authored in their own files and promoted into
  // the curriculum by dda-core.js via these globals — same mechanism as the
  // browser scripts.
  DDAM1GoldenLesson: require('../dist/m1-1-lesson.js'),
  DDAM12GoldenLesson: require('../dist/m1-2-lesson.js'),
  DDAM13GoldenLesson: require('../dist/m1-3-lesson.js'),
  DDAM21GoldenLesson: require('../dist/m2-1-lesson.js')
};
vm.runInNewContext(fs.readFileSync(path.join(root, 'dist', 'dda-core.js'), 'utf8'), coreCtx);
const DDA = coreCtx.window.DDA;
vm.runInNewContext(fs.readFileSync(path.join(root, 'dist', 'lesson-renderer.js'), 'utf8'), coreCtx);
const Renderer = coreCtx.window.DDALessonRenderer;

function flatAuthoredLessons(curriculum) {
  const flat = [];
  curriculum.modules.forEach(module => module.lessons.forEach(lesson => flat.push({ module, lesson })));
  return flat;
}

const authored = flatAuthoredLessons(DDA.curriculum);

// Mirrors app.js's lessonUiIds() — asserted below against real rendered ids.
function uiIds(entry) {
  const suffix = entry.suffix ? `-${entry.suffix}` : '';
  return {
    loopId: `lesson-loop${suffix}`,
    outlineListId: `lesson-outline-list${suffix}`,
    gateId: `${entry.quizBlock}-block`,
    evalName: entry.quizBlock,
    resultId: `result-card${suffix}`,
    markUnderstoodId: `mark-understood${suffix}`,
    savedStateId: `saved-state${suffix}`,
    resultStatsId: `result-stats${suffix}`
  };
}

// --- Contract tests ---------------------------------------------------------

test('registry covers exactly every authored curriculum lesson, in curriculum order', () => {
  // vm-created arrays carry the vm realm's Array prototype — Array.from
  // rebuilds them in this realm before deepStrictEqual (cross-realm pitfall).
  assert.deepStrictEqual(Array.from(REGISTRY, e => e.id), Array.from(authored, x => x.lesson.id));
  assert.strictEqual(REGISTRY[0].id, DDA.primaryLessonId, 'primary lesson must stay the first registry entry');
});

test('ids, views and suffixes are unique across the registry', () => {
  const ids = REGISTRY.map(e => e.id);
  const views = REGISTRY.map(e => e.viewId);
  const suffixes = REGISTRY.map(e => e.suffix).filter(Boolean);
  assert.strictEqual(new Set(ids).size, ids.length, 'duplicate lesson id');
  assert.strictEqual(new Set(views).size, views.length, 'duplicate view id');
  assert.strictEqual(new Set(suffixes).size, suffixes.length, 'duplicate id suffix');
});

test('every registered lesson has its mount points in index.html', () => {
  REGISTRY.forEach(entry => {
    ['', '-main', '-outline'].forEach(suffix => {
      assert.ok(html.includes(`id="${entry.viewId}${suffix}"`), `missing mount point #${entry.viewId}${suffix}`);
    });
    assert.ok(typeof entry.title === 'string' && entry.title.length > 3, `screen title for ${entry.id}`);
  });
});

test('every registered lesson keeps the two-gate convention (exercise → locked quiz) on real blocks', () => {
  REGISTRY.forEach(entry => {
    const { lesson } = authored.find(x => x.lesson.id === entry.id);
    const quizBlocks = lesson.blocks.filter(b => b.type === 'quiz' && b.locked === true);
    assert.strictEqual(quizBlocks.length, 1, `${entry.id}: exactly one locked quiz gate`);
    assert.strictEqual(quizBlocks[0].id, entry.quizBlock, `${entry.id}: quizBlock points at the locked quiz`);
    assert.strictEqual(quizBlocks[0].data.id, entry.quizBlock, `${entry.id}: quiz data id drives gate/evalName ids`);
    const exerciseCount = entry.questions.filter(q => q.role === 'exercise').length;
    const quizCount = entry.questions.filter(q => q.role === 'quiz').length;
    assert.strictEqual(exerciseCount, 1, `${entry.id}: exactly one exercise binding`);
    assert.strictEqual(quizCount, 1, `${entry.id}: exactly one quiz binding`);
  });
});

test('question descriptors resolve against real authored blocks with honest conventions', () => {
  REGISTRY.forEach(entry => {
    const { lesson } = authored.find(x => x.lesson.id === entry.id);
    const seen = new Set();
    entry.questions.forEach(question => {
      assert.ok(['practice', 'exercise', 'quiz'].includes(question.role), `${entry.id}/${question.block}: known role`);
      const block = lesson.blocks.find(b => b.id === question.block);
      assert.ok(block, `${entry.id}: block ${question.block} exists in the authored lesson`);
      assert.ok(!seen.has(question.block), `${entry.id}: block ${question.block} bound once`);
      seen.add(question.block);
      const expectedStep = question.role === 'practice' ? 'lesson' : question.role === 'exercise' ? 'exercise' : 'quiz';
      assert.strictEqual(block.step, expectedStep, `${entry.id}/${question.block}: role and block step agree`);
      if (question.gate) assert.strictEqual(question.role, 'exercise', `${entry.id}/${question.block}: only the exercise gates the quiz`);
      if (question.result) assert.strictEqual(question.role, 'quiz', `${entry.id}/${question.block}: only the quiz opens the result card`);
      if (question.role === 'practice') {
        assert.ok(!question.gate && !question.result, `${entry.id}/${question.block}: a practice check never fakes a gate`);
      }
      if (question.reveal) assert.ok(block.reveal, `${entry.id}/${question.block}: reveal implies an authored reveal text`);
      if (question.success === '@block') assert.ok(block.successText, `${entry.id}/${question.block}: @block needs block.successText`);
      if (question.success === '@practice') assert.ok(lesson.practice?.successText, `${entry.id}/${question.block}: @practice needs lesson.practice.successText`);
      if (question.success === '@data') assert.ok(block.data?.successText, `${entry.id}/${question.block}: @data needs quiz data.successText`);
    });
  });
});

test('the sequential gate follows the real authored curriculum order', () => {
  REGISTRY.forEach((entry, index) => {
    if (index === 0) assert.ok(!entry.prerequisite, 'the first lesson has no prerequisite');
    else assert.strictEqual(entry.prerequisite, REGISTRY[index - 1].id, `${entry.id} must be gated behind the previous authored lesson`);
  });
});

test('the « j\'ai compris » scroll anchor and the summary suffix match each lesson', () => {
  REGISTRY.forEach(entry => {
    const { lesson } = authored.find(x => x.lesson.id === entry.id);
    assert.ok(lesson.blocks.some(b => `${b.id}-block` === entry.understoodScrollTo), `${entry.id}: understoodScrollTo targets a real block`);
    const summary = lesson.blocks.find(b => b.type === 'summary');
    assert.ok(summary, `${entry.id}: a summary/result block exists`);
    assert.strictEqual(summary.idSuffix || '', entry.suffix, `${entry.id}: summary idSuffix matches the registry suffix`);
    if (summary.continueTo) {
      assert.ok(REGISTRY.some(other => other.viewId === summary.continueTo.view), `${entry.id}: continueTo points at a registered view`);
    }
  });
});

test('lessonUiIds-derived ids are ids the REAL renderer emits for each lesson', () => {
  REGISTRY.forEach(entry => {
    const { module, lesson } = authored.find(x => x.lesson.id === entry.id);
    const main = Renderer.renderLessonMain(module, lesson, entry.suffix || undefined);
    const outline = Renderer.renderLessonOutline(lesson, entry.suffix || undefined);
    const ui = uiIds(entry);
    // understoodScrollTo is asserted here against RENDERED markup, not only
    // against block data (the anchor test above): a block type that renders
    // no id would leave a silently dead « j'ai compris » scroll — the exact
    // pre-M1.3 case_study bug fixed by giving that block an id.
    [ui.loopId, ui.gateId, ui.resultId, ui.markUnderstoodId, ui.resultStatsId, `data-question="${ui.evalName}"`, `id="${entry.understoodScrollTo}"`]
      .forEach(token => assert.ok(main.includes(token), `${entry.id}: main markup carries ${token}`));
    [ui.outlineListId, ui.savedStateId]
      .forEach(token => assert.ok(outline.includes(token), `${entry.id}: outline markup carries ${token}`));
  });
});

test('app.js actually derives its maps from the registry (no parallel hand-written lists)', () => {
  [
    'const LESSON_VIEW_ID = Object.freeze(Object.fromEntries(LESSON_REGISTRY.map(',
    'const LESSON_PREREQUISITE = Object.freeze(Object.fromEntries(LESSON_REGISTRY.filter(',
    '...Object.fromEntries(LESSON_REGISTRY.map(entry => [entry.viewId, entry.title]))',
    "...Object.fromEntries(LESSON_REGISTRY.map(entry => [entry.viewId, entry.permission || 'lesson_m01']))",
    'renderLessonProgressUI(entry.id, entry.meta.lesson, lessonUiIds(entry))',
    'mountedLessons.forEach(bindRegistryQuestions)'
  ].forEach(token => assert.ok(app.includes(token), `app.js derives: ${token.slice(0, 60)}…`));
});

test('registry declares the honest entitlement tier for each lesson (CDCP-OS §4.2 / D1 Option B)', () => {
  REGISTRY.forEach(entry => {
    if (entry.id.startsWith('M0.')) {
      assert.strictEqual(entry.permission || 'lesson_m01', 'lesson_m01', `${entry.id} belongs to Free/Découverte tier (lesson_m01)`);
    } else {
      assert.strictEqual(entry.permission, 'advanced_modules', `${entry.id} requires Standard/Pro tier (advanced_modules)`);
    }
  });
});

console.log(`\nRESULT: ${pass} Lesson Registry structural checks passed`);
