-- DDA P7 migration: owner/admin role plane.
--
-- This is the database half of the admin control plane whose contract was
-- proposed (never deployed) in contracts/dda-admin-control-center-v1.json.
-- It assigns ONLY the `owner` and `admin` roles — the launch-essential
-- scope agreed with the founder. `editor`/`support`/`analyst` are deferred.
--
-- Security boundary (matches the control-center contract's
-- serverOwnsRoleAssignment / learnerRoutesCannotGrantAdmin requirements):
--   - No grant to anon or authenticated, at all. A learner session can
--     never read, infer or write any row of this table, including its own.
--   - Only the service role (the BFF, running with the Supabase service
--     key) can read or write dda_admin_roles. There is no PostgREST path
--     into this table from the browser.
--   - The founder's own `owner` row must be inserted manually, out of band,
--     once a real Supabase project exists — never by a migration, since a
--     migration cannot know the founder's real auth.users id and must not
--     guess or seed one. See the bootstrap note at the end of this file.

create table if not exists public.dda_admin_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin')),
  granted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists dda_admin_roles_role_idx on public.dda_admin_roles(role);

drop trigger if exists dda_admin_roles_touch_updated_at on public.dda_admin_roles;
create trigger dda_admin_roles_touch_updated_at
before update on public.dda_admin_roles
for each row execute function public.dda_touch_updated_at();

alter table public.dda_admin_roles enable row level security;

-- No browser grant exists at all — not even a restricted one. Unlike the
-- "select own row" tables elsewhere in this schema, a learner has no
-- legitimate reason to read this table, so there is nothing to grant.
revoke all on table public.dda_admin_roles from anon, authenticated;

drop policy if exists dda_admin_roles_deny_all on public.dda_admin_roles;
create policy dda_admin_roles_deny_all on public.dda_admin_roles
  for select to authenticated using (false);

-- ============================================================================
-- Owner bootstrap (manual, out of band — do not automate):
--
--   insert into public.dda_admin_roles (user_id, role)
--   values ('<founder-auth-user-id>', 'owner');
--
-- Run this once, directly against the real Supabase project, after the
-- founder has created their own account through the normal signup flow and
-- looked up their auth.users id. No other row may ever carry role = 'owner'
-- unless the founder inserts it themselves.
-- ============================================================================
