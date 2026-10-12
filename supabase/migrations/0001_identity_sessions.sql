-- DDA P3 migration 0001: identity boundary and opaque sessions.
-- Requires Supabase auth.users. This file is never executed by this repository automatically.

create extension if not exists pgcrypto;

create or replace function public.dda_touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.dda_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 60),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists dda_profiles_touch_updated_at on public.dda_profiles;
create trigger dda_profiles_touch_updated_at
before update on public.dda_profiles
for each row execute function public.dda_touch_updated_at();

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

revoke all on table public.dda_profiles from anon, authenticated;
revoke all on table public.dda_sessions from anon, authenticated;
-- The browser may read its profile and change only display_name. Identity,
-- ownership and timestamps remain BFF/service-role responsibilities.
grant select on table public.dda_profiles to authenticated;
grant update (display_name) on table public.dda_profiles to authenticated;

drop policy if exists dda_profiles_select_own on public.dda_profiles;
drop policy if exists dda_profiles_update_own on public.dda_profiles;
drop policy if exists dda_sessions_select_own on public.dda_sessions;

create policy dda_profiles_select_own on public.dda_profiles
  for select to authenticated using (user_id = (select auth.uid()));
create policy dda_profiles_update_own on public.dda_profiles
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy dda_sessions_select_own on public.dda_sessions
  for select to authenticated using (user_id = (select auth.uid()));
