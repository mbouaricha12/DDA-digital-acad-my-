'use strict';
const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const academy = fs.readFileSync(path.join(__dirname, '..', 'dist', 'academy.html'), 'utf8');
const app = fs.readFileSync(path.join(__dirname, '..', 'dist', 'app.js'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '..', 'dist', 'styles.css'), 'utf8');

const marketsStart = academy.indexOf('id="markets"');
const marketsEnd = academy.indexOf('\n      <section class="view"', marketsStart + 1);
const markets = academy.slice(marketsStart, marketsEnd < 0 ? academy.length : marketsEnd);

assert.match(markets, /id="brvm-publications-title"/, 'verified publications are mounted inside the existing Markets route');
assert.match(markets, /id="brvm-publications-list"[^>]*role="status"/, 'publication loading state is announced accessibly');
for (const field of ['Source &amp; URL', 'Date de référence', 'Vérification', 'Fraîcheur &amp; droits']) {
  assert.ok(markets.includes(field), `publication provenance field exists: ${field}`);
}
assert.match(markets, /Aucun document validé/, 'the current publication status is honest');
assert.match(markets, /Aucun lien ou chiffre n’est affiché/, 'unverified sources cannot be presented as available documents');
assert.match(app, /const BRVM_PUBLICATIONS = Object\.freeze\(\[\]\)/, 'empty publication registry fails closed until authorization and verification exist');
assert.match(app, /Aucune publication vérifiée disponible/, 'runtime empty state distinguishes verified publications from pending collection');
assert.match(css, /\.brvm-publication-requirements\{[^}]*grid-template-columns:repeat\(4/, 'publication provenance has a desktop four-column composition');
assert.match(css, /@media\(max-width:460px\)\{[\s\S]*\.brvm-publication-requirements\{grid-template-columns:1fr\}/, 'publication provenance collapses on narrow screens');
console.log('RESULT: BRVM verified publications contract passed');
