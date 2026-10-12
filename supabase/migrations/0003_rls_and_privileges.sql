-- DDA P3 migration 0003: RLS, least privilege and append-only audit events.
-- The BFF service role performs server mutations. Browser roles receive no direct
-- write access to server-owned fields or audit events.

do $$
declare
  table_name text;
begin
  foreach table_name in array array['memberships','onboarding','lesson_progress','terminal_state','journal_entries','journal_plans','premium_progress','preferences','audit_events'] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on table public.%I from anon, authenticated', table_name);
  end loop;
end $$;

-- Authenticated users may read only their own user-owned learning records.
-- All writes remain BFF/service-role operations so owner and server timestamps
-- cannot be supplied by an untrusted browser.
do $$
declare
  table_name text;
begin
  foreach table_name in array array['onboarding','lesson_progress','terminal_state','journal_entries','journal_plans','premium_progress','preferences'] loop
    execute format('drop policy if exists %I on public.%I', table_name || '_select_own', table_name);
    execute format('create policy %I on public.%I for select to authenticated using (owner_id = (select auth.uid()))', table_name || '_select_own', table_name);
  end loop;
end $$;

drop policy if exists memberships_select_own on public.memberships;
create policy memberships_select_own on public.memberships
  for select to authenticated using (user_id = (select auth.uid()));

-- Audit events are server-owned and append-only. No authenticated or anonymous
-- grants are present; the service role is the only writer.
drop policy if exists audit_events_select_none on public.audit_events;
create policy audit_events_select_none on public.audit_events
  for select to authenticated using (false);

revoke update, delete on table public.audit_events from public, anon, authenticated;
revoke insert on table public.audit_events from public, anon, authenticated;

-- Explicit declarations are intentionally repeated below: they keep the migration
-- reviewable by simple static tooling as well as executable by PostgreSQL.
alter table public.memberships enable row level security;
alter table public.onboarding enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.terminal_state enable row level security;
alter table public.journal_entries enable row level security;
alter table public.journal_plans enable row level security;
alter table public.premium_progress enable row level security;
alter table public.preferences enable row level security;
alter table public.audit_events enable row level security;

revoke all on table public.memberships from anon, authenticated;
revoke all on table public.onboarding from anon, authenticated;
revoke all on table public.lesson_progress from anon, authenticated;
revoke all on table public.terminal_state from anon, authenticated;
revoke all on table public.journal_entries from anon, authenticated;
revoke all on table public.journal_plans from anon, authenticated;
revoke all on table public.premium_progress from anon, authenticated;
revoke all on table public.preferences from anon, authenticated;
revoke all on table public.audit_events from public, anon, authenticated;

-- Named owner policies are explicit and intentionally read-only for browser roles.
drop policy if exists memberships_select_own_explicit on public.memberships;
create policy memberships_select_own_explicit on public.memberships for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists onboarding_select_own_explicit on public.onboarding;
create policy onboarding_select_own_explicit on public.onboarding for select to authenticated using (owner_id = (select auth.uid()));
drop policy if exists lesson_progress_select_own_explicit on public.lesson_progress;
create policy lesson_progress_select_own_explicit on public.lesson_progress for select to authenticated using (owner_id = (select auth.uid()));
drop policy if exists terminal_state_select_own_explicit on public.terminal_state;
create policy terminal_state_select_own_explicit on public.terminal_state for select to authenticated using (owner_id = (select auth.uid()));
drop policy if exists journal_entries_select_own_explicit on public.journal_entries;
create policy journal_entries_select_own_explicit on public.journal_entries for select to authenticated using (owner_id = (select auth.uid()));
drop policy if exists journal_plans_select_own_explicit on public.journal_plans;
create policy journal_plans_select_own_explicit on public.journal_plans for select to authenticated using (owner_id = (select auth.uid()));
drop policy if exists premium_progress_select_own_explicit on public.premium_progress;
create policy premium_progress_select_own_explicit on public.premium_progress for select to authenticated using (owner_id = (select auth.uid()));
drop policy if exists preferences_select_own_explicit on public.preferences;
create policy preferences_select_own_explicit on public.preferences for select to authenticated using (owner_id = (select auth.uid()));
drop policy if exists audit_events_select_none_explicit on public.audit_events;
create policy audit_events_select_none_explicit on public.audit_events for select to authenticated using (false);
revoke all on table public.audit_events from anon;
