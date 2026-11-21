'use strict';

/* DDA 3D signature contract.
 *
 * The landing hero's old CSS orbit/device mockup (data-3d-scene="dda-orbit",
 * .landing-3d-core, .landing-device-stage) was removed 2026-11-21: it was
 * permanently hidden (display:none, no JS toggle) behind the real hero
 * photo and never reached production. This contract now covers the real,
 * currently-visible 3D CSS signature: the Progression mastery proof halo
 * (rotateX/rotateY/rotateZ rings around a confirmed/practiced skill), which
 * is still rendered and still respects reduced motion.
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const css = fs.readFileSync(path.join(root, 'dist', 'alpha-polish.css'), 'utf8');
const app = fs.readFileSync(path.join(root, 'dist', 'app.js'), 'utf8');

assert.doesNotMatch(css, /landing-3d-scene|landing-3d-core|landing-3d-orbit|landing-device-stage/, 'the removed landing hero 3D mockup must not reappear in the stylesheet');
assert.match(app, /data-mastery-level="\$\{level\}"/, 'mastery row must expose its real evidence level to the visual layer');
assert.match(css, /data-proof-state="confirmed"/, 'confirmed proof must have a distinct 3D state');
assert.match(css, /dda-proof-orbit/, 'mastery proof halo must use a restrained 3D orbit');
assert.match(css, /#progress \.mastery-row-focused \.mastery-level\{position:relative;isolation:isolate;transform-style:preserve-3d\}/, 'mastery proof halo must use a real 3D transform context');
assert.match(css, /@keyframes dda-proof-orbit\{from\{transform:rotateX/, 'proof orbit must define a restrained rotation animation');
assert.match(css, /@media\(prefers-reduced-motion:reduce\)/, 'reduced motion override must exist');

console.log('RESULT: DDA 3D signature contract passed');
