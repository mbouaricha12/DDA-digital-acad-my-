-- DDA BFF reference schema. Apply the versioned migrations in supabase/migrations/
-- to a reviewed Supabase project; this file is a complete human-readable contract.
create table if not exists public.dda_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 60),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.dda_sessions (
  session_id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  token_hash text not null unique, provider_access_token_enc text, provider_refresh_token_enc text,
  user_agent text, ip_hash text, created_at timestamptz not null default now(), last_seen_at timestamptz not null default now(),
  expires_at timestamptz not null, revoked_at timestamptz
);
create table if not exists public.lesson_progress (
  progress_id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade,
  lesson_id text not null check (char_length(lesson_id) between 1 and 80), lesson_viewed boolean not null default false,
  exercise_complete boolean not null default false, quiz_complete boolean not null default false, client_mutation_id uuid,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (owner_id, lesson_id), unique (owner_id, client_mutation_id)
);
create table if not exists public.journal_entries (
  entry_id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade,
  market text not null default '' check (char_length(market) <= 800), context text not null default '' check (char_length(context) <= 800),
  scenario text not null default '' check (char_length(scenario) <= 800), process text not null default '' check (char_length(process) <= 800),
  decision text not null default '' check (char_length(decision) <= 800), outcome text not null default '' check (char_length(outcome) <= 800),
  what_worked text not null default '' check (char_length(what_worked) <= 800), to_improve text not null default '' check (char_length(to_improve) <= 800),
  note text not null default '' check (char_length(note) <= 800), source_lesson text not null default '' check (char_length(source_lesson) <= 80),
  proof_id text not null default '' check (char_length(proof_id) <= 80), proof_type text not null default '' check (char_length(proof_type) <= 80),
  terminal_source boolean not null default false, client_mutation_id uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (owner_id, client_mutation_id)
);
create table if not exists public.journal_plans (
  plan_id uuid primary key default gen_random_uuid(), owner_id uuid not null unique references auth.users(id) on delete cascade,
  markets_studied text not null default '' check (char_length(markets_studied) <= 600), study_slots text not null default '' check (char_length(study_slots) <= 600),
  checklist text not null default '' check (char_length(checklist) <= 600), discipline_rules text not null default '' check (char_length(discipline_rules) <= 600),
  learning_goals text not null default '' check (char_length(learning_goals) <= 600), mistakes_to_avoid text not null default '' check (char_length(mistakes_to_avoid) <= 600),
  points_to_verify text not null default '' check (char_length(points_to_verify) <= 600), client_mutation_id uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (owner_id, client_mutation_id)
);
create table if not exists public.preferences (
  owner_id uuid primary key references auth.users(id) on delete cascade, low_data boolean not null default false, reminders boolean not null default false,
  client_mutation_id uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (owner_id, client_mutation_id)
);

-- P4 Chariow billing, server-only and idempotent.
create table if not exists public.dda_billing_deliveries (
  delivery_id text primary key check (char_length(delivery_id) between 1 and 160), provider text not null default 'chariow' check (provider = 'chariow'),
  event_name text, payload_sha256 text check (payload_sha256 is null or payload_sha256 ~ '^[0-9a-f]{64}$'),
  processed_status text not null default 'accepted' check (processed_status in ('accepted', 'processed', 'failed')),
  received_at timestamptz not null default now(), processed_at timestamptz
);
create table if not exists public.dda_billing_memberships (
  membership_id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'chariow' check (provider = 'chariow'), provider_customer_id text, product_id text not null,
  sale_id text, license_id text, external_id text not null, status text not null check (status in ('pending', 'active', 'expired', 'revoked')),
  entitlement_snapshot jsonb not null default '[]'::jsonb check (jsonb_typeof(entitlement_snapshot) = 'array'), source_event text not null,
  starts_at timestamptz, ends_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (provider, external_id)
);

create index if not exists dda_sessions_user_idx on public.dda_sessions(user_id);
create index if not exists dda_billing_memberships_user_idx on public.dda_billing_memberships(user_id, status);

alter table public.dda_profiles enable row level security;
alter table public.dda_sessions enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.journal_entries enable row level security;
alter table public.journal_plans enable row level security;
alter table public.preferences enable row level security;
alter table public.dda_billing_deliveries enable row level security;
alter table public.dda_billing_memberships enable row level security;

revoke all on table public.dda_profiles from anon, authenticated;
revoke all on table public.dda_sessions from anon, authenticated;
revoke all on table public.lesson_progress from anon, authenticated;
revoke all on table public.journal_entries from anon, authenticated;
revoke all on table public.journal_plans from anon, authenticated;
revoke all on table public.preferences from anon, authenticated;
revoke all on table public.dda_billing_deliveries from anon, authenticated;
revoke all on table public.dda_billing_memberships from anon, authenticated;

create policy dda_profiles_select_own on public.dda_profiles for select to authenticated using (user_id = (select auth.uid()));
create policy dda_profiles_insert_own on public.dda_profiles for insert to authenticated with check (user_id = (select auth.uid()));
create policy dda_profiles_update_own on public.dda_profiles for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy dda_profiles_delete_own on public.dda_profiles for delete to authenticated using (user_id = (select auth.uid()));
create policy dda_sessions_select_own on public.dda_sessions for select to authenticated using (user_id = (select auth.uid()));
create policy dda_lesson_progress_select_own on public.lesson_progress for select to authenticated using (owner_id = (select auth.uid()));
create policy dda_lesson_progress_insert_own on public.lesson_progress for insert to authenticated with check (owner_id = (select auth.uid()));
create policy dda_lesson_progress_update_own on public.lesson_progress for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy dda_lesson_progress_delete_own on public.lesson_progress for delete to authenticated using (owner_id = (select auth.uid()));
create policy dda_journal_entries_select_own on public.journal_entries for select to authenticated using (owner_id = (select auth.uid()));
create policy dda_journal_entries_insert_own on public.journal_entries for insert to authenticated with check (owner_id = (select auth.uid()));
create policy dda_journal_entries_update_own on public.journal_entries for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy dda_journal_entries_delete_own on public.journal_entries for delete to authenticated using (owner_id = (select auth.uid()));
create policy dda_journal_plans_select_own on public.journal_plans for select to authenticated using (owner_id = (select auth.uid()));
create policy dda_journal_plans_insert_own on public.journal_plans for insert to authenticated with check (owner_id = (select auth.uid()));
create policy dda_journal_plans_update_own on public.journal_plans for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy dda_journal_plans_delete_own on public.journal_plans for delete to authenticated using (owner_id = (select auth.uid()));
create policy dda_preferences_select_own on public.preferences for select to authenticated using (owner_id = (select auth.uid()));
create policy dda_preferences_insert_own on public.preferences for insert to authenticated with check (owner_id = (select auth.uid()));
create policy dda_preferences_update_own on public.preferences for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy dda_preferences_delete_own on public.preferences for delete to authenticated using (owner_id = (select auth.uid()));
create policy dda_billing_deliveries_no_browser_access on public.dda_billing_deliveries for all to authenticated using (false) with check (false);
create policy dda_billing_memberships_select_own on public.dda_billing_memberships for select to authenticated using (user_id = (select auth.uid()));
