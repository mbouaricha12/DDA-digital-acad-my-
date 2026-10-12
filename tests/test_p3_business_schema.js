'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const schema = fs.readFileSync(path.join(__dirname, '..', 'bff', 'supabase', 'schema.sql'), 'utf8').toLowerCase();

const tables = {
  'public.dda_lesson_progress': ['progress_id uuid', 'owner_id uuid not null references auth.users(id)', 'lesson_id text not null', 'unique (owner_id, lesson_id)'],
  'public.dda_journal_entries': ['entry_id uuid', 'owner_id uuid not null references auth.users(id)', 'market text not null', 'note text not null', 'terminal_source boolean not null'],
  'public.dda_journal_plans': ['plan_id uuid', 'owner_id uuid not null unique references auth.users(id)', 'discipline_rules text not null', 'points_to_verify text not null'],
  'public.dda_preferences': ['owner_id uuid primary key references auth.users(id)', 'low_data boolean not null default false', 'reminders boolean not null default false']
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
