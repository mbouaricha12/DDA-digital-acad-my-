-- DDA P4 migration 0004: Chariow Pulse idempotency and server-owned memberships.
-- Apply only after reviewing the provider configuration and legal requirements.
create table if not exists public.dda_billing_deliveries (
  delivery_id text primary key check (char_length(delivery_id) between 1 and 160),
  provider text not null default 'chariow' check (provider = 'chariow'),
  event_name text check (event_name is null or char_length(event_name) <= 80),
  payload_sha256 text check (payload_sha256 is null or payload_sha256 ~ '^[0-9a-f]{64}$'),
  processed_status text not null default 'accepted' check (processed_status in ('accepted', 'processed', 'failed')),
  received_at timestamptz not null default now(),
  processed_at timestamptz
);
create table if not exists public.dda_billing_memberships (
  membership_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'chariow' check (provider = 'chariow'),
  provider_customer_id text,
  product_id text not null,
  sale_id text,
  license_id text,
  external_id text not null,
  status text not null check (status in ('pending', 'active', 'expired', 'revoked')),
  entitlement_snapshot jsonb not null default '[]'::jsonb check (jsonb_typeof(entitlement_snapshot) = 'array'),
  source_event text not null,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, external_id)
);
create index if not exists dda_billing_memberships_user_idx on public.dda_billing_memberships(user_id, status);
create index if not exists dda_billing_memberships_active_idx on public.dda_billing_memberships(user_id) where status = 'active';
alter table public.dda_billing_deliveries enable row level security;
alter table public.dda_billing_memberships enable row level security;
revoke all on table public.dda_billing_deliveries from anon, authenticated;
revoke all on table public.dda_billing_memberships from anon, authenticated;
drop policy if exists dda_billing_deliveries_no_browser_access on public.dda_billing_deliveries;
create policy dda_billing_deliveries_no_browser_access on public.dda_billing_deliveries for all to authenticated using (false) with check (false);
drop policy if exists dda_billing_memberships_select_own on public.dda_billing_memberships;
create policy dda_billing_memberships_select_own on public.dda_billing_memberships for select to authenticated using (user_id = (select auth.uid()));
