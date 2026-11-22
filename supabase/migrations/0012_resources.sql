-- DDA — member/Premium resource library catalogue (final pre-launch audit
-- follow-up, 2026-11; file_name/mime_type made nullable in the
-- "administration autonome" follow-up the same day). Metadata only — the
-- actual file bytes are never stored here, they live in the private
-- 'dda-resources' Supabase Storage bucket (bff/src/resources-storage.js)
-- and are only ever streamed by the BFF's authenticated
-- GET /v1/resources/:id/download route (bff/src/app.js), after the same
-- hasActivePremium() check every other Premium route already uses.
-- file_name/mime_type start null: a resource is created here before any
-- file is uploaded, then POST /v1/admin/resources/:id/file fills them in
-- once the Owner actually attaches a file from the admin UI. As with
-- billing, entitlements and BRVM publications, the browser never gets
-- direct table access — only the BFF's service role reads/writes this
-- table, via bff/src/premium-resources-store.js's PostgrestResourcesStore.
create table if not exists public.dda_resources (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 200),
  description text not null default '' check (char_length(description) <= 2000),
  category text not null check (char_length(btrim(category)) between 1 and 80),
  level text not null default '',
  tags text[] not null default '{}',
  membership_required text not null check (membership_required in ('free', 'premium')),
  type text not null default 'pdf',
  file_name text check (file_name is null or char_length(btrim(file_name)) between 1 and 200),
  mime_type text,
  cover_image_url text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists dda_resources_published_idx on public.dda_resources(display_order) where status = 'published';

alter table public.dda_resources enable row level security;
revoke all on table public.dda_resources from anon, authenticated;
drop policy if exists dda_resources_no_browser_access on public.dda_resources;
create policy dda_resources_no_browser_access on public.dda_resources for all to anon, authenticated using (false) with check (false);
