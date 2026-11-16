'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'dist', 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'dist', 'alpha-polish.css'), 'utf8');

assert.match(html, /id="landing-title"/, 'the public Hero must keep a labelled primary heading');
assert.match(html, /data-analytics="hero_cta_click"/, 'the Hero CTA analytics hook must remain intact');
assert.match(html, /data-3d-scene="dda-orbit"/, 'the DDA orbit scene must remain mounted');
assert.match(html, /class="landing-device-stage"/, 'the product mockup must remain mounted');
assert.match(css, /@media \(min-width:900px\)\{[\s\S]*#landing \.landing-3d-scene\{[\s\S]*z-index:3;[\s\S]*opacity:\.72;/, 'desktop orbit must remain visibly layered over the mockup');
assert.match(css, /@media \(max-width:899px\)\{[\s\S]*#landing \.landing-3d-scene\{[\s\S]*opacity:\.62;/, 'responsive orbit must remain perceptible below desktop');
assert.match(css, /@media \(max-width:700px\)\{[\s\S]*#landing \.landing-3d-scene\{animation:none!important\}/, 'mobile orbit must be static for performance and reduced distraction');
assert.match(css, /@media \(prefers-reduced-motion:reduce\)\{[\s\S]*#landing \.landing-3d-scene\{animation:none!important\}/, 'reduced motion must disable Hero scene animation');
assert.match(css, /#landing \.landing-3d-scene\{position:absolute/, 'the decorative scene must stay isolated from document flow');
console.log('RESULT: Tranche 1 landing Hero and motion contract passed');
