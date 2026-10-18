'use strict';
const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const governance = fs.readFileSync(path.join(root, 'docs', 'DDA_BRVM_SOURCE_GOVERNANCE_2026-10-18.md'), 'utf8');
const app = fs.readFileSync(path.join(root, 'dist', 'app.js'), 'utf8');
const publications = fs.readFileSync(path.join(root, 'tests', 'test_brvm_publications_safety_contract.js'), 'utf8');

assert.match(governance, /ne connecte actuellement aucune source BRVM/i, 'governance must state that no source is connected');
assert.match(governance, /BRVM_PUBLICATIONS.*vide/i, 'the public registry must remain empty until approval');
for (const field of ['source_name', 'source_url', 'license_reference', 'redistribution_status', 'refresh_policy', 'reviewer_id', 'document_id', 'checksum', 'transformer_version']) {
  assert.match(governance, new RegExp('`' + field + '`'), `governance requires ${field}`);
}
for (const state of ['PROPOSED', 'RIGHTS_PENDING', 'REVIEW_PENDING', 'APPROVED', 'IMPORTED', 'PUBLISHED', 'REJECTED', 'EXPIRED']) {
  assert.match(governance, new RegExp('\\b' + state + '\\b'), `governance defines ${state}`);
}
assert.match(governance, /jamais dans `localStorage`/i, 'source approval cannot be stored in browser storage');
assert.match(governance, /document partiellement visible/i, 'failed imports must not leak partial documents');
assert.match(governance, /seconde vérification éditoriale/i, 'publication requires an editorial second check');
assert.match(governance, /aucune valeur de marché/i, 'governance must defer market values');
assert.match(app, /const BRVM_PUBLICATIONS = Object\.freeze\(\[\]\)/, 'runtime registry is still empty');
assert.match(publications, /redistributionRights !== 'authorized'/, 'runtime safety contract rejects unauthorized redistribution');
console.log('RESULT: BRVM source governance contract passed');
