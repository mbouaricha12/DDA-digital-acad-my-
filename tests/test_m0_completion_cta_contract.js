'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const app = fs.readFileSync(path.join(__dirname, '..', 'dist', 'app.js'), 'utf8');
const core = fs.readFileSync(path.join(__dirname, '..', 'dist', 'dda-core.js'), 'utf8');

assert.match(app, /function renderM0CompletionCta\(\)/, 'M0 completion CTA must have a dedicated synchronisation function');
assert.match(app, /#result-card-m3 \.result-action\[data-view="lesson-m11"\]/, 'the sync must target the real M0.3 → M1.1 result CTA');
assert.match(app, /Découvrir l’aperçu Premium : Pourquoi les prix évoluent \?/u, 'Free learners need an explicit Premium-preview label');
assert.match(app, /Continuer vers Pourquoi les prix évoluent \?/u, 'Premium learners keep the direct next-lesson label');
assert.match(app, /cta\.dataset\.m0CompletionAccess = premium \? 'premium' : 'free'/, 'the rendered CTA exposes its access state for browser assertions');
assert.match(app, /renderM0CompletionCta\(\);/, 'the CTA is refreshed with the same state render used by progression and navigation');
assert.match(core, /id: 'M0\.3'/, 'M0.3 remains authored in the curriculum');
assert.match(core, /view: 'lesson-m11'/, 'the guarded M1.1 destination remains unchanged');

console.log('M0 completion CTA contract: PASS');
