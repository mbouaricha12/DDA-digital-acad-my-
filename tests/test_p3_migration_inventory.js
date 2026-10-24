'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const migrationDir = path.join(root, 'supabase', 'migrations');
const files = fs.readdirSync(migrationDir).filter(file => /^\d{4}_.+\.sql$/.test(file)).sort();
assert.deepEqual(files, ['0001_identity_sessions.sql', '0002_business_entities.sql', '0003_rls_and_privileges.sql', '0004_chariow_billing.sql', '0005_brvm_publications.sql', '0006_select_own_grants.sql', '0007_admin_roles.sql'], 'P3/P4/P5/P6/P7 migration order is explicit and deterministic');
const combined = files.map(file => fs.readFileSync(path.join(migrationDir, file), 'utf8')).join('\n');
for (const table of ['dda_profiles', 'dda_sessions', 'memberships', 'onboarding', 'lesson_progress', 'terminal_state', 'journal_entries', 'journal_plans', 'premium_progress', 'preferences', 'audit_events', 'dda_admin_roles']) {
  assert.match(combined, new RegExp(`public\\.${table}\\b`), `${table} is represented in versioned SQL`);
}
for (const table of ['dda_billing_deliveries', 'dda_billing_memberships']) {
  assert.match(combined, new RegExp(`public\\.${table}\\b`), `${table} is represented in versioned SQL`);
}
for (const table of ['dda_brvm_sources', 'dda_brvm_documents', 'dda_brvm_audit_events', 'dda_brvm_publications']) {
  assert.match(combined, new RegExp(`public\\.${table}\\b`), `${table} is represented in versioned SQL`);
}
assert.match(combined, /dda_profiles_touch_updated_at/, 'profile timestamps use a trigger');
assert.match(combined, /revoke all on table public\.audit_events from public, anon, authenticated/, 'audit events have no browser write grant');

// A "select own" RLS policy without the matching GRANT is inert in Postgres (REVOKE ALL
// blocks the read regardless of the policy) — this is exactly the P0 audit finding fixed
// by 0006_select_own_grants.sql. Lock in that every owner-scoped table actually has both.
const ownerColumn = { memberships: 'user_id', dda_billing_memberships: 'user_id' };
for (const table of ['memberships', 'onboarding', 'lesson_progress', 'terminal_state', 'journal_entries', 'journal_plans', 'premium_progress', 'preferences', 'dda_billing_memberships']) {
  const column = ownerColumn[table] || 'owner_id';
  assert.match(combined, new RegExp(`for select to authenticated using \\(${column} = \\(select auth\\.uid\\(\\)\\)\\)`), `${table} has a select-own policy`);
  assert.match(combined, new RegExp(`grant select on table public\\.${table} to authenticated`), `${table}'s select-own policy has its matching GRANT, otherwise it stays permanently inert`);
}
// audit_events and dda_billing_deliveries are deliberately select-denied to authenticated
// (policy `using (false)`) — they must never receive this grant.
for (const table of ['audit_events', 'dda_billing_deliveries']) {
  assert.doesNotMatch(combined, new RegExp(`grant select on table public\\.${table} to authenticated`), `${table} must stay fully inaccessible to the authenticated role`);
}

// dda_admin_roles (the owner/admin role plane) is a stricter case than any
// of the above: it must receive NO grant to anon/authenticated at all — not
// even a select-own policy, since a learner has no legitimate reason to
// read this table, including its own absence from it.
assert.match(combined, /create table if not exists public\.dda_admin_roles/, 'dda_admin_roles is represented in versioned SQL');
assert.match(combined, /role text not null check \(role in \('owner', 'admin'\)\)/, 'dda_admin_roles only ever accepts the owner/admin launch-essential roles');
assert.match(combined, /revoke all on table public\.dda_admin_roles from anon, authenticated/, 'dda_admin_roles has no browser privilege at all');
assert.match(combined, /create policy dda_admin_roles_deny_all on public\.dda_admin_roles\s*\n\s*for select to authenticated using \(false\)/, 'dda_admin_roles explicitly denies every authenticated select');
for (const grant of [/grant select on table public\.dda_admin_roles/, /grant insert on table public\.dda_admin_roles/, /grant update[^;]* on table public\.dda_admin_roles/]) {
  assert.doesNotMatch(combined, grant, 'dda_admin_roles must never receive any grant to anon/authenticated, under any clause');
}
const replay = fs.readFileSync(path.join(root, 'scripts', 'replay_p3_migrations.sh'), 'utf8');
assert.match(replay, /DATABASE_URL/, 'replay requires an explicit database URL');
assert.match(replay, /Refusing to run against a Supabase-hosted URL/, 'replay refuses remote Supabase URLs');
const matrix = fs.readFileSync(path.join(root, 'docs', 'P3_RECONCILIATION_MATRIX.md'), 'utf8');
for (const entity of ['users', 'memberships', 'onboarding', 'lesson_progress', 'terminal_state', 'journal_entries', 'journal_plans', 'premium_progress', 'preferences', 'acquisition', 'audit_events', 'dda_admin_roles']) {
  assert.ok(matrix.includes(`| \`${entity}\` |`), `${entity} appears in the reconciliation matrix`);
}
console.log('RESULT: P3 migration inventory and reconciliation matrix contract passed');
