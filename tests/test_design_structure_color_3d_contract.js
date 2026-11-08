'use strict';
/*
 * fix/design-structure-color-3d-alignment — contract for the founder's
 * reference-maquette alignment pass: CTA color (gold, not blue), the DDA AI
 * sidebar entry (a real, already-built, Free-tier feature that was missing
 * from primary navigation), and the landing 3D orbit scene staying intact.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const styles = fs.readFileSync(path.join(root, 'dist', 'styles.css'), 'utf8');
const alpha = fs.readFileSync(path.join(root, 'dist', 'alpha-polish.css'), 'utf8');
const academyHtml = fs.readFileSync(path.join(root, 'dist', 'academy.html'), 'utf8');

// -- CTA color: gold is the primary-action accent (reference maquette), not blue --

assert.match(
  styles,
  /\.primary-action\{background:linear-gradient\(135deg,var\(--gold-soft\),var\(--gold\)\);color:var\(--navy-950\)/,
  'the shared .primary-action base (used across the public site and the Academy app) is gold, not the old blue/cyan gradient'
);
assert.doesNotMatch(
  styles,
  /\.primary-action\{background:linear-gradient\(135deg,var\(--cta-blue-2\),var\(--cta-blue\)\)/,
  'the old blue .primary-action gradient must not come back'
);

assert.match(
  alpha,
  /\.primary-action,\.public-start,\.landing-mobile-cta button[^{]*\{\s*border:1px solid rgba\(240,207,138,\.6\);\s*background:linear-gradient\(112deg,#f6c860/,
  'the shared public CTA gradient (.primary-action/.public-start/.landing-mobile-cta button) is gold'
);
assert.doesNotMatch(
  alpha,
  /background:linear-gradient\(112deg,#155fde/,
  'the old blue "genuine action" CTA gradient must not come back anywhere in alpha-polish.css'
);
assert.doesNotMatch(
  alpha,
  /\.public-start\{padding:11px 14px!important;background:var\(--lp-blue\)/,
  'the header .public-start button must not fall back to the raw --lp-blue token'
);
assert.doesNotMatch(
  alpha,
  /#landing \.primary-action\{\s*background:var\(--lp-blue\)/,
  'the #landing-scoped .primary-action override must not reassert blue'
);

// -- DDA AI: a real, Free-tier, already-tested feature (view#intelligence) —
// must be reachable from primary navigation (desktop sidebar + mobile
// drawer), matching the founder's reference maquette sidebar. --

const sidebarMatch = academyHtml.match(/<aside class="sidebar"[\s\S]*?<\/aside>/);
assert.ok(sidebarMatch, 'the desktop sidebar markup is present');
assert.match(sidebarMatch[0], /data-view="intelligence"/, 'the desktop sidebar links directly to DDA AI (view#intelligence)');

const drawerMatch = academyHtml.match(/<nav class="mobile-drawer"[\s\S]*?<\/nav>/);
assert.ok(drawerMatch, 'the mobile drawer markup is present');
assert.match(drawerMatch[0], /data-view="intelligence"/, 'the mobile drawer links directly to DDA AI (view#intelligence)');

// -- Landing 3D orbit scene stays intact (not touched by this pass) --
assert.match(academyHtml, /<!doctype html>/i, 'sanity: academy.html parses as a document');
const indexHtml = fs.readFileSync(path.join(root, 'dist', 'index.html'), 'utf8');
assert.match(indexHtml, /data-3d-scene="dda-orbit"/, 'the landing 3D orbit scene is still mounted');

console.log('RESULT: design structure/color/3D alignment contract passed');
