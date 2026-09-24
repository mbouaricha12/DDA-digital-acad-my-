const assert = require('assert');
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '../dist/index.html'), 'utf8');
const app = fs.readFileSync(path.join(__dirname, '../dist/app.js'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '../dist/styles.css'), 'utf8');

assert.ok(html.includes('terminal-practice-mission'), 'guided mission exists inside the Terminal');
assert.ok(html.includes('terminal-practice-validate'), 'mission exposes a validation action');
assert.ok(html.includes('Repère une zone, sans chercher à prédire.'), 'mission stays educational and non-predictive');
assert.ok(app.includes("const zones = state.drawings.filter(drawing => drawing.type === 'zone')"), 'validation reads the learner zone annotation');
assert.ok(app.includes("status: 'validated'"), 'successful practice creates a local proof status');
assert.ok(app.includes("status: 'retry'"), 'incorrect practice remains retryable');
assert.ok(app.includes('Preuve conservée localement'), 'feedback never claims market performance');
assert.ok(app.includes('completedAt: new Date().toISOString()'), 'successful proof has a local timestamp');
assert.ok(css.includes('.terminal-practice-mission'), 'mission has dedicated responsive styling');
console.log('RESULT: Practice Terminal guided mission contract passed');
