'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'dist', 'index.html'), 'utf8');
const landing = html.match(/<section class="view" id="landing"[\s\S]*?<\/section>/)?.[0] || html;

assert.match(html, /data-layer="public"/, 'landing must be an independently addressable public shell');
assert.match(html, /id="landing"/, 'public shell must mount the landing');
const headerNav = landing.match(/<nav class="public-header-nav"[^>]*>[\s\S]*?<\/nav>/)?.[0] || '';
const mobileMenu = landing.match(/<details class="public-menu"[\s\S]*?<\/details>/)?.[0] || '';
assert.match(headerNav, /href="#landing-experience"/, 'public nav must use internal landing anchors');
assert.doesNotMatch(`${headerNav}${mobileMenu}`, /data-view="(dashboard|path|progress|journal|resources|markets|community|intelligence|profile)"/, 'public nav must not expose protected app routes');
assert.match(html, /id="landing-experience"/, 'landing must expose a method anchor');
assert.match(html, /id="landing-product"/, 'landing must expose a product anchor');
assert.match(html, /id="landing-free"/, 'landing must expose a Free offer anchor');
assert.match(html, /id="landing-ecosystem"/, 'landing must expose a domains anchor');
assert.match(html, /id="landing-future"/, 'landing must expose a future vision anchor');
assert.match(html, /data-view="access"[^>]*data-analytics="hero_cta_click"/, 'hero must keep one measurable access CTA');
assert.doesNotMatch(html, /class="future-label"[^>]*data-view=/, 'future labels must not pretend to open unfinished routes');
assert.match(html, /href="#landing-trust"|class="landing-guardrails"/, 'public trust content remains reachable');

console.log('RESULT: Landing public structure contract passed');
