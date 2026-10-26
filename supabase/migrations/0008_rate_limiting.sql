-- DDA migration 0008: minimal shared-storage rate limiting for unauthenticated BFF auth routes.
-- Scope: register, verify-email, login, password-reset/request, password-reset/confirm.
-- Vercel serverless functions do not share process memory across invocations, so the
-- counter must live in a shared store (here: Postgres) rather than an in-memory Map.
create table if not exists public.dda_rate_limit_counters (
  bucket_key text primary key check (char_length(bucket_key) between 1 and 200),
  window_start timestamptz not null,
  hit_count integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.dda_rate_limit_counters enable row level security;
revoke all on table public.dda_rate_limit_counters from anon, authenticated;
drop policy if exists dda_rate_limit_counters_no_browser_access on public.dda_rate_limit_counters;
create policy dda_rate_limit_counters_no_browser_access on public.dda_rate_limit_counters for all to authenticated using (false) with check (false);

-- Atomic check-and-increment: resets the window when it has expired, otherwise increments.
-- Returns true when the hit is within the limit (i.e. the caller may proceed), false once
-- the bucket is over its limit for the current window. A single round trip avoids the
-- read-then-write race a naive SELECT + UPDATE from the BFF would have under concurrency.
create or replace function public.dda_rate_limit_hit(p_key text, p_window_seconds integer, p_limit integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_count integer;
begin
  insert into public.dda_rate_limit_counters (bucket_key, window_start, hit_count, updated_at)
  values (p_key, v_now, 1, v_now)
  on conflict (bucket_key) do update set
    window_start = case when public.dda_rate_limit_counters.window_start <= v_now - make_interval(secs => p_window_seconds)
                        then v_now else public.dda_rate_limit_counters.window_start end,
    hit_count = case when public.dda_rate_limit_counters.window_start <= v_now - make_interval(secs => p_window_seconds)
                     then 1 else public.dda_rate_limit_counters.hit_count + 1 end,
    updated_at = v_now
  returning hit_count into v_count;
  return v_count <= p_limit;
end;
$$;

revoke all on function public.dda_rate_limit_hit(text, integer, integer) from anon, authenticated;
grant execute on function public.dda_rate_limit_hit(text, integer, integer) to service_role;
