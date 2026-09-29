'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'dist', 'index.html'), 'utf8');
const landing = html.match(/<section class="view" id="landing"[\s\S]*?<section class="view" id="access"/)?.[0] || '';

assert(landing, 'landing must be a complete public view before access');
const headerNav = landing.match(/<nav class="public-header-nav"[^>]*>[\s\S]*?<\/nav>/)?.[0] || '';
const mobileMenu = landing.match(/<details class="public-menu"[\s\S]*?<\/details>/)?.[0] || '';
assert.match(headerNav, /href="#landing-experience"/, 'public nav must use internal landing anchors');
assert.doesNotMatch(`${headerNav}${mobileMenu}`, /data-view="(path|membership|resources|markets|community|intelligence)"/, 'public nav must not expose protected app routes');
assert.match(landing, /id="landing-experience"/, 'landing must expose a method anchor');
assert.match(landing, /id="landing-product"/, 'landing must expose a product anchor');
assert.match(landing, /id="landing-free"/, 'landing must expose a Free offer anchor');
assert.match(landing, /id="landing-ecosystem"/, 'landing must expose a domains anchor');
assert.match(landing, /id="landing-future"/, 'landing must expose a future vision anchor');
assert.match(landing, /data-view="access"[^>]*data-analytics="hero_cta_click"/, 'hero must keep one measurable access CTA');
assert.doesNotMatch(landing, /class="future-label"[^>]*data-view=/, 'future labels must not pretend to open unfinished routes');
assert.match(landing, /href="#landing-trust"/, 'footer must point to public trust content');

console.log('RESULT: Landing public structure contract passed');
