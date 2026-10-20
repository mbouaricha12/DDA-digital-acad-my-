-- DDA migration 0006: BRVM freshness revalidation observations.
-- Preparation only: apply only after the worker identity, retention policy,
-- and the Supabase target environment have been reviewed by a human.
-- This table records technical checks; it does not approve rights or publish documents.

create table if not exists public.dda_brvm_revalidation_checks (
  check_id bigint generated always as identity primary key,
  document_id uuid not null
    references public.dda_brvm_documents(document_id)
    on delete restrict,
  job_run_id uuid not null,
  checked_at timestamptz not null default now(),
  outcome text not null
    check (outcome in ('current', 'stale', 'error', 'skipped')),
  http_status integer
    check (http_status is null or http_status between 100 and 599),
  final_url text
    check (final_url is null or (
      final_url ~ '^https://[^[:space:]]+$'
      and char_length(final_url) <= 2048
    )),
  observed_content_type text
    check (observed_content_type is null or char_length(btrim(observed_content_type)) between 1 and 160),
  observed_size_bytes bigint
    check (observed_size_bytes is null or observed_size_bytes >= 0),
  observed_checksum_sha256 text
    check (observed_checksum_sha256 is null or observed_checksum_sha256 ~ '^[0-9a-f]{64}$'),
  error_code text
    check (error_code is null or (
      error_code ~ '^[A-Z][A-Z0-9_]{1,79}$'
    )),
  error_detail text
    check (error_detail is null or char_length(error_detail) <= 1000),
  latency_ms integer
    check (latency_ms is null or latency_ms >= 0),
  actor_role text not null
    check (char_length(btrim(actor_role)) between 1 and 80),
  created_at timestamptz not null default now(),
  check (created_at >= checked_at),
  check (outcome = 'current' or error_code is not null or outcome = 'skipped'),
  check (outcome <> 'current' or (
    http_status is not null
    and http_status between 200 and 399
    and final_url is not null
    and error_code is null
    and error_detail is null
  ))
);

comment on table public.dda_brvm_revalidation_checks is
  'Private technical observations from BRVM freshness checks; not a rights or publication approval table.';
comment on column public.dda_brvm_revalidation_checks.job_run_id is
  'Correlates all document checks performed by one scheduler execution.';
comment on column public.dda_brvm_revalidation_checks.actor_role is
  'Server-side worker role that recorded the observation; never supplied by the browser.';

create index if not exists dda_brvm_revalidation_document_idx
  on public.dda_brvm_revalidation_checks(document_id, checked_at desc);

create index if not exists dda_brvm_revalidation_outcome_idx
  on public.dda_brvm_revalidation_checks(outcome, checked_at desc);

create index if not exists dda_brvm_revalidation_job_run_idx
  on public.dda_brvm_revalidation_checks(job_run_id, checked_at desc);

alter table public.dda_brvm_revalidation_checks enable row level security;

-- Browser roles never read or write technical revalidation observations.
drop policy if exists dda_brvm_revalidation_checks_no_browser_access
  on public.dda_brvm_revalidation_checks;
create policy dda_brvm_revalidation_checks_no_browser_access
  on public.dda_brvm_revalidation_checks
  for all to anon, authenticated
  using (false)
  with check (false);

revoke all on table public.dda_brvm_revalidation_checks from public;
revoke all on table public.dda_brvm_revalidation_checks from anon;
revoke all on table public.dda_brvm_revalidation_checks from authenticated;
revoke all on table public.dda_brvm_revalidation_checks from service_role;

-- Intentionally no service_role grant is included here. The worker identity,
-- write path, claim/lock strategy and retention policy must be approved before
-- granting INSERT/SELECT to a dedicated server role or exposing a controlled RPC.
