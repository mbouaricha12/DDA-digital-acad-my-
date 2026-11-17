const assert = require('assert');
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '../dist/academy.html'), 'utf8');
const app = fs.readFileSync(path.join(__dirname, '../dist/app.js'), 'utf8');
const core = fs.readFileSync(path.join(__dirname, '../dist/dda-core.js'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '../dist/styles.css'), 'utf8');

assert.match(html, /id="terminal-hypothesis"/, 'Terminal exposes a dedicated hypothesis field');
assert.match(html, /Mon hypothèse à vérifier/, 'hypothesis field is explicitly framed as provisional');
assert.match(app, /hypothesis: prototypeState\.terminal\?\.hypothesis \|\| ''/, 'hypothesis is read from the Terminal state');
assert.match(app, /update\(\{ observation, hypothesis \}\)/, 'observation and hypothesis are saved together');
assert.match(app, /Fait observé : \$\{state\.observation\}/, 'Journal context keeps the observed fact');
assert.match(app, /scenario: state\.hypothesis \|\| state\.observation/, 'Journal scenario receives the learner hypothesis');
assert.match(app, /Hypothèse séparée des faits avant transfert/, 'handoff preserves the observation-versus-interpretation distinction');
assert.match(core, /hypothesis: ''/, 'Terminal empty state declares hypothesis');
assert.match(core, /terminal\.hypothesis = sanitizeText\(raw\.hypothesis, 1000\)/, 'hypothesis is sanitized locally');
assert.match(css, /terminal-reflection-field/, 'observation and hypothesis fields have dedicated responsive styling');
console.log('RESULT: Terminal observation/hypothesis loop contract passed');
