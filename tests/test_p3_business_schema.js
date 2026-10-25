'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const schema = fs.readFileSync(path.join(__dirname, '..', 'bff', 'supabase', 'schema.sql'), 'utf8').toLowerCase();

// Table names here must match supabase/migrations/0002_business_entities.sql
// exactly: lesson_progress/journal_entries/journal_plans/preferences carry NO
// dda_ prefix there, unlike dda_profiles/dda_sessions/dda_billing_* which do.
// This file used to assert the dda_-prefixed names (a stale leftover from
// before the versioned migrations existed), which bff/src/business-store.js
// was then written to match — so the only two things "confirming" the wrong
// names were confirming each other. Neither table was ever queried against a
// real Supabase project. See test_business_store_table_names_contract.js for
// the cross-file check that now prevents this specific class of drift.
const tables = {
  'public.lesson_progress': ['progress_id uuid', 'owner_id uuid not null references auth.users(id)', 'lesson_id text not null', 'unique (owner_id, lesson_id)'],
  'public.journal_entries': ['entry_id uuid', 'owner_id uuid not null references auth.users(id)', 'market text not null', 'note text not null', 'terminal_source boolean not null'],
  'public.journal_plans': ['plan_id uuid', 'owner_id uuid not null unique references auth.users(id)', 'discipline_rules text not null', 'points_to_verify text not null'],
  'public.preferences': ['owner_id uuid primary key references auth.users(id)', 'low_data boolean not null default false', 'reminders boolean not null default false']
};

for (const [table, fragments] of Object.entries(tables)) {
  assert.match(schema, new RegExp(`create table if not exists ${table.replace('.', '\\.')}`), `${table} must exist`);
  assert.match(schema, new RegExp(`alter table ${table.replace('.', '\\.')} enable row level security`), `${table} must enable RLS`);
  assert.match(schema, new RegExp(`revoke all on table ${table.replace('.', '\\.')} from anon, authenticated`), `${table} must have no direct browser privileges`);
  for (const fragment of fragments) assert.ok(schema.includes(fragment), `${table} missing: ${fragment}`);
  for (const action of ['select', 'insert', 'update', 'delete']) {
    assert.match(schema, new RegExp(`create policy [a-z_]+_${action}_own on ${table.replace('.', '\\.')}`), `${table} missing ${action} ownership policy`);
  }
  assert.match(schema, new RegExp(`owner_id = \\(select auth\\.uid\\(\\)\\)`), `${table} must bind access to auth.uid()`);
}

for (const field of ['market', 'context', 'scenario', 'process', 'decision', 'outcome', 'what_worked', 'to_improve', 'note']) {
  assert.match(schema, new RegExp(`${field} text not null default '' check \\(char_length\\(${field}\\) <= 800\\)`), `journal field ${field} must be bounded`);
}
for (const field of ['markets_studied', 'study_slots', 'checklist', 'discipline_rules', 'learning_goals', 'mistakes_to_avoid', 'points_to_verify']) {
  assert.match(schema, new RegExp(`${field} text not null default '' check \\(char_length\\(${field}\\) <= 600\\)`), `plan field ${field} must be bounded`);
}

console.log('P3 business schema contract: PASS');
