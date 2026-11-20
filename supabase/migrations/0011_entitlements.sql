-- DDA Lot 2 (back-office) migration 0011: admin-granted entitlements.
-- Complements dda_billing_memberships, never replaces it: a Chariow
-- membership still grants its own entitlement_snapshot exactly as before
-- (bff/src/billing-store.js), untouched by this table. This table holds
-- ONLY entitlements an owner granted by hand (gift access, support goodwill,
-- partner access) — independent of any payment event, never written to by
-- the Chariow webhook, and merged with the membership-derived entitlements
-- only at read time (bff/src/app.js currentEntitlements). As with billing
-- and BRVM publications, the browser never gets direct table access — only
-- the BFF's service role reads/writes this table.
create table if not exists public.dda_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entitlement_key text not null check (char_length(entitlement_key) between 1 and 80),
  status text not null default 'active' check (status in ('active', 'suspended')),
  granted_by uuid not null references auth.users(id),
  reason text not null check (char_length(btrim(reason)) between 1 and 500),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, entitlement_key)
);
create index if not exists dda_entitlements_user_idx on public.dda_entitlements(user_id) where status = 'active';

alter table public.dda_entitlements enable row level security;
revoke all on table public.dda_entitlements from anon, authenticated;
drop policy if exists dda_entitlements_no_browser_access on public.dda_entitlements;
create policy dda_entitlements_no_browser_access on public.dda_entitlements for all to anon, authenticated using (false) with check (false);
