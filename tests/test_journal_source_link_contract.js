const assert = require('assert');
const fs = require('fs');
const path = require('path');
const app = fs.readFileSync(path.join(__dirname, '../dist/app.js'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '../dist/styles.css'), 'utf8');

assert.ok(app.includes("const sourceView = entry.sourceLesson === 'M0.2' ? 'lesson-m02' : ''"), 'Journal maps M0.2 proof to its real lesson view');
assert.ok(app.includes('journal-proof-source'), 'Journal renders a source lesson link for proof entries');
assert.ok(app.includes("showView(sourceButton.dataset.view)"), 'source link uses the existing view router');
assert.ok(css.includes('.journal-proof-source'), 'source lesson link is styled');
console.log('RESULT: Journal → source lesson navigation contract passed');
