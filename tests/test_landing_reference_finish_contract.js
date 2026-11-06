'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'dist','index.html'),'utf8');
const css=fs.readFileSync(path.join(root,'dist','alpha-polish.css'),'utf8');
const js=fs.readFileSync(path.join(root,'dist','public.js'),'utf8');
assert.match(html,/class="public-utility-bar"/);
assert.match(html,/class="landing-trust-strip"/);
assert.match(html,/class="landing-market-strip"/);
assert.match(html,/BRVM COMPOSITE/);
assert.match(css,/#landing \.landing-trust-strip/);
assert.match(css,/#landing \.landing-market-strip/);
// The CTA button uses the shared blue→cyan "genuine action" gradient (AURORA
// tokens), never a one-off #landing override — a duplicate green override of
// this exact selector was the landing/Academy palette rupture fixed in Lot B.
assert.match(css,/\.primary-action,\.public-start,\.landing-mobile-cta button[^{]*\{\s*border:1px solid rgba\(113,194,255,\.58\);\s*background:linear-gradient\(112deg,#155fde/);
assert.doesNotMatch(css,/\#landing \.public-start\{background:linear-gradient/);
// landing-3d-core/orbit/node keep their gold base + blue glow overlay
// (AURORA tokens); no green override duplicates these selectors.
assert.doesNotMatch(css,/\#landing \.landing-3d-core\{border-color/);
assert.doesNotMatch(css,/#(?:77c96e|a4e48e|83d18b|9ce59d|80c99b|8fd796|58d99b)\b/i);
assert.doesNotMatch(js,/'.landing-experience',\s*'\.experience-flow/);
console.log('RESULT: landing reference finish contract passed');
