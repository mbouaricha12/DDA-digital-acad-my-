'use strict';

const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const source = fs.readFileSync(path.join(__dirname, '..', 'dist', 'dda-core.js'), 'utf8');

const storage = new Map();
const ctx = {
  window: {},
  localStorage: {
    getItem: key => storage.has(key) ? storage.get(key) : null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: key => storage.delete(key)
  },
  crypto: { randomUUID: () => 'test-visitor' },
  console
};
vm.runInNewContext(source, ctx);

const curriculum = ctx.window.DDA.curriculum;
const m0 = curriculum.modules.find(m => m.id === 'M0');
const m01 = m0.lessons.find(l => l.id === 'M0.1');
const m02 = m0.lessons.find(l => l.id === 'M0.2');
const m03 = m0.lessons.find(l => l.id === 'M0.3');

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log('PASS -', name);
}

test('M0 contains exactly the three authored foundation lessons in sequence', () => {
  assert.deepEqual(Array.from(m0.lessons, l => l.id), ['M0.1', 'M0.2', 'M0.3']);
});

test('M0.2 is a distinct interactive Support & Resistance lesson', () => {
  assert.strictEqual(m02.title, 'Support & Résistance');
  assert.ok(m02.blocks.some(b => b.type === 'chart_observe'));
  assert.ok(m02.blocks.some(b => b.type === 'zone_identify'));
  assert.ok(m02.blocks.some(b => b.type === 'decision_choice'));
  assert.ok(m02.blocks.some(b => b.type === 'quiz'));
});

test('M0.2 teaches zones, not exact-price certainty or trading signals', () => {
  const text = JSON.stringify(m02).toLowerCase();
  assert.ok(text.includes('zone'));
  assert.ok(text.includes('plusieurs fois'));
  assert.ok(text.includes('sans signal'));
  const affirmativeChoices = m02.blocks.flatMap(b => (b.choices || b.options || b.data?.choices || []).filter(c => c.correct === true).map(c => String(c.text || '').toLowerCase()));
  assert.ok(affirmativeChoices.every(choice => !/signal|acheter|vendre|position/.test(choice)), 'Aucune réponse correcte ne doit transformer la leçon en signal de trading.');;
});

test('M0.3 changes the competency from horizontal zones to trend direction', () => {
  assert.strictEqual(m03.title, 'Lire une tendance');
  assert.strictEqual(m03.competency.id, 'trend_reading');
  assert.ok(m03.blocks.filter(b => b.type === 'chart_observe').length >= 3);
  assert.ok(m03.blocks.some(b => b.type === 'decision_choice'));
});

test('the authored M0 chain points forward without skipping a proof gate', () => {
  const result02 = m02.blocks.find(b => b.type === 'summary');
  const result03 = m03.blocks.find(b => b.type === 'summary');
  assert.strictEqual(result02.continueTo.view, 'lesson-m03');
  assert.strictEqual(result03.continueTo.view, 'lesson-m11');
  assert.strictEqual(m01.blocks.find(b => b.type === 'summary').continueTo.view, 'lesson-m02');
});

test('all M0 lessons use the four proof stages', () => {
  [m01, m02, m03].forEach(lesson => {
    assert.deepEqual(Array.from(lesson.steps, s => s.id), ['lesson', 'exercise', 'quiz', 'review']);
  });
});

console.log(`RESULT: ${passed} M0 foundation checks passed`);
