const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const app = fs.readFileSync(path.join(__dirname, '..', 'dist', 'app.js'), 'utf8');
const academy = fs.readFileSync(path.join(__dirname, '..', 'dist', 'academy.html'), 'utf8');

assert.doesNotMatch(app, /actionEl\.textContent = `Reprendre \$\{continueTarget\.lesson\.id\}`/, 'Dashboard action must not expose the internal lesson ID');
assert.doesNotMatch(app, /Continuer \$\{next\.lesson\.title\} \(\$\{next\.lesson\.id\}\)/, 'next-step copy must not expose the internal lesson ID');
assert.doesNotMatch(app, /<span class="module-id">\$\{module\.id\}<\/span>/, 'module recap must use a learner-facing sequence label');
assert.doesNotMatch(app, /<p class="mastery-lesson">\$\{lesson\.id\} —/, 'mastery list must show the authored lesson title, not its code');
assert.doesNotMatch(app, /terminal-meta-module.*textContent = continueTarget\.lesson\.id/, 'Terminal metadata must show a module title, not a lesson code');
assert.match(app, /function learnerLessonTitle\(lessonOrId\)/, 'a single helper must translate internal lesson records into learner-facing labels');
assert.match(app, /PARCOURS DISPONIBLE COMPLÉTÉ/, 'completed curriculum copy must not expose module codes');
assert.doesNotMatch(academy, /class="prototype-banner"/, 'technical prototype banner must remain absent');

console.log('UX-2 dashboard orientation contract: PASS');
