-- DDA P3 migration 0002: server-backed business entities.
-- acquisition remains device-scoped by contract and is intentionally not a table.

create table if not exists public.memberships (
  membership_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan text not null check (plan in ('free', 'premium')),
  status text not null check (status in ('active', 'trial', 'expired', 'revoked')),
  source text not null check (source in ('system', 'provider', 'manual')),
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists memberships_user_idx on public.memberships(user_id);
create index if not exists memberships_active_idx on public.memberships(user_id, ends_at) where status in ('active', 'trial') and revoked_at is null;

create table if not exists public.onboarding (
  onboarding_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users(id) on delete cascade,
  level text not null default '' check (char_length(level) <= 40),
  goal text not null default '' check (char_length(goal) <= 80),
  time text not null default '' check (char_length(time) <= 80),
  complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  client_mutation_id uuid
);
create unique index if not exists onboarding_owner_mutation_idx on public.onboarding(owner_id, client_mutation_id) where client_mutation_id is not null;

create table if not exists public.lesson_progress (
  progress_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  lesson_id text not null,
  lesson_viewed boolean not null default false,
  exercise_complete boolean not null default false,
  quiz_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  client_mutation_id uuid,
  unique(owner_id, lesson_id)
);
create unique index if not exists lesson_progress_owner_mutation_idx on public.lesson_progress(owner_id, client_mutation_id) where client_mutation_id is not null;

create table if not exists public.terminal_state (
  terminal_state_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users(id) on delete cascade,
  instrument text not null check (instrument in ('BRVM Composite', 'BRVM 30', 'EUR/USD pédagogique')),
  timeframe text not null check (timeframe in ('1D', '1W', '1M')),
  zoom integer not null check (zoom between 1 and 3),
  pan integer not null default 0 check (pan between 0 and 200),
  observation text not null default '' check (char_length(observation) <= 1000),
  drawings jsonb not null default '[]'::jsonb,
  practice jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  client_mutation_id uuid
);
create unique index if not exists terminal_state_owner_mutation_idx on public.terminal_state(owner_id, client_mutation_id) where client_mutation_id is not null;

create table if not exists public.journal_entries (
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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  client_mutation_id uuid
);
create index if not exists journal_entries_owner_created_idx on public.journal_entries(owner_id, created_at desc);
create unique index if not exists journal_entries_owner_mutation_idx on public.journal_entries(owner_id, client_mutation_id) where client_mutation_id is not null;

create table if not exists public.journal_plans (
  plan_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users(id) on delete cascade,
  markets_studied text not null default '' check (char_length(markets_studied) <= 600),
  study_slots text not null default '' check (char_length(study_slots) <= 600),
  checklist text not null default '' check (char_length(checklist) <= 600),
  discipline_rules text not null default '' check (char_length(discipline_rules) <= 600),
  learning_goals text not null default '' check (char_length(learning_goals) <= 600),
  mistakes_to_avoid text not null default '' check (char_length(mistakes_to_avoid) <= 600),
  points_to_verify text not null default '' check (char_length(points_to_verify) <= 600),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  client_mutation_id uuid
);
create unique index if not exists journal_plans_owner_mutation_idx on public.journal_plans(owner_id, client_mutation_id) where client_mutation_id is not null;

create table if not exists public.premium_progress (
  progress_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  collection text not null check (collection in ('modules', 'labs', 'assessments', 'proofs', 'reviews')),
  item_key text not null check (char_length(item_key) <= 120),
  attempt_input jsonb,
  review_reflection text check (char_length(review_reflection) <= 800),
  review_pattern text check (char_length(review_pattern) <= 240),
  review_focus text check (char_length(review_focus) <= 240),
  review_next_action text check (char_length(review_next_action) <= 240),
  assessment_result text,
  passed boolean,
  proof_level text,
  entitlement text,
  source_lesson text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  client_mutation_id uuid,
  unique(owner_id, collection, item_key)
);
create unique index if not exists premium_progress_owner_mutation_idx on public.premium_progress(owner_id, client_mutation_id) where client_mutation_id is not null;

create table if not exists public.preferences (
  preference_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users(id) on delete cascade,
  low_data boolean not null default false,
  reminders boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  client_mutation_id uuid
);
create unique index if not exists preferences_owner_mutation_idx on public.preferences(owner_id, client_mutation_id) where client_mutation_id is not null;

create table if not exists public.audit_events (
  event_id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  event_name text not null,
  resource_type text not null,
  resource_id uuid,
  request_id text not null check (char_length(request_id) <= 80),
  created_at timestamptz not null default now()
);
create index if not exists audit_events_actor_created_idx on public.audit_events(actor_user_id, created_at desc);
create index if not exists audit_events_request_idx on public.audit_events(request_id);

-- All server-backed entities receive the canonical updated_at trigger.
do $$
declare
  table_name text;
begin
  foreach table_name in array array['memberships','onboarding','lesson_progress','terminal_state','journal_entries','journal_plans','premium_progress','preferences'] loop
    execute format('drop trigger if exists %I on public.%I', table_name || '_touch_updated_at', table_name);
    execute format('create trigger %I before update on public.%I for each row execute function public.dda_touch_updated_at()', table_name || '_touch_updated_at', table_name);
  end loop;
end $$;
