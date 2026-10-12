# DDA Academy — P3 entity reconciliation

**Scope:** versioned SQL and local security preparation only. No Supabase connection or remote migration is authorized by this document.

| Entity | Server representation | Ownership / RLS | Client write authority | API status | Decision |
|---|---|---|---|---|---|
| `users` | Supabase Auth + `dda_profiles` | Auth user; profile policy is owner-only | `display_name` only | Identity BFF exists | Auth remains provider-owned |
| `memberships` | `public.memberships` | `user_id` FK; owner read policy; server writes | None | Entitlement API pending | Server authority only |
| `onboarding` | `public.onboarding` | `owner_id` FK; owner read policy | BFF mutation pending | Not implemented | Server-backed |
| `lesson_progress` | `public.lesson_progress` | `owner_id` FK; unique lesson; owner read policy | BFF mutation pending | Not implemented | Server-backed |
| `terminal_state` | `public.terminal_state` | One row per owner; owner read policy | BFF mutation pending | Not implemented | Server-backed learning state |
| `journal_entries` | `public.journal_entries` | `owner_id` FK; owner read policy; indexed by date | BFF mutation pending | Not implemented | Server-backed sensitive free text |
| `journal_plans` | `public.journal_plans` | One row per owner; owner read policy | BFF mutation pending | Not implemented | Server-backed sensitive free text |
| `premium_progress` | `public.premium_progress` | `owner_id` FK; server-derived fields protected by BFF | Client input fields only | Premium API pending | Server validation required |
| `preferences` | `public.preferences` | One row per owner; owner read policy | BFF mutation pending | Not implemented | Server-backed settings |
| `acquisition` | No table by design | Device-scoped pseudonymous local state | Local only | No sync by default | Remains device-only until consent/policy |
| `audit_events` | `public.audit_events` | System append-only; no browser grants | None | Audit service pending | Server-only allowlisted events |

## Migration sequence

1. `0001_identity_sessions.sql` — extension, profile/session tables, canonical timestamp trigger, restricted profile grants.
2. `0002_business_entities.sql` — memberships, onboarding, progress, terminal, journal, premium, preferences and audit tables.
3. `0003_rls_and_privileges.sql` — RLS enablement, owner-read policies and browser privilege revocation.

The replay procedure is [`scripts/replay_p3_migrations.sh`](../scripts/replay_p3_migrations.sh). It requires an explicitly supplied isolated PostgreSQL `DATABASE_URL`, refuses Supabase-hosted URLs, and is never run automatically by CI.

## Current evidence boundary

The migrations are source-controlled and statically reviewed. This branch does **not** claim live PostgreSQL/RLS proof because no local PostgreSQL binary is available in the current sandbox and no remote database access is authorized. A second review must run the replay procedure against an isolated PostgreSQL/Supabase test environment with two users before any production migration is considered.
