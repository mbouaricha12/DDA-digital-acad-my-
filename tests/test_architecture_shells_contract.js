'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..', 'dist');
const publicHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const academyHtml = fs.readFileSync(path.join(root, 'academy.html'), 'utf8');
const publicJs = fs.readFileSync(path.join(root, 'public.js'), 'utf8');
const fallbackHtml = fs.readFileSync(path.join(root, '404.html'), 'utf8');

assert.match(publicHtml, /data-layer="public"/);
assert.match(publicHtml, /id="landing"/);
assert.match(publicHtml, /public\.js/);
assert.match(publicHtml, /dda-core\.js/);
assert.doesNotMatch(publicHtml, /src="app\.js"|src="learning-engine\.js"|src="lesson-renderer\.js"|src="bff-client\.js"/,
  'public shell must not load learner or authenticated runtime scripts');
assert.doesNotMatch(publicHtml, /id="academy-shell"|class="sidebar"|id="dashboard"|id="journal"|id="progress"/,
  'public shell must not mount Academy views or authenticated chrome');
assert.match(academyHtml, /data-layer="academy"/);
assert.match(academyHtml, /id="academy-shell"/);
assert.match(academyHtml, /id="dashboard"/);
assert.match(academyHtml, /id="journal"/);
assert.match(academyHtml, /id="progress"/);
assert.match(academyHtml, /src="app\.js"/);
assert.doesNotMatch(academyHtml, /src="public\.js"/,
  'Academy shell must not load public-only runtime scripts');
assert.doesNotMatch(academyHtml, /id="landing"|class="public-header"|class="landing-editorial-shell"/,
  'Academy shell must not mount the public marketing landing');
assert.match(publicJs, /academy\.html/);
assert.match(publicJs, /window\.location\.assign/);
assert.match(fallbackHtml, /location\.replace/);
assert.match(fallbackHtml, /index\.html/);
console.log('RESULT: physical public/Academy shell contract passed');
