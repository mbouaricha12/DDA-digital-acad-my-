'use strict';
const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const academy = fs.readFileSync(path.join(__dirname, '..', 'dist', 'academy.html'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '..', 'dist', 'styles.css'), 'utf8');
const audit = fs.readFileSync(path.join(__dirname, '..', 'docs', 'DDA_BRVM_PHASE1_AUDIT_2026-10-18.md'), 'utf8');

const marketsStart = academy.indexOf('id="markets"');
const marketsEnd = academy.indexOf('\n      <section class="view"', marketsStart + 1);
const markets = academy.slice(marketsStart, marketsEnd < 0 ? academy.length : marketsEnd);

assert.match(markets, /class="brvm-data-register"/, 'BRVM exposes a visible provenance register');
assert.match(markets, /Aucune source automatisée connectée/, 'the BRVM source state is honest');
assert.match(markets, /Séries synthétiques locales, clairement signalées/, 'synthetic data is labelled as synthetic');
assert.match(markets, /id="brvm-pole-title"/, 'BRVM pole roadmap is mounted in the existing Markets route');
for (const label of ['Vue d’ensemble', 'Formation BRVM', 'Actions &amp; indices', 'Obligations &amp; émetteurs', 'Fiches &amp; publications', 'Favoris &amp; listes', 'Portefeuille virtuel', 'Assistant IA BRVM']) {
  assert.ok(markets.includes(label), `BRVM roadmap includes ${label}`);
}
assert.match(markets, /Données réelles différées jusqu’à connexion validée/, 'live data remains explicitly deferred');
assert.match(css, /\.brvm-data-facts\{[\s\S]*grid-template-columns:repeat\(4/, 'provenance facts have a desktop composition');
assert.match(css, /@media\(max-width:460px\)\{[\s\S]*\.brvm-data-facts,\.brvm-pole-grid\{grid-template-columns:1fr/, 'BRVM roadmap collapses on narrow screens');
assert.match(audit, /Matrice KEEP \/ MODIFY \/ ADD \/ DEFER/, 'the phase audit contains the required delivery matrix');
assert.match(audit, /Assistant IA BRVM/, 'the phase audit covers the assistant dependency');
console.log('RESULT: BRVM phase 1 contract passed');
