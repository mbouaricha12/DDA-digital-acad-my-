'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..', 'dist');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.webmanifest'), 'utf8'));

assert.match(sw, /const CACHE = 'dda-shell-v27';/);
// Founder-reported production incident (2026-11): app.js and bff-client.js
// wire up the real auth forms (signup/login) and must never run one
// version behind the HTML they ship with — see sw.js's CRITICAL_SCRIPTS
// comment. A stale cached copy running against fresh HTML is one concrete,
// code-level mechanism that could produce "the button does nothing" for a
// returning visitor right after a deploy.
assert.match(sw, /CRITICAL_SCRIPTS = \[.*app\.js.*bff-client\.js.*\]/, 'app.js and bff-client.js must be served network-first, never stale-while-revalidate');
assert.match(sw, /isCriticalScript\(url\)/, 'the fetch handler must route critical scripts through the network-first strategy');
assert.match(sw, /'\.\/academy\.html'/, 'Academy document must be in the critical offline shell');
assert.match(sw, /'\.\/bff-client\.js'/, 'BFF client must be cached for the local auth UI');
assert.match(sw, /request\.mode === 'navigate'/, 'navigation requests must have a dedicated strategy');
assert.match(sw, /url\.pathname\.endsWith\('\/academy\.html'\)/, 'Academy navigations need Academy fallback');
assert.match(sw, /isApiRequest/);
assert.match(sw, /if \(isApiRequest\(url\)\) return;/, 'authenticated/API responses must never enter the offline cache');
assert.match(sw, /isSameOrigin/);
assert.match(sw, /OPTIONAL_MODULES/);
assert.doesNotMatch(sw, /fetch\(event\.request\)\.then\(response => \{\s*const copy = response\.clone\(\);\s*caches\.open\(CACHE\)/, 'the worker must not blindly cache every GET response');
assert.equal(manifest.start_url, './academy.html#dashboard', 'PWA should open the Academy shell offline');
console.log('Service Worker offline contract: PASS');
