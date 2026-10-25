'use strict';

// GitHub Pages cannot set real HTTP response headers — there is no server to
// configure, so X-Content-Type-Options, Referrer-Policy and Permissions-Policy
// (HTTP-header-only, no meta equivalent for the first and last) cannot be set
// at all from this repository alone. A <meta http-equiv="Content-Security-
// Policy"> tag does work for most CSP directives, so that's what every page
// gets here. frame-ancestors and report-* are deliberately absent: a <meta>
// CSP silently ignores them, so including them would just be fake protection.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const dist = path.join(root, 'dist');
const pages = [
  '404.html', 'index.html', 'academy.html',
  'about/index.html', 'accessibility/index.html', 'contact/index.html',
  'cookies/index.html', 'faq/index.html', 'imprint/index.html',
  'launch/index.html', 'privacy/index.html', 'risks/index.html', 'terms/index.html'
];

for (const page of pages) {
  const html = fs.readFileSync(path.join(dist, page), 'utf8');
  const match = html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)">/);
  assert.ok(match, `${page} is missing its CSP meta tag`);
  const csp = match[1];
  assert.match(csp, /default-src 'self'/, `${page}: CSP must default-deny cross-origin loads`);
  assert.match(csp, /object-src 'none'/, `${page}: CSP must block plugin content`);
  assert.match(csp, /base-uri 'self'/, `${page}: CSP must pin <base> to prevent base-tag hijacking`);
  // The app genuinely does load cross-origin, at runtime: window.DDA_BFF_BASE_URL
  // (configured BFF) and window.DDA_ANALYTICS_CONFIG.posthogHost (configured
  // analytics) are both external HTTPS origins, unknown at the time this static
  // meta tag is written — DDA's own runtime config validation already requires
  // HTTPS everywhere, so "https:" here matches that same real boundary instead
  // of a narrower 'self' that would silently break both features (caught by
  // tests/run.js — the BFF/BRVM and PostHog browser tests failed under a
  // 'self'-only connect-src/script-src before this was corrected).
  assert.match(csp, /script-src 'self' 'unsafe-inline' https:/, `${page}: PostHog's dynamically-inserted <script src> from a configured HTTPS host must still be allowed`);
  assert.match(csp, /connect-src 'self' https:/, `${page}: fetch calls to a configured HTTPS BFF/analytics origin must still be allowed`);
  assert.doesNotMatch(csp, /frame-ancestors/, `${page}: frame-ancestors is HTTP-header-only — a <meta> CSP silently ignores it, so it must never be claimed here`);
  assert.doesNotMatch(csp, /report-(uri|to)/, `${page}: report-uri/report-to is HTTP-header-only and must never be claimed in a <meta> CSP`);
}

console.log('Security headers (meta CSP) contract: PASS');
