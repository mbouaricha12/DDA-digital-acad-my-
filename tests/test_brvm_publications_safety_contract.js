'use strict';
const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'dist', 'app.js'), 'utf8');
const academy = fs.readFileSync(path.join(root, 'dist', 'academy.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'dist', 'styles.css'), 'utf8');

const policyStart = app.indexOf('const BRVM_PUBLICATION_REQUIRED_FIELDS');
const policyEnd = app.indexOf('const NEXT_STEP_PHRASE', policyStart);
assert.ok(policyStart >= 0 && policyEnd > policyStart, 'BRVM publication policy must remain an explicit isolated block');
const policy = app.slice(policyStart, policyEnd);
assert.match(policy, /const BRVM_PUBLICATIONS = Object\.freeze\(\[\]\)/, 'BRVM registry remains empty until controlled import approval');
for (const field of ['sourceUrl', 'referenceDate', 'retrievedAt', 'verificationStatus', 'freshnessStatus', 'redistributionRights']) {
  assert.match(policy, new RegExp(`['"]${field}['"]`), `publication policy requires ${field}`);
}
assert.match(policy, /verificationStatus !== 'verified'/, 'unverified documents are rejected');
assert.match(policy, /freshnessStatus !== 'current'/, 'stale documents are rejected');
assert.match(policy, /redistributionRights !== 'authorized'/, 'documents without redistribution rights are rejected');
assert.match(policy, /!\/\^https\?:\\\/\\\//i, 'source URLs must be explicit HTTP(S) URLs');
assert.match(policy, /retrievedTime >= referenceTime/, 'retrieval cannot predate the document reference date');
assert.match(policy, /typeof publication !== 'object'/, 'malformed import entries fail safely instead of throwing');
assert.doesNotMatch(policy, /localStorage|sessionStorage/, 'BRVM publication policy cannot grant access through browser storage');
assert.match(app, /markets: 'market_room'/, 'Market Intelligence remains protected by its existing permission');
assert.match(app, /verifiedBrvmPublications\(\)/, 'rendering uses the verified-only projection, not the raw registry');
assert.match(academy, /id="brvm-publications-list"[^>]*role="status"[^>]*aria-live="polite"/, 'publication empty/loading state remains announced');
assert.match(css, /@media\(max-width:460px\)\{[\s\S]*\.brvm-publication-requirements\{grid-template-columns:1fr\}/, 'publication metadata remains single-column on narrow screens');
assert.match(css, /@media\(max-width:760px\)\{[\s\S]*\.brvm-publications-head\{display:grid/, 'publication header reflows on mobile');
console.log('RESULT: BRVM publication safety, freshness, rights and responsive contract passed');
