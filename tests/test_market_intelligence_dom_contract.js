'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const academy = fs.readFileSync(path.join(__dirname, '..', 'dist', 'academy.html'), 'utf8');
const app = fs.readFileSync(path.join(__dirname, '..', 'dist', 'app.js'), 'utf8');

assert.equal((academy.match(/id="market-indices"/g) || []).length, 1, 'BRVM quick-nav anchor must have exactly one market-indices id');
assert.match(academy, /class="index-grid" id="market-index-grid"/, 'indices must render into a dedicated inner grid');
assert.match(app, /getElementById\('market-index-grid'\)/, 'runtime must target the inner BRVM grid, not replace the whole section');
assert.match(app, /getElementById\('market-calendar-list'\)/, 'official BRVM source list remains mounted');

console.log('Market Intelligence DOM contract: PASS');
