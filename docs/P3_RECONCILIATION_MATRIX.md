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
| `dda_admin_roles` | `public.dda_admin_roles` | No browser grant at all (not even owner-read); service-role only | None | Admin API not implemented | Owner/admin role, server-only, founder bootstrap is manual and out of band |

## Migration sequence

1. `0001_identity_sessions.sql` — extension, profile/session tables, canonical timestamp trigger, restricted profile grants.
2. `0002_business_entities.sql` — memberships, onboarding, progress, terminal, journal, premium, preferences and audit tables.
3. `0003_rls_and_privileges.sql` — RLS enablement, owner-read policies and browser privilege revocation.
4. `0004_chariow_billing.sql` — Chariow billing deliveries/memberships tables and their RLS.
5. `0005_brvm_publications.sql` — BRVM source/document/publication tables and their RLS.
6. `0006_select_own_grants.sql` — explicit `grant select` statements matching every owner-read policy (a policy without its GRANT is inert in Postgres).
7. `0007_admin_roles.sql` — `dda_admin_roles` (`owner`/`admin` only), RLS enabled, zero grant to `anon`/`authenticated`, founder `owner` row inserted manually once a real Supabase project exists.

The replay procedure is [`scripts/replay_p3_migrations.sh`](../scripts/replay_p3_migrations.sh). It requires an explicitly supplied isolated PostgreSQL `DATABASE_URL`, refuses Supabase-hosted URLs, and is never run automatically by CI.

## Current evidence boundary

The migrations are source-controlled and statically reviewed by `tests/test_p3_migration_inventory.js`. Beyond that static review, all 7 migrations (`0001`-`0007`) were replayed in order against a disposable local PostgreSQL 16 database in this sandbox, with `auth.users`/`auth.uid()` and the `anon`/`authenticated`/`service_role` roles stubbed to the minimum Supabase provides. All 7 applied with no error, and the `dda_admin_roles` boundary was exercised directly: `SET ROLE authenticated; select/insert` both fail with `permission denied`, and inserting `role = 'editor'` is rejected by the check constraint. That database was dropped immediately after.

This is real proof that the SQL is syntactically correct and that the declared access boundary holds under plain PostgreSQL — it is **not** proof against a real Supabase project (no PostgREST, no real multi-user `auth.uid()` session, no Supabase-specific extensions or defaults were exercised). A second review must still run the replay procedure against an isolated Supabase/PostgreSQL test environment with two real authenticated users before any production migration is considered.
