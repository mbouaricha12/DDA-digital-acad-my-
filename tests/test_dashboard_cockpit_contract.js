'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
// Public landing lives in index.html; the authenticated learner shell and
// the real Dashboard live in academy.html.
const html = fs.readFileSync(path.join(root, 'dist', 'academy.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'dist', 'app.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'dist', 'styles.css'), 'utf8');

assert.ok(html.includes('class="terminal-thread dashboard-mastery-thread"'), 'Dashboard shell retains the mastery data source');
assert.ok(html.includes('id="dashboard-proof-summary"'), 'mastery data source retains proof summary');
assert.ok(html.includes('id="dashboard-proof-title"'), 'Dashboard proof data is retained');
assert.ok(html.includes('id="dashboard-action-label"'), 'Dashboard action metric remains available');
assert.ok(app.includes('function renderDashboardProof(continueTarget, curriculumComplete)'), 'Dashboard proof renderer exists');
assert.ok(app.includes("['quiz_complete', 'exercise_complete', 'lesson_understood']"), 'Dashboard proof renderer reads pedagogical proof events only');
assert.ok(app.includes("const practice = prototypeState.terminal?.practice;"), 'Dashboard proof renderer reads local Practice state');
assert.ok(app.includes('renderDashboardProof(continueTarget, curriculumComplete);'), 'Dashboard proof renderer is called from the main render cycle');
assert.ok(css.includes('#dashboard .dashboard-mastery-thread'), 'mastery thread styles remain compatible');
assert.ok(css.includes('.dashboard-proof-strip'), 'proof strip styles remain compatible');
assert.ok(css.includes('@media(max-width:700px)'), 'Dashboard cockpit has mobile rules');

console.log('RESULT: Dashboard cockpit contract passed');
