'use strict';

/* DDA mobile gutter and sticky-CTA clearance contract. */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const css = fs.readFileSync(path.join(__dirname, '..', 'dist', 'alpha-polish.css'), 'utf8');

assert.match(css, /\.view:not\(#landing\)\{/, 'authenticated mobile views must share a dedicated gutter rule');
assert.match(css, /padding-left:16px;\s*padding-right:16px;/, 'mobile primary views must use symmetric 16px gutters');
assert.match(css, /#landing \.landing-editorial-shell,/, 'landing editorial shell must use the shared mobile grid');
assert.match(css, /#landing\{padding-bottom:calc\(240px \+ var\(--safe-b\)\);scroll-padding-bottom:240px\}/, 'landing must reserve secure bottom clearance above the sticky CTA');
assert.match(css, /#landing \.landing-final-cta\{padding-bottom:180px\}/, 'final CTA section must retain independent bottom breathing room');

console.log('RESULT: Mobile gutter and CTA clearance contract passed');
