const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const academy = fs.readFileSync(path.join(root, 'dist', 'academy.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'dist', 'app.js'), 'utf8');
const market = fs.readFileSync(path.join(root, 'dist', 'market-intelligence.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'dist', 'alpha-polish.css'), 'utf8');

assert.match(academy, /Market Intelligence · BRVM/);
assert.match(academy, /La BRVM est la bourse régionale commune aux (?:huit|8) pays de l’UEMOA/);
assert.match(academy, /Information contrôlée/);
assert.match(academy, /Aucune société, date ou montant réel n’est affiché|pas de flux automatique connecté|cours, volumes et performances/i);
assert.match(academy, /brvm-provenance/);
assert.match(academy, /brvm-(?:scope-panel|data-register)/);
assert.match(market, /https:\/\/www\.brvm\.org\/fr\/cours-actions\/0/);
assert.match(market, /https:\/\/www\.brvm\.org\/fr\/resume/);
assert.match(market, /https:\/\/www\.brvm\.org\/fr\/emetteurs\/societes-cotees/);
assert.match(market, /https:\/\/www\.brvm\.org\/fr\/rapports-societes-cotees/);
assert.match(market, /calendar: Object\.freeze\(\[\]\)/);
assert.doesNotMatch(market, /Société [ABC]/);
assert.match(app, /marketDemo\(\)\.sources/);
assert.match(app, /Source officielle/);
assert.match(app, /noopener noreferrer/);
assert.match(css, /#markets \.brvm-information-desk/);
assert.match(css, /#markets \.brvm-provenance/);
assert.match(css, /@media\(max-width:720px\)/);

console.log('RESULT: BRVM information contract passed');
