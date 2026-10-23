'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'dist', 'academy.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'dist', 'app.js'), 'utf8');

assert.match(html, /id="autotrader-access-status" role="status" aria-live="polite"/);
assert.match(html, /id="autotrader-server-detail" hidden/);
assert.match(html, /Aucun signal calculé/);
assert.match(html, /Aucun flux de marché connecté/);
assert.match(html, /Désactivée · aucun ordre ni connexion MT5/);
assert.match(html, /id="autotrader-history-form"/);
assert.match(html, /autotrader-history-attestation" type="checkbox" required/);
assert.match(html, /données importées, non vérifiées indépendamment/i);
assert.match(app, /user\?\.entitlements\) && user\.entitlements\.includes\('autotrader\.analysis'\)/);
assert.match(app, /if \(id === 'intelligence'\) void refreshAutoTraderStatus\(\)/);
assert.match(app, /window\.DDABFF\.analyzeAutoTrader\(series\)/);
assert.match(app, /analysis\.order_recommendation !== null/);
assert.doesNotMatch(app, /DDA\.can\([^)]*autotrader\.analysis/);

console.log('AutoTrader prelaunch UI contract: PASS');
