'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { TABLES } = require('../bff/src/business-store');

const root = path.join(__dirname, '..');
const businessSql = fs.readFileSync(path.join(root, 'supabase', 'migrations', '0002_business_entities.sql'), 'utf8').toLowerCase();
const securitySql = fs.readFileSync(path.join(root, 'supabase', 'migrations', '0003_rls_and_privileges.sql'), 'utf8').toLowerCase();

const tables = {
  lesson_progress: ['progress_id uuid', 'owner_id uuid not null references auth.users(id)', 'lesson_id text not null', 'unique(owner_id, lesson_id)'],
  journal_entries: ['entry_id uuid', 'owner_id uuid not null references auth.users(id)', 'market text not null default', 'note text not null default', 'terminal_source boolean not null default false'],
  journal_plans: ['plan_id uuid', 'owner_id uuid not null unique references auth.users(id)', 'discipline_rules text not null default', 'points_to_verify text not null default'],
  preferences: ['preference_id uuid', 'owner_id uuid not null unique references auth.users(id)', 'low_data boolean not null default false', 'reminders boolean not null default false']
};

for (const [name, fragments] of Object.entries(tables)) {
  assert.equal(TABLES[name]?.table, name, `BFF must use canonical public.${name}`);
  assert.equal(TABLES[name]?.owner, 'owner_id', `BFF must scope ${name} by owner_id`);
  assert.match(businessSql, new RegExp(`create table if not exists public\\.${name}\\b`), `public.${name} must exist in migration 0002`);
  for (const fragment of fragments) assert.ok(businessSql.includes(fragment), `public.${name} missing: ${fragment}`);
  assert.match(securitySql, new RegExp(`alter table public\\.${name} enable row level security`), `public.${name} must enable RLS`);
  assert.match(securitySql, new RegExp(`revoke all on table public\\.${name} from anon, authenticated`), `public.${name} must deny direct browser privileges`);
}

for (const field of ['market', 'context', 'scenario', 'process', 'decision', 'outcome', 'what_worked', 'to_improve', 'note']) {
  assert.match(businessSql, new RegExp(`${field} text not null default '' check \\(char_length\\(${field}\\) <= 800\\)`), `journal field ${field} must be bounded`);
}
for (const field of ['markets_studied', 'study_slots', 'checklist', 'discipline_rules', 'learning_goals', 'mistakes_to_avoid', 'points_to_verify']) {
  assert.match(businessSql, new RegExp(`${field} text not null default '' check \\(char_length\\(${field}\\) <= 600\\)`), `plan field ${field} must be bounded`);
}

console.log('P3 business schema contract: PASS');
