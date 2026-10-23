-- DEPRECATED HISTORICAL REFERENCE ONLY. Do not apply this file to provision a database.
-- The canonical schema is the ordered migration set in ../../supabase/migrations/.
-- This file is retained to preserve the earlier BFF draft and is not used at runtime.
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
create table if not exists public.dda_lesson_progress (
  progress_id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade,
  lesson_id text not null check (char_length(lesson_id) between 1 and 80), lesson_viewed boolean not null default false,
  exercise_complete boolean not null default false, quiz_complete boolean not null default false, client_mutation_id uuid,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (owner_id, lesson_id), unique (owner_id, client_mutation_id)
);
create table if not exists public.dda_journal_entries (
  entry_id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade,
  market text not null default '' check (char_length(market) <= 800), context text not null default '' check (char_length(context) <= 800),
  scenario text not null default '' check (char_length(scenario) <= 800), process text not null default '' check (char_length(process) <= 800),
  decision text not null default '' check (char_length(decision) <= 800), outcome text not null default '' check (char_length(outcome) <= 800),
  what_worked text not null default '' check (char_length(what_worked) <= 800), to_improve text not null default '' check (char_length(to_improve) <= 800),
  note text not null default '' check (char_length(note) <= 800), source_lesson text not null default '' check (char_length(source_lesson) <= 80),
  proof_id text not null default '' check (char_length(proof_id) <= 80), proof_type text not null default '' check (char_length(proof_type) <= 80),
  terminal_source boolean not null default false, client_mutation_id uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (owner_id, client_mutation_id)
);
create table if not exists public.dda_journal_plans (
  plan_id uuid primary key default gen_random_uuid(), owner_id uuid not null unique references auth.users(id) on delete cascade,
  markets_studied text not null default '' check (char_length(markets_studied) <= 600), study_slots text not null default '' check (char_length(study_slots) <= 600),
  checklist text not null default '' check (char_length(checklist) <= 600), discipline_rules text not null default '' check (char_length(discipline_rules) <= 600),
  learning_goals text not null default '' check (char_length(learning_goals) <= 600), mistakes_to_avoid text not null default '' check (char_length(mistakes_to_avoid) <= 600),
  points_to_verify text not null default '' check (char_length(points_to_verify) <= 600), client_mutation_id uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (owner_id, client_mutation_id)
);
create table if not exists public.dda_preferences (
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
  entitlement_snapshot jsonb not null default '[]'::jsonb check (jsonb_typeof(entitlement_snapshot) = 'array' and entitlement_snapshot <@ '["premium_track", "resources_premium", "certificate_preview", "advanced_modules", "autotrader.analysis"]'::jsonb), source_event text not null,
  starts_at timestamptz, ends_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (provider, external_id)
);

create index if not exists dda_sessions_user_idx on public.dda_sessions(user_id);
create index if not exists dda_billing_memberships_user_idx on public.dda_billing_memberships(user_id, status);

alter table public.dda_profiles enable row level security;
alter table public.dda_sessions enable row level security;
alter table public.dda_lesson_progress enable row level security;
alter table public.dda_journal_entries enable row level security;
alter table public.dda_journal_plans enable row level security;
alter table public.dda_preferences enable row level security;
alter table public.dda_billing_deliveries enable row level security;
alter table public.dda_billing_memberships enable row level security;

revoke all on table public.dda_profiles from anon, authenticated;
revoke all on table public.dda_sessions from anon, authenticated;
revoke all on table public.dda_lesson_progress from anon, authenticated;
revoke all on table public.dda_journal_entries from anon, authenticated;
revoke all on table public.dda_journal_plans from anon, authenticated;
revoke all on table public.dda_preferences from anon, authenticated;
revoke all on table public.dda_billing_deliveries from anon, authenticated;
revoke all on table public.dda_billing_memberships from anon, authenticated;

create policy dda_profiles_select_own on public.dda_profiles for select to authenticated using (user_id = (select auth.uid()));
create policy dda_profiles_insert_own on public.dda_profiles for insert to authenticated with check (user_id = (select auth.uid()));
create policy dda_profiles_update_own on public.dda_profiles for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy dda_profiles_delete_own on public.dda_profiles for delete to authenticated using (user_id = (select auth.uid()));
create policy dda_sessions_select_own on public.dda_sessions for select to authenticated using (user_id = (select auth.uid()));
create policy dda_lesson_progress_select_own on public.dda_lesson_progress for select to authenticated using (owner_id = (select auth.uid()));
create policy dda_lesson_progress_insert_own on public.dda_lesson_progress for insert to authenticated with check (owner_id = (select auth.uid()));
create policy dda_lesson_progress_update_own on public.dda_lesson_progress for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy dda_lesson_progress_delete_own on public.dda_lesson_progress for delete to authenticated using (owner_id = (select auth.uid()));
create policy dda_journal_entries_select_own on public.dda_journal_entries for select to authenticated using (owner_id = (select auth.uid()));
create policy dda_journal_entries_insert_own on public.dda_journal_entries for insert to authenticated with check (owner_id = (select auth.uid()));
create policy dda_journal_entries_update_own on public.dda_journal_entries for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy dda_journal_entries_delete_own on public.dda_journal_entries for delete to authenticated using (owner_id = (select auth.uid()));
create policy dda_journal_plans_select_own on public.dda_journal_plans for select to authenticated using (owner_id = (select auth.uid()));
create policy dda_journal_plans_insert_own on public.dda_journal_plans for insert to authenticated with check (owner_id = (select auth.uid()));
create policy dda_journal_plans_update_own on public.dda_journal_plans for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy dda_journal_plans_delete_own on public.dda_journal_plans for delete to authenticated using (owner_id = (select auth.uid()));
create policy dda_preferences_select_own on public.dda_preferences for select to authenticated using (owner_id = (select auth.uid()));
create policy dda_preferences_insert_own on public.dda_preferences for insert to authenticated with check (owner_id = (select auth.uid()));
create policy dda_preferences_update_own on public.dda_preferences for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy dda_preferences_delete_own on public.dda_preferences for delete to authenticated using (owner_id = (select auth.uid()));
create policy dda_billing_deliveries_no_browser_access on public.dda_billing_deliveries for all to authenticated using (false) with check (false);
create policy dda_billing_memberships_select_own on public.dda_billing_memberships for select to authenticated using (user_id = (select auth.uid()));
-- DDA AutoTrader quotas v1. Apply only after reviewing the policy; never auto-run from the BFF.
create table if not exists public.dda_autotrader_quota_buckets (
  scope_type text not null check (scope_type in ('user', 'provider')),
  scope_id text not null check (char_length(scope_id) between 1 and 120),
  metric text not null check (metric in ('analysis_request', 'provider_request', 'provider_units')),
  window_start timestamptz not null,
  window_end timestamptz not null check (window_end > window_start),
  limit_units bigint not null check (limit_units > 0),
  used_units bigint not null default 0 check (used_units >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (scope_type, scope_id, metric, window_start),
  check ((scope_type = 'user' and metric = 'analysis_request') or (scope_type = 'provider' and metric in ('provider_request', 'provider_units'))),
  check ((scope_type <> 'provider') or scope_id ~ '^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$')
);
create index if not exists dda_autotrader_quota_window_end_idx on public.dda_autotrader_quota_buckets(window_end);
alter table public.dda_autotrader_quota_buckets enable row level security;
revoke all on table public.dda_autotrader_quota_buckets from public, anon, authenticated;

create or replace function public.reserve_dda_autotrader_quota(p_reservations jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_item jsonb;
  v_scope_type text;
  v_scope_id text;
  v_metric text;
  v_window_start timestamptz;
  v_window_end timestamptz;
  v_limit bigint;
  v_amount bigint;
  v_used bigint;
  v_lock_key text;
  v_denial jsonb;
  v_count integer;
  v_unique_count integer;
begin
  if p_reservations is null or jsonb_typeof(p_reservations) is distinct from 'array' then
    raise exception using errcode = '22023', message = 'invalid quota reservation bundle';
  end if;
  if jsonb_array_length(p_reservations) < 1 or jsonb_array_length(p_reservations) > 8 then
    raise exception using errcode = '22023', message = 'invalid quota reservation bundle';
  end if;

  select count(*), count(distinct jsonb_build_array(value->>'scope_type', value->>'scope_id', value->>'metric', value->>'window_start')::text)
    into v_count, v_unique_count
    from jsonb_array_elements(p_reservations) as entries(value);
  if v_count <> v_unique_count then
    raise exception using errcode = '22023', message = 'duplicate quota bucket';
  end if;

  -- Lock every bucket in a deterministic order; hash collisions only serialize unrelated buckets.
  for v_item in
    select value from jsonb_array_elements(p_reservations) as entries(value)
    order by value->>'scope_type', value->>'scope_id', value->>'metric', value->>'window_start'
  loop
    v_scope_type := v_item->>'scope_type';
    v_scope_id := v_item->>'scope_id';
    v_metric := v_item->>'metric';
    if jsonb_typeof(v_item) <> 'object'
      or v_scope_type not in ('user', 'provider')
      or v_scope_id is null or char_length(v_scope_id) < 1 or char_length(v_scope_id) > 120
      or v_metric not in ('analysis_request', 'provider_request', 'provider_units')
      or (v_scope_type = 'user' and (v_metric <> 'analysis_request' or v_scope_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'))
      or (v_scope_type = 'provider' and (v_metric = 'analysis_request' or v_scope_id !~ '^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$')) then
      raise exception using errcode = '22023', message = 'invalid quota bucket';
    end if;
    v_lock_key := concat_ws('|', v_scope_type, v_scope_id, v_metric, v_item->>'window_start');
    perform pg_advisory_xact_lock(hashtextextended(v_lock_key, 0));
  end loop;

  begin
    for v_item in
      select value from jsonb_array_elements(p_reservations) as entries(value)
      order by value->>'scope_type', value->>'scope_id', value->>'metric', value->>'window_start'
    loop
      v_scope_type := v_item->>'scope_type';
      v_scope_id := v_item->>'scope_id';
      v_metric := v_item->>'metric';
      v_window_start := (v_item->>'window_start')::timestamptz;
      v_window_end := (v_item->>'window_end')::timestamptz;
      v_limit := (v_item->>'limit_units')::bigint;
      v_amount := (v_item->>'amount')::bigint;
      if v_window_end <= v_window_start or v_limit < 1 or v_amount < 1 then
        raise exception using errcode = '22023', message = 'invalid quota window or amount';
      end if;

      insert into public.dda_autotrader_quota_buckets (scope_type, scope_id, metric, window_start, window_end, limit_units, used_units)
      values (v_scope_type, v_scope_id, v_metric, v_window_start, v_window_end, v_limit, 0)
      on conflict (scope_type, scope_id, metric, window_start)
      do update set window_end = excluded.window_end, limit_units = excluded.limit_units, updated_at = now();

      select used_units into v_used
      from public.dda_autotrader_quota_buckets
      where scope_type = v_scope_type and scope_id = v_scope_id and metric = v_metric and window_start = v_window_start
      for update;

      if v_used + v_amount > v_limit then
        v_denial := jsonb_build_object('allowed', false, 'scope_type', v_scope_type, 'metric', v_metric, 'retry_at', v_window_end);
        raise exception using errcode = 'P0001', message = 'quota_exceeded';
      end if;

      update public.dda_autotrader_quota_buckets
      set used_units = used_units + v_amount, updated_at = now()
      where scope_type = v_scope_type and scope_id = v_scope_id and metric = v_metric and window_start = v_window_start;
    end loop;
  exception when sqlstate 'P0001' then
    -- The PL/pgSQL exception subtransaction rolls back every partial bucket reservation.
    return v_denial;
  end;

  return jsonb_build_object('allowed', true);
end;
$$;

revoke all on function public.reserve_dda_autotrader_quota(jsonb) from public, anon, authenticated;
grant execute on function public.reserve_dda_autotrader_quota(jsonb) to service_role;

create or replace function public.cleanup_dda_autotrader_quota_buckets(p_older_than timestamptz)
returns bigint
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_deleted bigint;
begin
  delete from public.dda_autotrader_quota_buckets where window_end < p_older_than;
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;
revoke all on function public.cleanup_dda_autotrader_quota_buckets(timestamptz) from public, anon, authenticated;
grant execute on function public.cleanup_dda_autotrader_quota_buckets(timestamptz) to service_role;
