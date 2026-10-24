'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { auditSql, auditPaths } = require('../scripts/audit_rls_policies');

const migrationDir = path.join(__dirname, '..', 'supabase', 'migrations');
const migrationFiles = fs.readdirSync(migrationDir).sort().map(file => path.join(migrationDir, file));
const good = auditPaths(migrationFiles);
assert.deepEqual(good.tables.sort(), [
  'public.audit_events',
  'public.dda_admin_roles',
  'public.dda_billing_deliveries',
  'public.dda_billing_memberships',
  'public.dda_brvm_audit_events',
  'public.dda_brvm_documents',
  'public.dda_brvm_sources',
  'public.dda_profiles',
  'public.dda_sessions',
  'public.journal_entries',
  'public.journal_plans',
  'public.lesson_progress',
  'public.memberships',
  'public.onboarding',
  'public.preferences',
  'public.premium_progress',
  'public.terminal_state'
]);
assert.deepEqual(good.findings, []);

const bad = auditSql(`
  create table public.insecure_records (id uuid primary key);
`, 'bad.sql');
assert.equal(bad.tables[0], 'public.insecure_records');
assert.equal(bad.findings.length, 3);
assert.match(bad.findings[0], /without ALTER TABLE/);
assert.match(bad.findings[1], /without a CREATE POLICY/);
assert.match(bad.findings[2], /does not explicitly revoke/);

console.log('RLS policy audit contract: PASS');
