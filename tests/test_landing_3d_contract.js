'use strict';

/* DDA landing 3D contract.
 * The canvas must run authored WebGL geometry in the existing human-led hero,
 * while the separate mastery proof halo remains intact on the Progression page.
 */
const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'dist', 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'dist', 'alpha-polish.css'), 'utf8');
const sceneCss = fs.readFileSync(path.join(root, 'dist', 'landing-3d.css'), 'utf8');
const sceneJs = fs.readFileSync(path.join(root, 'dist', 'landing-3d.js'), 'utf8');
const app = fs.readFileSync(path.join(root, 'dist', 'app.js'), 'utf8');

assert.match(html, /data-3d-scene="dda-orbit"/, 'the active hero must contain the DDA orbit scene');
assert.match(html, /data-landing-3d-canvas/, 'the hero scene must include a real canvas');
assert.match(html, /href="landing-3d\.css"/, 'the scoped scene and responsive styles must be loaded');
assert.match(html, /src="landing-3d\.js"/, 'the WebGL renderer must be loaded by the live landing');
assert.match(html, /class="fintech-figure"/, 'the real human portrait remains in the hero composition');
assert.match(html, /class="landing-proof-band"/, 'the compact proof and Free benefits remain visible below the hero');
assert.match(sceneJs, /getContext\('webgl'/, 'the renderer must initialize a WebGL context');
assert.match(sceneJs, /function perspective\(/, 'the renderer must use a perspective projection');
assert.match(sceneJs, /gl_Position\s*=\s*uProjection\s*\*\s*uView\s*\*\s*world/, 'vertices must pass through view and perspective matrices');
assert.match(sceneJs, /torusVertices/, 'the scene must use authored 3D orbit geometry');
assert.match(sceneJs, /sphereVertices/, 'the scene must render a 3D core and nodes');
assert.match(sceneJs, /1000\s*\/\s*30/, 'animated rendering must be capped at 30 fps');
assert.match(sceneJs, /IntersectionObserver/, 'continuous rendering must pause outside the viewport');
assert.match(sceneJs, /paused-offscreen/, 'the offscreen pause must be observable in the scene state');
assert.match(sceneJs, /static-reduced-motion/, 'reduced-motion must use a static render');
assert.match(sceneJs, /static-low-data/, 'low-data mode must use a static render');
assert.doesNotMatch(sceneJs, /https?:\/\//, 'the renderer must not load a third-party runtime or service');
assert.match(sceneCss, /data-scene-state="fallback"/, 'CSS must provide a non-WebGL fallback');
assert.match(sceneCss, /@media\(max-width:639px\)/, 'the hero scene must have a small-screen layout');
assert.match(sceneCss, /landing-proof-band/, 'the proof band must have scoped responsive styling');

assert.match(app, /data-mastery-level="\$\{level\}"/, 'mastery row must expose its real evidence level to the visual layer');
assert.match(css, /data-proof-state="confirmed"/, 'confirmed proof must have a distinct 3D state');
assert.match(css, /dda-proof-orbit/, 'mastery proof halo must use a restrained 3D orbit');
assert.match(css, /#progress \.mastery-row-focused \.mastery-level\{position:relative;isolation:isolate;transform-style:preserve-3d\}/, 'mastery proof halo must use a real 3D transform context');
assert.match(css, /@keyframes dda-proof-orbit\{from\{transform:rotateX/, 'proof orbit must define a restrained rotation animation');
assert.match(css, /@media\(prefers-reduced-motion:reduce\)/, 'reduced motion override must exist');

console.log('RESULT: DDA WebGL hero and mastery 3D contracts passed');
