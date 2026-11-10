-- DDA phase: instructor-role foundations and protected access audit.
-- This migration does not activate learner-facing instructor routes. It only
-- gives the BFF a server-owned vocabulary and an append-only audit sink.

alter table public.dda_admin_roles
drop constraint if exists dda_admin_roles_role_check;

alter table public.dda_admin_roles
add constraint dda_admin_roles_role_check check (role in (
  'owner', 'admin', 'content_author', 'reviewer', 'support_agent', 'instructor', 'data_steward'
));

alter table public.audit_events
add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.audit_events
drop constraint if exists audit_events_metadata_object;
alter table public.audit_events
add constraint audit_events_metadata_object check (jsonb_typeof(metadata) = 'object');

create index if not exists audit_events_name_created_idx
  on public.audit_events(event_name, created_at desc);

-- The BFF service role is the only writer. Even that role must not mutate an
-- existing event: corrections are new events, never UPDATE/DELETE operations.
create or replace function public.dda_audit_events_append_only()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  raise exception 'audit_events is append-only';
end;
$$;

revoke all on function public.dda_audit_events_append_only() from public, anon, authenticated, service_role;

drop trigger if exists audit_events_append_only_guard on public.audit_events;
create trigger audit_events_append_only_guard
before update or delete on public.audit_events
for each row execute function public.dda_audit_events_append_only();

alter table public.audit_events enable row level security;
revoke all on table public.audit_events from public, anon, authenticated;
drop policy if exists audit_events_select_none_explicit on public.audit_events;
create policy audit_events_select_none_explicit on public.audit_events
for select to authenticated using (false);

comment on table public.dda_admin_roles is 'Server-owned role assignments. Future pedagogical roles are inert until their authorization contracts ship.';
comment on table public.audit_events is 'Server-owned append-only audit events. Browser roles have no access.';
