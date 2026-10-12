-- DDA BFF foundation schema. Apply only after reviewing the P3.1/P3.2 contracts.
-- The BFF uses the service role server-side; browser clients never receive it.

create table if not exists public.dda_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 60),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.dda_sessions (
  session_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token_hash text not null unique,
  provider_access_token_enc text,
  provider_refresh_token_enc text,
  user_agent text,
  ip_hash text,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz
);

create index if not exists dda_sessions_user_idx on public.dda_sessions(user_id);
create index if not exists dda_sessions_active_idx on public.dda_sessions(token_hash, expires_at) where revoked_at is null;

alter table public.dda_profiles enable row level security;
alter table public.dda_sessions enable row level security;

-- No browser role receives direct table access. All learner access goes through the BFF.
revoke all on table public.dda_profiles from anon, authenticated;
revoke all on table public.dda_sessions from anon, authenticated;

-- Direct authenticated access is narrowly scoped for defense in depth.
-- The BFF continues to use the service role server-side.
grant select, insert, update, delete on table public.dda_profiles to authenticated;
grant select on table public.dda_sessions to authenticated;
revoke insert, update, delete on table public.dda_sessions from authenticated;

drop policy if exists dda_profiles_select_own on public.dda_profiles;
drop policy if exists dda_profiles_insert_own on public.dda_profiles;
drop policy if exists dda_profiles_update_own on public.dda_profiles;
drop policy if exists dda_profiles_delete_own on public.dda_profiles;
drop policy if exists dda_sessions_select_own on public.dda_sessions;

create policy dda_profiles_select_own on public.dda_profiles
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy dda_profiles_insert_own on public.dda_profiles
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy dda_profiles_update_own on public.dda_profiles
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy dda_profiles_delete_own on public.dda_profiles
  for delete to authenticated
  using (user_id = (select auth.uid()));

create policy dda_sessions_select_own on public.dda_sessions
  for select to authenticated
  using (user_id = (select auth.uid()));

-- The service role is used only by the BFF and is never shipped to the SPA.


-- P3.1 user-owned learning data.
-- These tables are intentionally server-authorized: the BFF uses the service role;
-- browser roles receive no direct table privileges even though ownership policies
-- remain defined as defense in depth for any future authenticated database path.

create table if not exists public.dda_lesson_progress (
  progress_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  lesson_id text not null check (char_length(lesson_id) between 1 and 80),
  lesson_viewed boolean not null default false,
  exercise_complete boolean not null default false,
  quiz_complete boolean not null default false,
  client_mutation_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, lesson_id),
  unique (owner_id, client_mutation_id)
);

create table if not exists public.dda_journal_entries (
  entry_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  market text not null default '' check (char_length(market) <= 800),
  context text not null default '' check (char_length(context) <= 800),
  scenario text not null default '' check (char_length(scenario) <= 800),
  process text not null default '' check (char_length(process) <= 800),
  decision text not null default '' check (char_length(decision) <= 800),
  outcome text not null default '' check (char_length(outcome) <= 800),
  what_worked text not null default '' check (char_length(what_worked) <= 800),
  to_improve text not null default '' check (char_length(to_improve) <= 800),
  note text not null default '' check (char_length(note) <= 800),
  source_lesson text not null default '' check (char_length(source_lesson) <= 80),
  proof_id text not null default '' check (char_length(proof_id) <= 80),
  proof_type text not null default '' check (char_length(proof_type) <= 80),
  terminal_source boolean not null default false,
  client_mutation_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, client_mutation_id)
);

create table if not exists public.dda_journal_plans (
  plan_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users(id) on delete cascade,
  markets_studied text not null default '' check (char_length(markets_studied) <= 600),
  study_slots text not null default '' check (char_length(study_slots) <= 600),
  checklist text not null default '' check (char_length(checklist) <= 600),
  discipline_rules text not null default '' check (char_length(discipline_rules) <= 600),
  learning_goals text not null default '' check (char_length(learning_goals) <= 600),
  mistakes_to_avoid text not null default '' check (char_length(mistakes_to_avoid) <= 600),
  points_to_verify text not null default '' check (char_length(points_to_verify) <= 600),
  client_mutation_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, client_mutation_id)
);

create table if not exists public.dda_preferences (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  low_data boolean not null default false,
  reminders boolean not null default false,
  client_mutation_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, client_mutation_id)
);

create index if not exists dda_lesson_progress_owner_idx on public.dda_lesson_progress(owner_id);
create index if not exists dda_journal_entries_owner_created_idx on public.dda_journal_entries(owner_id, created_at desc);
create index if not exists dda_journal_plans_owner_idx on public.dda_journal_plans(owner_id);

alter table public.dda_lesson_progress enable row level security;
alter table public.dda_journal_entries enable row level security;
alter table public.dda_journal_plans enable row level security;
alter table public.dda_preferences enable row level security;

revoke all on table public.dda_lesson_progress from anon, authenticated;
revoke all on table public.dda_journal_entries from anon, authenticated;
revoke all on table public.dda_journal_plans from anon, authenticated;
revoke all on table public.dda_preferences from anon, authenticated;

drop policy if exists dda_lesson_progress_select_own on public.dda_lesson_progress;
drop policy if exists dda_lesson_progress_insert_own on public.dda_lesson_progress;
drop policy if exists dda_lesson_progress_update_own on public.dda_lesson_progress;
drop policy if exists dda_lesson_progress_delete_own on public.dda_lesson_progress;
create policy dda_lesson_progress_select_own on public.dda_lesson_progress for select to authenticated using (owner_id = (select auth.uid()));
create policy dda_lesson_progress_insert_own on public.dda_lesson_progress for insert to authenticated with check (owner_id = (select auth.uid()));
create policy dda_lesson_progress_update_own on public.dda_lesson_progress for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy dda_lesson_progress_delete_own on public.dda_lesson_progress for delete to authenticated using (owner_id = (select auth.uid()));

drop policy if exists dda_journal_entries_select_own on public.dda_journal_entries;
drop policy if exists dda_journal_entries_insert_own on public.dda_journal_entries;
drop policy if exists dda_journal_entries_update_own on public.dda_journal_entries;
drop policy if exists dda_journal_entries_delete_own on public.dda_journal_entries;
create policy dda_journal_entries_select_own on public.dda_journal_entries for select to authenticated using (owner_id = (select auth.uid()));
create policy dda_journal_entries_insert_own on public.dda_journal_entries for insert to authenticated with check (owner_id = (select auth.uid()));
create policy dda_journal_entries_update_own on public.dda_journal_entries for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy dda_journal_entries_delete_own on public.dda_journal_entries for delete to authenticated using (owner_id = (select auth.uid()));

drop policy if exists dda_journal_plans_select_own on public.dda_journal_plans;
drop policy if exists dda_journal_plans_insert_own on public.dda_journal_plans;
drop policy if exists dda_journal_plans_update_own on public.dda_journal_plans;
drop policy if exists dda_journal_plans_delete_own on public.dda_journal_plans;
create policy dda_journal_plans_select_own on public.dda_journal_plans for select to authenticated using (owner_id = (select auth.uid()));
create policy dda_journal_plans_insert_own on public.dda_journal_plans for insert to authenticated with check (owner_id = (select auth.uid()));
create policy dda_journal_plans_update_own on public.dda_journal_plans for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy dda_journal_plans_delete_own on public.dda_journal_plans for delete to authenticated using (owner_id = (select auth.uid()));

drop policy if exists dda_preferences_select_own on public.dda_preferences;
drop policy if exists dda_preferences_insert_own on public.dda_preferences;
drop policy if exists dda_preferences_update_own on public.dda_preferences;
drop policy if exists dda_preferences_delete_own on public.dda_preferences;
create policy dda_preferences_select_own on public.dda_preferences for select to authenticated using (owner_id = (select auth.uid()));
create policy dda_preferences_insert_own on public.dda_preferences for insert to authenticated with check (owner_id = (select auth.uid()));
create policy dda_preferences_update_own on public.dda_preferences for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy dda_preferences_delete_own on public.dda_preferences for delete to authenticated using (owner_id = (select auth.uid()));
