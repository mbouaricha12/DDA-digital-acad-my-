'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..', 'dist');
const html = fs.readFileSync(path.join(root, 'academy.html'), 'utf8');
const strategy = fs.readFileSync(path.join(root, '..', 'DDA_FREE_PREMIUM_ACCESS_STRATEGY.md'), 'utf8');

assert.match(html, /id="membership"/);
assert.match(html, /id="access-model-panel"|class="panel access-model-panel"/);
assert.match(html, /DDA Free/);
assert.match(html, /DDA Premium/);
assert.match(html, /DDA Access/);
assert.match(html, /Aucun paiement actif/);
assert.match(html, /Non disponible aujourd’hui/);
// Founder-approved launch price (2026-11-14 commercial preparation mandate):
// 12 000 FCFA/month, shown as a real price. Chariow checkout was activated
// in production 2026-11-21 (API key, Pulse secret and product IDs
// configured) — the invariant that matters now is not "checkout stays
// off" but that access is never granted by a local state change, only by
// a confirmed server-side payment. No price may appear anywhere in
// academy.html other than the two founder-approved figures, and the Pack
// Fondateur figure must always carry its "sous réserve" qualifier, never
// presented as final.
assert.match(html, /accès Premium n.est jamais accordé par un changement d.état local/);
assert.match(html, /12 000 FCFA/, 'the founder-approved monthly price must be shown');
assert.match(html, /33 000 FCFA[\s\S]{0,400}sous réserve de confirmation définitive|sous réserve de confirmation définitive[\s\S]{0,400}33 000 FCFA/, 'the Founder Pack price must always carry its "sous réserve" qualifier, never presented as final');
const approvedPrices = ['12 000 FCFA', '33 000 FCFA'];
const allPriceMatches = html.match(/[0-9][0-9\s]*(FCFA|EUR|USD|€|\$)/gi) || [];
for (const match of allPriceMatches) {
  assert.ok(approvedPrices.some(price => match.includes(price)), `unapproved price found in academy.html: "${match}"`);
}
assert.match(strategy, /KEEP \/ MODIFY \/ ADD \/ DEFER/);
assert.match(strategy, /entitlements.*côté serveur|Entitlements serveur/i);
assert.match(strategy, /bourses|tarifs réduits|accès sponsorisés/i);
console.log('Free/Premium/Access contract: PASS');
