-- DDA P4 follow-up: protect membership state from out-of-order signed Pulse events.
-- Apply manually after reviewing on staging; this repository never runs migrations automatically.
alter table public.dda_billing_memberships
  add column if not exists source_occurred_at timestamptz;

-- Existing rows lack provider event time. updated_at is the conservative local
-- barrier: an older delayed event must not overwrite the current stored state.
update public.dda_billing_memberships
set source_occurred_at = coalesce(updated_at, created_at, starts_at, ends_at, now())
where source_occurred_at is null;

alter table public.dda_billing_memberships
  alter column source_occurred_at set not null;

create or replace function public.guard_dda_billing_membership_event_order()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.user_id is distinct from old.user_id
    or new.provider is distinct from old.provider
    or new.external_id is distinct from old.external_id
    or new.product_id is distinct from old.product_id then
    -- Provider identity and product ownership are immutable for one external license/sale.
    return old;
  end if;

  if new.source_occurred_at < old.source_occurred_at then
    return old;
  end if;

  if new.source_occurred_at = old.source_occurred_at
    and old.status in ('expired', 'revoked')
    and new.status = 'active' then
    -- At an equal provider timestamp, a terminal state wins over activation.
    return old;
  end if;

  return new;
end;
$$;
revoke all on function public.guard_dda_billing_membership_event_order() from public, anon, authenticated;
grant execute on function public.guard_dda_billing_membership_event_order() to service_role;

drop trigger if exists dda_billing_membership_event_order on public.dda_billing_memberships;
create trigger dda_billing_membership_event_order
before update on public.dda_billing_memberships
for each row execute function public.guard_dda_billing_membership_event_order();
