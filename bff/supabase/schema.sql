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
