'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const freeSource = `${read('dist/dda-core.js')}\n${read('dist/m1-1-lesson.js')}\n${read('dist/m1-3-lesson.js')}`;
const premiumSource = read('dist/p2-lessons.js');
const freeIds = ['HwlEuA39HpM', 'bUHsQnIAFuc', 'bVJ9n-Etcpc', 'pRFqhk55bL4', 'WDifN6ZKnjY'];
const premiumIds = ['BTipx88k_U8', 'rVd4dF6JaZ4', 'HaP-Onie9Lc', 'yBNc_eQbiow', 'VLdAqeJCllE'];
for (const id of freeIds) assert.match(freeSource, new RegExp(id), `Free curriculum keeps ${id}`);
for (const id of premiumIds) {
  assert.doesNotMatch(freeSource, new RegExp(id), `Premium Short ${id} must not leak into Free/M1 source`);
  assert.match(premiumSource, new RegExp(id), `Premium curriculum exposes ${id}`);
}
assert.match(read('dist/app.js'), /permission: 'premium_track'/, 'Premium lesson routes remain entitlement-gated');
assert.match(read('dist/dda-core.js'), /premiumOnly: true/, 'Premium module remains marked premium-only');
console.log('RESULT: video access separation contract passed');
