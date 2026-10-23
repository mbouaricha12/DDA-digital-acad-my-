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
revoke all on table public.dda_autotrader_quota_buckets from anon, authenticated;
create policy dda_autotrader_quota_buckets_deny_client
  on public.dda_autotrader_quota_buckets
  for all to anon, authenticated
  using (false) with check (false);

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
