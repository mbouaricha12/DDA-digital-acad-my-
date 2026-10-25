-- DDA P3/P4 migration 0006: restore the missing GRANTs behind existing "select own" policies.
--
-- 0003_rls_and_privileges.sql and 0004_chariow_billing.sql create `for select to
-- authenticated using (owner_id = auth.uid())`-style policies on these tables, but
-- never issue the matching `grant select ... to authenticated` — unlike
-- 0001_identity_sessions.sql, which does grant select on dda_profiles. In Postgres,
-- a row-level security policy only narrows which rows a role can see; it never
-- grants the underlying table privilege. Without the GRANT, `revoke all ... from
-- authenticated` (already present in 0003/0004) blocks every read regardless of the
-- policy, so these "select own" policies have been inert since they were written.
--
-- This failed closed — no authenticated browser role could read rows it shouldn't —
-- so it was not an exploitable gap. It was a correctness bug: the comments and
-- policies claim "authenticated users may read only their own records," which was
-- never actually true until this migration. The BFF itself is unaffected either way,
-- since it always reads through the service-role key and never relies on these
-- authenticated-role grants.
--
-- audit_events (0003) and dda_billing_deliveries (0004) are deliberately left
-- ungranted: both carry a `for select to authenticated using (false)` policy, i.e.
-- no row is ever meant to be visible to the authenticated role, so no grant belongs
-- there.
--
-- Written as explicit literal statements, not a PL/pgSQL loop: 0003 already notes
-- this project's own convention of keeping GRANT/REVOKE/POLICY statements reviewable
-- by simple static tooling as well as executable by PostgreSQL.
grant select on table public.memberships to authenticated;
grant select on table public.onboarding to authenticated;
grant select on table public.lesson_progress to authenticated;
grant select on table public.terminal_state to authenticated;
grant select on table public.journal_entries to authenticated;
grant select on table public.journal_plans to authenticated;
grant select on table public.premium_progress to authenticated;
grant select on table public.preferences to authenticated;
grant select on table public.dda_billing_memberships to authenticated;
