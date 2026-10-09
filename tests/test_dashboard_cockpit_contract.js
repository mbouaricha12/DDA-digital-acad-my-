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

assert.ok(html.includes('class="terminal-thread dashboard-mastery-thread"'), 'Dashboard header exposes the mastery thread');
assert.ok(html.includes('id="dashboard-proof-summary"'), 'mastery header exposes a proof summary');
assert.ok(html.includes('id="dashboard-proof-title"'), 'Dashboard contains a dedicated recent-proof surface');
assert.ok(html.includes('id="dashboard-action-label"'), 'Today cockpit exposes one action label');
assert.ok(app.includes('function renderDashboardProof(continueTarget, curriculumComplete)'), 'Dashboard proof renderer exists');
assert.ok(app.includes("['quiz_complete', 'exercise_complete', 'lesson_understood']"), 'Dashboard proof renderer reads pedagogical proof events only');
assert.ok(app.includes("const practice = prototypeState.terminal?.practice;"), 'Dashboard proof renderer reads local Practice state');
assert.ok(app.includes('renderDashboardProof(continueTarget, curriculumComplete);'), 'Dashboard proof renderer is called from the main render cycle');
assert.ok(css.includes('#dashboard .dashboard-mastery-thread'), 'mastery thread has dedicated Dashboard styling');
assert.ok(css.includes('.dashboard-proof-strip'), 'recent proof strip has dedicated styling');
assert.ok(css.includes('@media(max-width:700px)'), 'Dashboard cockpit has mobile rules');

console.log('RESULT: Dashboard cockpit contract passed');
