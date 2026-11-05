'use strict';
const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'dist', 'academy.html'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '..', 'dist', 'alpha-polish.css'), 'utf8');

const markets = html.slice(html.indexOf('id="markets"'), html.indexOf('\n      <section class="view"', html.indexOf('id="markets"') + 1));
assert.match(markets, /class="market-section-rail"/, 'Market Intelligence exposes a compact section rail');
for (const anchor of ['market-indices', 'market-context', 'market-sources', 'market-publications']) {
  assert.match(markets, new RegExp(`id="${anchor}"`), `Market Intelligence exposes the ${anchor} destination`);
}

const progress = html.slice(html.indexOf('id="progress"'), html.indexOf('\n      <section class="view"', html.indexOf('id="progress"') + 1));
assert.match(progress, /class="mastery-reading-guide"/, 'Mastery exposes a readable evidence/level/next-action guide');

const practice = html.slice(html.indexOf('id="practice"'), html.indexOf('\n      <section class="view"', html.indexOf('id="practice"') + 1));
assert.match(practice, /Pratique Terminal · active aujourd’hui/, 'Practice surface distinguishes active Terminal work from future tooling');
assert.match(practice, /id="practice-live-title"/, 'Practice surface provides a live Terminal handoff');
assert.match(practice, /data-scroll-to="analysis-terminal"/, 'Practice handoff lands on the real Terminal mission');
assert.match(html, /id="analysis-terminal"/, 'The real Practice Terminal remains mounted in Dashboard');

for (const selector of ['.market-section-rail', '.mastery-reading-guide', '.practice-live-handoff']) {
  assert.match(css, new RegExp(selector.replaceAll('.', '\\.'), 's'), `${selector} has dedicated styling`);
}
assert.match(css, /@media\(max-width:700px\)[\s\S]*\.practice-live-handoff/, 'Practice handoff has a mobile layout');
console.log('RESULT: UX pass 2 contract passed');
