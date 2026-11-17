const assert = require('assert');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '../dist/index.html'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '../dist/alpha-polish.css'), 'utf8');
const minCss = fs.readFileSync(path.join(__dirname, '../dist/alpha-polish.min.css'), 'utf8');

assert.match(html, /class="landing-proof-rail"/, 'Landing exposes a visible proof rail under the hero');
assert.match(html, /03[\s\S]*leçons M0 publiées/, 'proof rail states the three published M0 lessons');
assert.match(html, /04[\s\S]*outils du Terminal/, 'proof rail states the four Terminal tools');
assert.match(html, /01[\s\S]*preuve locale à construire/, 'proof rail frames progress as a local proof, not a fake metric');
assert.match(html, />0<\/strong>[\s\S]*cotation live ou signal/, 'proof rail makes the no-live-signal boundary explicit');
assert.match(css, /\.landing-proof-rail\{/, 'proof rail has authored visual styling');
assert.match(css, /@media\(max-width:860px\)/, 'proof rail has a responsive layout');
assert.match(minCss, /\.landing-proof-rail\{/, 'minified CSS served by the site contains the proof rail styling');
console.log('RESULT: Landing visible proof rail contract passed');
