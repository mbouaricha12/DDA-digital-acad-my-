'use strict';

/* DDA Progression proof-card visual contract. */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const css = fs.readFileSync(path.join(__dirname, '..', 'dist', 'alpha-polish.css'), 'utf8');

assert.match(css, /#progress \.mastery-row-focused \.proof-timeline li\{/, 'progression proof cards must have a dedicated visual override');
assert.match(css, /rgba\(10,20,36,\.98\)/, 'proof cards must use the Deep Navy surface');
assert.match(css, /rgba\(255,255,255,\.08\)/, 'proof cards must keep a fine neutral border');
assert.match(css, /\.proof-timeline li strong\{color:#f8fafc/, 'proof-card titles must use off-white text');
assert.match(css, /\.proof-timeline li small\{color:#94a3b8/, 'proof-card secondary text must use luminous slate text');
assert.match(css, /\.proof-timeline li\.done\{border-color:rgba\(201,154,69,\.24\)/, 'validated cards must receive only a discreet gold line');

console.log('RESULT: Progression proof-card visual contract passed');
