'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const migration = fs.readFileSync(path.join(root, 'supabase/migrations/0005_brvm_publications.sql'), 'utf8');
const bff = fs.readFileSync(path.join(root, 'bff/src/app.js'), 'utf8');
const server = fs.readFileSync(path.join(root, 'bff/src/handler.js'), 'utf8');
const store = fs.readFileSync(path.join(root, 'bff/src/brvm-publication-store.js'), 'utf8');
const client = fs.readFileSync(path.join(root, 'dist/bff-client.js'), 'utf8');
const app = fs.readFileSync(path.join(root, 'dist/app.js'), 'utf8');

for (const field of ['source_name', 'source_url', 'source_type', 'owner_contact', 'license_reference', 'redistribution_status', 'coverage', 'refresh_policy', 'rights_reviewer_id', 'source_reviewer_id']) {
  assert.match(migration, new RegExp(`\\b${field}\\b`), `server source model requires ${field}`);
}
for (const field of ['document_id', 'reference_date', 'retrieved_at', 'checksum_sha256', 'transformer_version', 'verification_status', 'freshness_status', 'redistribution_rights', 'fresh_until', 'editorial_reviewer_id', 'published_by']) {
  assert.match(migration, new RegExp(`\\b${field}\\b`), `server document manifest requires ${field}`);
}
assert.match(migration, /create table if not exists public\.dda_brvm_audit_events/, 'BRVM changes are auditable');
assert.match(migration, /actor_id uuid not null/, 'mutations without an attributable actor are rejected');
assert.match(migration, /if tg_op = 'UPDATE' and old\.source_id <> new\.source_id/, 'source identity checks must not dereference NEW during DELETE');
assert.match(migration, /if tg_op = 'UPDATE' and \(old\.document_id <> new\.document_id or old\.source_id <> new\.source_id\)/, 'document identity checks must not dereference NEW during DELETE');
assert.match(migration, /Invalid BRVM source status transition/, 'source lifecycle transitions are enforced');
assert.match(migration, /Invalid BRVM document status transition/, 'document lifecycle transitions are enforced');
assert.match(migration, /rights_reviewer_id <> editorial_reviewer_id/, 'rights and editorial review must be independent');
assert.match(migration, /d\.fresh_until > now\(\)/, 'expired documents disappear from the public projection');
assert.match(migration, /create or replace view public\.dda_brvm_publications/, 'the BFF reads a filtered projection, not source tables');
assert.match(migration, /revoke all on table public\.dda_brvm_documents from anon;/, 'anonymous browsers get no direct base-table grants');
assert.match(migration, /revoke all on table public\.dda_brvm_documents from authenticated;/, 'authenticated browsers get no direct base-table grants');
assert.match(migration, /revoke all on table public\.dda_brvm_documents from service_role;/, 'the BFF gets no direct base-table grants');
assert.match(migration, /grant select on public\.dda_brvm_publications to service_role/, 'BFF service role has read access only to the public projection');
assert.doesNotMatch(migration, /grant (insert|update|delete|all).*service_role/i, 'migration does not grant BRVM write access to the BFF');
assert.match(bff, /method === 'GET' && path === '\/v1\/publications\/brvm'/, 'public API is GET-only');
assert.match(bff, /publications_unavailable/, 'missing store is not reported as an empty success');
assert.match(server, /brvmPublicationStore/, 'server wiring provides the read-only store');
assert.match(store, /fresh_until/, 'store revalidates expiry');
assert.match(store, /https:/, 'store requires HTTPS URLs');
assert.match(client, /getBrvmPublications/, 'frontend transport has a typed BRVM read method');
assert.match(app, /brvmPublicationFetchState === 'loading'/, 'gallery has an announced loading state');
assert.match(app, /brvmPublicationFetchState === 'error'/, 'gallery has an explicit service error state');
console.log('BRVM server model and projection contract: PASS');
