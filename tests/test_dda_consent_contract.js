'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const landing = read('dist/index.html');
const academy = read('dist/academy.html');
const privacy = read('dist/privacy/index.html');
const cookies = read('dist/cookies/index.html');
const publicPages = ['dist/about/index.html','dist/accessibility/index.html','dist/contact/index.html','dist/faq/index.html','dist/imprint/index.html','dist/launch/index.html','dist/risks/index.html','dist/terms/index.html','dist/ai/index.html','dist/live/index.html','dist/business/index.html','dist/experts/index.html','dist/community/index.html','dist/commencer/index.html'].map(read);
const consent = read('dist/dda-consent.js');
const analytics = read('dist/dda-analytics.js');
const serviceWorker = read('dist/sw.js');

for (const [name, html] of [['landing', landing], ['academy', academy], ['privacy', privacy], ['cookies', cookies], ...publicPages.map((html, index) => ['public-' + index, html])]) {
  assert.match(html, /dda-consent\.css/, name + ' loads consent styles');
  assert.match(html, /dda-consent\.js/, name + ' loads consent manager');
  assert.doesNotMatch(html, /googletagmanager\.com\/gtm\.js/, name + ' must not load GTM before consent');
  assert.match(html, /data-dda-open-consent/, name + ' exposes a way to reopen preferences');
}

assert.match(consent, /GTM-M9PMLN9N/, 'the approved GTM container is configured');
assert.match(consent, /analytics_storage:\s*'denied'/, 'Google analytics consent defaults to denied');
assert.match(consent, /ad_storage:\s*'denied'/, 'Google advertising consent defaults to denied');
assert.match(consent, /data-consent="reject"/, 'visitors can refuse optional tracking');
assert.match(consent, /data-consent="accept"/, 'visitors can accept optional tracking');
assert.match(consent, /data-consent="settings"/, 'visitors can personalize their choice');
assert.match(consent, /localStorage\.setItem\(CONSENT_KEY/, 'the consent choice is persisted locally');
assert.match(consent, /loadGtmIfAllowed/, 'GTM loading is gated by consent');
assert.match(consent, /'gtm.start': Date.now\(\), event: 'gtm.js'/, 'the standard GTM bootstrap event is queued before the container script');
assert.match(consent, /dda:consent-changed/, 'consent changes are broadcast');

assert.match(analytics, /setConsent\(allowed\)/, 'PostHog exposes a consent gate');
assert.match(analytics, /if \(!analyticsConsent \|\| initAttempted\) return;/, 'PostHog initialization waits for explicit analytics consent');
assert.match(serviceWorker, /'\.\/dda-consent\.js', '\.\/dda-consent\.css'/, 'consent assets are included in the offline shell cache');
assert.match(serviceWorker, /dda-shell-v29/, 'service worker cache version is bumped for the new shell assets');
assert.match(analytics, /opt_out_capturing/, 'PostHog capture is disabled when analytics consent is withdrawn');
assert.match(analytics, /if \(!analyticsConsent\) \{ initAttempted = false; return; \}/, 'late configuration responses cannot initialize PostHog after withdrawal');

for (const file of ['dist/index.html', 'dist/academy.html', 'dist/commencer/index.html', 'dist/privacy/index.html', 'dist/cookies/index.html', 'dist/about/index.html', 'dist/accessibility/index.html', 'dist/contact/index.html', 'dist/faq/index.html', 'dist/imprint/index.html', 'dist/launch/index.html', 'dist/risks/index.html', 'dist/terms/index.html', 'dist/ai/index.html', 'dist/live/index.html', 'dist/business/index.html', 'dist/experts/index.html', 'dist/community/index.html']) {
  const html = read(file);
  const csp = html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)">/);
  assert.ok(csp, file + ' has CSP');
  assert.match(csp[1], /script-src[^;]*https:/, file + ' permits HTTPS tag scripts after consent');
  assert.match(csp[1], /connect-src[^;]*https:/, file + ' permits HTTPS analytics requests after consent');
}

console.log('DDA consent + GTM integration contract: PASS');
