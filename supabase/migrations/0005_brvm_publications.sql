-- DDA P5 migration 0005: BRVM provenance and publication registry.
-- Preparation only: do not apply until source, redistribution rights, reviewers,
-- retention and operational publication procedure have been approved by a human.
-- No real BRVM source or document is seeded by this migration.

create table if not exists public.dda_brvm_sources (
  source_id uuid primary key default gen_random_uuid(),
  source_name text not null check (char_length(btrim(source_name)) between 1 and 200),
  source_url text not null check (source_url ~ '^https://[^[:space:]]+$' and char_length(source_url) <= 2048),
  source_type text not null check (source_type in ('official_institution', 'licensed_provider', 'editor_supplied')),
  owner_contact text not null check (char_length(btrim(owner_contact)) between 1 and 240),
  license_reference text not null check (char_length(btrim(license_reference)) between 1 and 500),
  redistribution_status text not null default 'pending' check (redistribution_status in ('pending', 'authorized', 'rejected')),
  coverage text not null check (char_length(btrim(coverage)) between 1 and 2000),
  refresh_policy text not null check (char_length(btrim(refresh_policy)) between 1 and 500),
  source_status text not null default 'proposed' check (source_status in ('proposed', 'rights_pending', 'review_pending', 'approved', 'rejected', 'expired')),
  rights_reviewer_id uuid,
  rights_reviewed_at timestamptz,
  source_reviewer_id uuid,
  source_reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (source_status not in ('review_pending', 'approved') or (redistribution_status = 'authorized' and rights_reviewer_id is not null and rights_reviewed_at is not null)),
  check (source_status <> 'approved' or (source_reviewer_id is not null and source_reviewed_at is not null and source_reviewer_id <> rights_reviewer_id))
);

create table if not exists public.dda_brvm_documents (
  document_id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.dda_brvm_sources(source_id) on delete restrict,
  title text not null check (char_length(btrim(title)) between 1 and 300),
  document_type text not null check (document_type in ('financial_statement', 'annual_report', 'issuer_notice', 'market_notice', 'other_official_publication')),
  source_url text not null check (source_url ~ '^https://[^[:space:]]+$' and char_length(source_url) <= 2048),
  reference_date date not null,
  retrieved_at timestamptz not null,
  checksum_sha256 text not null check (checksum_sha256 ~ '^[0-9a-f]{64}$'),
  transformer_version text not null check (char_length(btrim(transformer_version)) between 1 and 100),
  import_status text not null default 'pending' check (import_status in ('pending', 'succeeded', 'failed')),
  verification_status text not null default 'pending' check (verification_status in ('pending', 'verified', 'rejected')),
  freshness_status text not null default 'pending' check (freshness_status in ('pending', 'current', 'stale')),
  redistribution_rights text not null default 'pending' check (redistribution_rights in ('pending', 'authorized', 'rejected')),
  document_status text not null default 'draft' check (document_status in ('draft', 'review_pending', 'approved', 'imported', 'published', 'rejected', 'expired')),
  rights_reviewer_id uuid,
  editorial_reviewer_id uuid,
  published_by uuid,
  approved_at timestamptz,
  published_at timestamptz,
  fresh_until timestamptz,
  error_code text check (error_code is null or char_length(error_code) <= 80),
  error_detail text check (error_detail is null or char_length(error_detail) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_id, checksum_sha256),
  check (retrieved_at >= (reference_date::timestamp at time zone 'UTC')),
  check (document_status not in ('approved', 'imported', 'published') or (
    redistribution_rights = 'authorized' and rights_reviewer_id is not null and
    editorial_reviewer_id is not null and rights_reviewer_id <> editorial_reviewer_id and approved_at is not null
  )),
  check (document_status not in ('imported', 'published') or (
    import_status = 'succeeded' and verification_status = 'verified' and
    freshness_status = 'current' and fresh_until is not null and fresh_until > retrieved_at
  )),
  check (document_status <> 'published' or (
    published_by is not null and published_at is not null and published_at >= retrieved_at and
    published_by <> rights_reviewer_id and published_by <> editorial_reviewer_id
  ))
);
create index if not exists dda_brvm_documents_publication_idx on public.dda_brvm_documents(document_status, fresh_until desc);
create index if not exists dda_brvm_documents_source_idx on public.dda_brvm_documents(source_id, reference_date desc);

create table if not exists public.dda_brvm_audit_events (
  event_id bigint generated always as identity primary key,
  entity_type text not null check (entity_type in ('source', 'document')),
  entity_id uuid not null,
  operation text not null check (operation in ('insert', 'update', 'delete')),
  actor_id uuid not null,
  actor_role text not null check (char_length(actor_role) between 1 and 80),
  old_status text,
  new_status text,
  occurred_at timestamptz not null default now()
);

create or replace function public.dda_brvm_audit_transition()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  prior_status text;
  next_status text;
  row_id uuid;
  raw_actor text;
begin
  if tg_table_name = 'dda_brvm_sources' then
    if tg_op <> 'INSERT' and old.source_id <> new.source_id then
      raise exception 'BRVM source identity is immutable';
    end if;
    if tg_op = 'INSERT' then
      if new.source_status <> 'proposed' then raise exception 'BRVM source must begin in proposed'; end if;
      next_status := new.source_status;
      row_id := new.source_id;
    elsif tg_op = 'UPDATE' then
      prior_status := old.source_status;
      next_status := new.source_status;
      row_id := new.source_id;
      if old.source_status = 'approved' and (
        old.source_name is distinct from new.source_name or old.source_url is distinct from new.source_url or
        old.source_type is distinct from new.source_type or old.owner_contact is distinct from new.owner_contact or
        old.license_reference is distinct from new.license_reference or old.redistribution_status is distinct from new.redistribution_status or
        old.coverage is distinct from new.coverage or old.refresh_policy is distinct from new.refresh_policy
      ) and next_status not in ('rights_pending', 'rejected', 'expired') then
        raise exception 'Approved BRVM source changes require rights re-review';
      end if;
      if next_status <> prior_status and not (
        (prior_status = 'proposed' and next_status in ('rights_pending', 'rejected')) or
        (prior_status = 'rights_pending' and next_status in ('review_pending', 'rejected')) or
        (prior_status = 'review_pending' and next_status in ('approved', 'rejected')) or
        (prior_status = 'approved' and next_status in ('rights_pending', 'expired', 'rejected'))
      ) then raise exception 'Invalid BRVM source status transition'; end if;
    else
      prior_status := old.source_status;
      row_id := old.source_id;
    end if;
  else
    if tg_op <> 'INSERT' and (old.document_id <> new.document_id or old.source_id <> new.source_id) then
      raise exception 'BRVM document and source identities are immutable';
    end if;
    if tg_op <> 'DELETE' and new.document_status in ('approved', 'imported', 'published') and not exists (
      select 1 from public.dda_brvm_sources s
      where s.source_id = new.source_id and s.source_status = 'approved' and s.redistribution_status = 'authorized'
    ) then
      raise exception 'BRVM document requires an approved source with authorized redistribution';
    end if;
    if tg_op = 'INSERT' then
      if new.document_status <> 'draft' then raise exception 'BRVM document must begin in draft'; end if;
      next_status := new.document_status;
      row_id := new.document_id;
    elsif tg_op = 'UPDATE' then
      prior_status := old.document_status;
      next_status := new.document_status;
      row_id := new.document_id;
      if old.document_status in ('approved', 'imported', 'published') and (
        old.title is distinct from new.title or old.document_type is distinct from new.document_type or
        old.source_url is distinct from new.source_url or old.reference_date is distinct from new.reference_date or
        old.retrieved_at is distinct from new.retrieved_at or old.checksum_sha256 is distinct from new.checksum_sha256 or
        old.transformer_version is distinct from new.transformer_version
      ) then raise exception 'Approved BRVM document manifest is immutable'; end if;
      if next_status <> prior_status and not (
        (prior_status = 'draft' and next_status in ('review_pending', 'rejected')) or
        (prior_status = 'review_pending' and next_status in ('approved', 'rejected')) or
        (prior_status = 'approved' and next_status in ('imported', 'rejected')) or
        (prior_status = 'imported' and next_status in ('published', 'rejected', 'expired')) or
        (prior_status = 'published' and next_status = 'expired')
      ) then raise exception 'Invalid BRVM document status transition'; end if;
    else
      prior_status := old.document_status;
      row_id := old.document_id;
    end if;
  end if;

  raw_actor := nullif(current_setting('request.jwt.claim.sub', true), '');
  if raw_actor is null or raw_actor !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    raise exception 'BRVM mutation requires an attributable actor';
  end if;
  if nullif(current_setting('request.jwt.claim.role', true), '') is null then
    raise exception 'BRVM mutation requires an attributable database role';
  end if;
  insert into public.dda_brvm_audit_events(entity_type, entity_id, operation, actor_id, actor_role, old_status, new_status)
  values (
    case when tg_table_name = 'dda_brvm_sources' then 'source' else 'document' end,
    row_id,
    lower(tg_op),
    raw_actor::uuid,
    left(current_setting('request.jwt.claim.role', true), 80),
    prior_status,
    next_status
  );
  if tg_op = 'DELETE' then return old; end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger dda_brvm_sources_audit_transition
before insert or update or delete on public.dda_brvm_sources
for each row execute function public.dda_brvm_audit_transition();
create trigger dda_brvm_documents_audit_transition
before insert or update or delete on public.dda_brvm_documents
for each row execute function public.dda_brvm_audit_transition();

alter table public.dda_brvm_sources enable row level security;
alter table public.dda_brvm_documents enable row level security;
alter table public.dda_brvm_audit_events enable row level security;
drop policy if exists dda_brvm_sources_no_browser_access on public.dda_brvm_sources;
create policy dda_brvm_sources_no_browser_access on public.dda_brvm_sources for all to anon, authenticated using (false) with check (false);
drop policy if exists dda_brvm_documents_no_browser_access on public.dda_brvm_documents;
create policy dda_brvm_documents_no_browser_access on public.dda_brvm_documents for all to anon, authenticated using (false) with check (false);
drop policy if exists dda_brvm_audit_events_no_browser_access on public.dda_brvm_audit_events;
create policy dda_brvm_audit_events_no_browser_access on public.dda_brvm_audit_events for all to anon, authenticated using (false) with check (false);
revoke all on table public.dda_brvm_sources from public;
revoke all on table public.dda_brvm_sources from anon;
revoke all on table public.dda_brvm_sources from authenticated;
revoke all on table public.dda_brvm_sources from service_role;
revoke all on table public.dda_brvm_documents from public;
revoke all on table public.dda_brvm_documents from anon;
revoke all on table public.dda_brvm_documents from authenticated;
revoke all on table public.dda_brvm_documents from service_role;
revoke all on table public.dda_brvm_audit_events from public;
revoke all on table public.dda_brvm_audit_events from anon;
revoke all on table public.dda_brvm_audit_events from authenticated;
revoke all on table public.dda_brvm_audit_events from service_role;
revoke execute on function public.dda_brvm_audit_transition() from public, anon, authenticated, service_role;

-- Public projection contains only approved display metadata. The BFF reads this
-- view with its service role; no browser role receives access to the base tables
-- or the view directly.
create or replace view public.dda_brvm_publications as
select
  d.document_id as id,
  d.title,
  s.source_name as source,
  s.source_url,
  d.source_url as document_url,
  d.reference_date,
  d.retrieved_at,
  d.fresh_until
from public.dda_brvm_documents d
join public.dda_brvm_sources s on s.source_id = d.source_id
where d.document_status = 'published'
  and d.import_status = 'succeeded'
  and d.verification_status = 'verified'
  and d.freshness_status = 'current'
  and d.redistribution_rights = 'authorized'
  and d.fresh_until > now()
  and d.retrieved_at >= (d.reference_date::timestamp at time zone 'UTC')
  and s.source_status = 'approved'
  and s.redistribution_status = 'authorized';
revoke all on public.dda_brvm_publications from public, anon, authenticated;
grant select on public.dda_brvm_publications to service_role;
