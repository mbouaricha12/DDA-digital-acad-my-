const assert = require('assert');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '../dist/index.html'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '../dist/alpha-polish.css'), 'utf8');
const minCss = fs.readFileSync(path.join(__dirname, '../dist/alpha-polish.min.css'), 'utf8');
const followupCss = fs.readFileSync(path.join(__dirname, '../dist/landing-3d.css'), 'utf8');

// Hero follow-up: the verified Free benefits and numeric evidence sit in one
// responsive band below the existing human-led scene; no claim is fabricated.
assert.match(html, /class="landing-proof-band"/, 'benefits and numeric evidence share a single band below the hero');
assert.match(html, /class="landing-proof-rail"/, 'Landing exposes a visible proof rail under the hero');
assert.ok(html.indexOf('class="landing-aperture') < html.indexOf('class="landing-proof-band"'), 'the proof band follows the human-led scene');
assert.match(html, /class="hero-feature-card"/, 'hero exposes the four-card reference rail (Academy Free/DDA Lab/DDA AI/Ressources)');
assert.match(html, /Academy Free/, 'reference rail names Academy Free');
assert.match(html, />DDA Lab</, 'reference rail names DDA Lab');
assert.match(html, /03[\s\S]*leçons de fondation publiées/, 'proof rail states the three published M0 lessons');
assert.match(html, /04[\s\S]*outils du Terminal/, 'proof rail states the four Terminal tools');
assert.match(html, /01[\s\S]*preuve locale à construire/, 'proof rail frames progress as a local proof, not a fake metric');
assert.match(html, />0<\/strong>[\s\S]*donnée live ou signal/, 'proof rail makes the no-live-signal boundary explicit');
assert.match(css, /\.landing-proof-rail\{/, 'proof rail has authored visual styling');
assert.match(css, /@media\(max-width:860px\)/, 'proof rail has a responsive layout');
assert.match(followupCss, /landing-proof-band\{/, 'the grouped evidence band has authored styling');
assert.match(followupCss, /@media\(max-width:899px\)/, 'the grouped evidence band stacks responsively');
assert.match(css, /\.landing-reference-stack\{/, 'reference rail has authored visual styling');
assert.match(css, /@media\(max-width:899px\)/, 'reference rail has a responsive layout');
assert.match(minCss, /\.landing-proof-rail\{/, 'minified CSS served by the site contains the proof rail styling');
assert.match(minCss, /\.landing-reference-stack\{/, 'minified CSS served by the site contains the reference rail styling');
console.log('RESULT: Landing visible proof rail contract passed');
