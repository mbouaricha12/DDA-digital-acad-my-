'use strict';

/* DDA landing 3D signature contract. */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'dist', 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'dist', 'alpha-polish.css'), 'utf8');

assert.match(html, /data-3d-scene="dda-orbit"/, 'landing must mount the DDA orbit scene');
assert.match(html, /class="landing-3d-core"/, '3D scene must have an identifiable core');
assert.match(html, /aria-hidden="true"/, 'decorative 3D scene must not enter the accessibility tree');
assert.match(css, /transform-style:preserve-3d/, 'scene must use a real 3D transform context');
assert.match(css, /@keyframes dda-orbit-spin/, 'scene must define a restrained orbit animation');
assert.match(css, /body\.low-data #landing \.landing-3d-scene\{display:none\}/, 'low-data must disable the decorative scene');
assert.match(css, /@media\(prefers-reduced-motion:reduce\)/, 'reduced motion override must exist');
assert.match(css, /landing-3d-scene\{position:absolute/, 'scene must remain isolated from layout flow');

console.log('RESULT: Landing 3D signature contract passed');
