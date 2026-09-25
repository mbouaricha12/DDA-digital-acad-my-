const assert = require('assert');
const fs = require('fs');
const path = require('path');
const app = fs.readFileSync(path.join(__dirname, '../dist/app.js'), 'utf8');

assert.ok(app.includes("id: 'm02-zone-identification'"), 'proof has a stable M0.2 identifier');
assert.ok(app.includes("type: 'zone_identification'"), 'proof has an explicit pedagogical type');
assert.ok(app.includes('lessonId: state.practice?.sourceLesson || \'M0.2\''), 'proof keeps its lesson source');
assert.ok(app.includes('const proof = practice.proof || {}'), 'Progression reads the typed proof object');
assert.ok(app.includes('Preuve ${proof.id || \'locale\'}'), 'Progression displays proof identity');
assert.ok(app.includes('ne compte pas comme compétence acquise'), 'proof remains distinct from competency validation');
console.log('RESULT: Typed M0.2 practice proof contract passed');
