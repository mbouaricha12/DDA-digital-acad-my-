'use strict';

/* DDA mobile landing finish contract. */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'dist', 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'dist', 'alpha-polish.css'), 'utf8');

assert.match(html, /class="future-label"[^>]*>Devenir expert — bientôt/, 'landing must retain the future-label CTA');
assert.match(css, /#landing \.future-label,/, 'landing future labels must have a dedicated visual override');
assert.match(css, /rgba\(10,20,36,\.96\)/, 'future labels must use a Deep Navy surface');
assert.match(css, /#landing \.future-label span,/, 'future-label arrows must use the gold accent');
assert.match(css, /#landing\{padding-bottom:calc\(220px \+ var\(--safe-b\)\)/, 'mobile landing must reserve enough scroll clearance');
assert.match(css, /#landing \.landing-final-cta\{padding-bottom:160px\}/, 'final CTA section must clear the fixed mobile CTA');

console.log('RESULT: Landing mobile finish contract passed');
