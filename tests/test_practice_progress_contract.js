const assert = require('assert');
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '../dist/index.html'), 'utf8');
const app = fs.readFileSync(path.join(__dirname, '../dist/app.js'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '../dist/styles.css'), 'utf8');

assert.ok(html.includes('practice-proof-panel'), 'Progression exposes a distinct practice proof panel');
assert.ok(html.includes('progress-practice-proof'), 'Progression has a stable proof mount point');
assert.ok(app.includes('practice: prototypeState.terminal?.practice || null'), 'terminal practice proof remains readable after persistence');
assert.ok(app.includes('function renderPracticeProof()'), 'Progression has a dedicated proof renderer');
assert.ok(app.includes('renderPracticeProof();'), 'proof renderer runs with the main render cycle');
assert.ok(app.includes('ne compte pas comme compétence acquise'), 'retry state is not presented as competency');
assert.ok(css.includes('.practice-proof-row.is-validated'), 'validated proof has a distinct visual treatment');
console.log('RESULT: Practice → Progression contract passed');
