'use strict';
const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const app = fs.readFileSync(path.join(__dirname, '..', 'dist', 'app.js'), 'utf8');
const core = fs.readFileSync(path.join(__dirname, '..', 'dist', 'dda-core.js'), 'utf8');
const academy = fs.readFileSync(path.join(__dirname, '..', 'dist', 'academy.html'), 'utf8');

assert.match(core, /candidateId = String\(raw\.id \|\| ''\).*replace\(\/\[\^A-Za-z0-9\._:-\]\//, 'Journal ids are restricted to a safe identifier alphabet at state normalization');
assert.match(app, /function escapeHtml\(value\)/, 'Journal has a context-aware HTML escaping helper');
assert.match(app, /escapeHtml\(entry\.id\)/, 'Journal entry ids are escaped before entering data-id attributes');
assert.match(app, /escapeHtml\(entry\[field\]\)/, 'Journal free-text fields are escaped before HTML rendering');
assert.match(app, /el\.innerHTML = ''[\s\S]*p\.textContent = `«/, 'Terminal Journal preview uses DOM textContent rather than interpolated HTML');
assert.doesNotMatch(app, /data-id="\$\{entry\.id\}"/, 'No raw Journal id remains in an HTML attribute');

assert.match(academy, /<section class="terminal-mi"[\s\S]*Contexte éditorial[\s\S]*Lire le contexte BRVM/, 'Terminal offers an editorial handoff to Market Intelligence');
assert.doesNotMatch(academy, /terminal-mi-row/, 'Terminal no longer renders duplicate market index cards');
assert.match(academy, /Du contexte vers le curriculum\.[\s\S]*Choisir une notion à travailler/, 'Market Intelligence hands off to the learning path');
assert.doesNotMatch(academy, /Du marché réel vers le curriculum\.[\s\S]*Revoir les fondations/, 'Market Intelligence no longer uses the generic lesson CTA');
console.log('RESULT: Journal security and Terminal/Market boundary contract passed');
