'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const migrationDir = path.join(root, 'supabase', 'migrations');
const files = fs.readdirSync(migrationDir).filter(file => /^\d{4}_.+\.sql$/.test(file)).sort();
assert.deepEqual(files, ['0001_identity_sessions.sql', '0002_business_entities.sql', '0003_rls_and_privileges.sql'], 'P3 migration order is explicit and deterministic');
const combined = files.map(file => fs.readFileSync(path.join(migrationDir, file), 'utf8')).join('\n');
for (const table of ['dda_profiles', 'dda_sessions', 'memberships', 'onboarding', 'lesson_progress', 'terminal_state', 'journal_entries', 'journal_plans', 'premium_progress', 'preferences', 'audit_events']) {
  assert.match(combined, new RegExp(`public\\.${table}\\b`), `${table} is represented in versioned SQL`);
}
assert.match(combined, /dda_profiles_touch_updated_at/, 'profile timestamps use a trigger');
assert.match(combined, /revoke all on table public\.audit_events from public, anon, authenticated/, 'audit events have no browser write grant');
const replay = fs.readFileSync(path.join(root, 'scripts', 'replay_p3_migrations.sh'), 'utf8');
assert.match(replay, /DATABASE_URL/, 'replay requires an explicit database URL');
assert.match(replay, /Refusing to run against a Supabase-hosted URL/, 'replay refuses remote Supabase URLs');
const matrix = fs.readFileSync(path.join(root, 'docs', 'P3_RECONCILIATION_MATRIX.md'), 'utf8');
for (const entity of ['users', 'memberships', 'onboarding', 'lesson_progress', 'terminal_state', 'journal_entries', 'journal_plans', 'premium_progress', 'preferences', 'acquisition', 'audit_events']) {
  assert.ok(matrix.includes(`| \`${entity}\` |`), `${entity} appears in the reconciliation matrix`);
}
console.log('RESULT: P3 migration inventory and reconciliation matrix contract passed');
