'use strict';

/* DDA surface-boundary and trust guardrails. */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'dist', 'index.html'), 'utf8');
const academy = fs.readFileSync(path.join(root, 'dist', 'academy.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'dist', 'app.js'), 'utf8');
const core = fs.readFileSync(path.join(root, 'dist', 'dda-core.js'), 'utf8');
const alpha = fs.readFileSync(path.join(root, 'dist', 'alpha-polish.css'), 'utf8');

const landing = html;
assert.match(html, /data-layer="public"/, 'public landing must be independently addressable');
assert.match(academy, /data-layer="academy"/, 'learner app must have its own shell');

// Public surface: internal editorial anchors only, with explicit access CTAs.
const publicNav = landing.match(/<nav class="public-header-nav"[^>]*>[\s\S]*?<\/nav>/)?.[0] || '';
const publicMenu = landing.match(/<details class="public-menu"[\s\S]*?<\/details>/)?.[0] || '';
assert.match(publicNav, /href="#landing-experience"/, 'public navigation must stay on landing anchors');
assert.doesNotMatch(`${publicNav}${publicMenu}`, /data-view="(dashboard|path|progress|journal|resources|markets|community|intelligence|profile)"/, 'public navigation must not bypass the app boundary');
assert.doesNotMatch(landing, /class="future-label"[^>]*data-view=/, 'future capabilities must not expose executable routes');
assert.match(landing, /data-view="access"[^>]*data-analytics="hero_cta_click"/, 'the public funnel must have an explicit measurable access boundary');

// Runtime boundary: permission checks must precede view activation.
assert.match(app, /const viewPermissions = \{/, 'protected-view permissions must have one explicit registry');
assert.match(app, /const permission = viewPermissions\[id\];/, 'showView must resolve permissions before rendering');
assert.match(app, /if \(permission && !DDA\.can\(prototypeState, permission\)\)/, 'unauthorized views must be blocked before activation');
assert.match(app, /document\.body\.classList\.toggle\('public-shell', id === 'landing'\)/, 'landing must have an explicit public shell');
assert.match(app, /document\.body\.classList\.toggle\('access-mode', id === 'access'\)/, 'authentication must have an explicit access shell');

// Entitlement boundary: visitor cannot enter learner surfaces by default.
assert.match(core, /visitor: \['dashboard_preview', 'access'\]/, 'visitor entitlement must stay limited to preview/access');
assert.match(core, /free: \['dashboard', 'path'/, 'free entitlement must explicitly own learner entry');
assert.match(core, /premium: \['dashboard', 'path'/, 'premium entitlement must inherit learner entry');

// Trust and fail-closed affordances.
assert.match(`${html}${academy}`, /name="referrer" content="no-referrer"/, 'referrer policy must remain restrictive');
assert.match(academy, /data-js-submit(?:="true")?(?:\s|>)/, 'forms must declare JavaScript-controlled submission');
assert.match(alpha, /body\.public-shell \.prototype-banner\{display:none\}/, 'prototype chrome must not leak onto public landing');
assert.match(alpha, /body\.public-shell \.dda-app-surface,/, 'public shell must hide the learner app surface');

console.log('RESULT: Surface boundary and trust guardrails contract passed');
