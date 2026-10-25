'use strict';

// Regression guard for the exact class of bug found in this audit:
// bff/src/business-store.js queried dda_lesson_progress/dda_journal_entries/
// dda_journal_plans/dda_preferences, none of which were ever created by any
// versioned migration — every real Supabase call would have 404'd. Nothing
// caught it because the only other file describing those names
// (bff/supabase/schema.sql, and the test that read it) had drifted the same
// way, so they "confirmed" each other instead of the real schema.
//
// This test breaks that cycle: it reads the table names business-store.js
// actually sends to PostgREST and checks each one against the migrations
// that are actually versioned, tested and treated as the source of truth
// throughout this project (supabase/migrations/0001-0007), not against any
// other hand-maintained description of the schema.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { TABLES } = require('../bff/src/business-store');

const root = path.join(__dirname, '..');
const migrationDir = path.join(root, 'supabase', 'migrations');
const migrationFiles = fs.readdirSync(migrationDir).filter(file => /^\d{4}_.+\.sql$/.test(file));
const migrationsSql = migrationFiles.map(file => fs.readFileSync(path.join(migrationDir, file), 'utf8')).join('\n');

for (const [key, spec] of Object.entries(TABLES)) {
  assert.match(
    migrationsSql,
    new RegExp(`create table if not exists public\\.${spec.table}\\b`),
    `business-store.js TABLES.${key} queries "${spec.table}", but no versioned migration creates that table. ` +
    `Either the table name is wrong, or this table needs its own migration before business-store.js can reference it.`
  );
}

// The inverse also matters: every owner-scoped table the migrations define
// for export/delete purposes should be reachable from business-store.js,
// so a learner's full data export/deletion doesn't silently skip one.
const queriedTables = new Set(Object.values(TABLES).map(spec => spec.table));
for (const table of ['lesson_progress', 'journal_entries', 'journal_plans', 'preferences']) {
  assert.ok(queriedTables.has(table), `business-store.js must query ${table} for export/delete to be complete`);
}

console.log('business-store.js table names vs. versioned migrations: PASS');
