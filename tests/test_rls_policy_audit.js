'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { auditSql } = require('../scripts/audit_rls_policies');

const schema = fs.readFileSync(path.join(__dirname, '..', 'bff', 'supabase', 'schema.sql'), 'utf8');
const good = auditSql(schema, 'schema.sql');
assert.deepEqual(good.tables.sort(), ['public.dda_profiles', 'public.dda_sessions']);
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
