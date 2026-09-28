-- Remote RLS audit. Run with psql against the target Supabase database.
-- The audit intentionally covers every ordinary table in public.

begin;

DO $$
DECLARE
  missing_rls text;
  missing_policy text;
BEGIN
  SELECT string_agg(format('%I.%I', n.nspname, c.relname), ', ' ORDER BY c.relname)
    INTO missing_rls
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind = 'r'
    AND NOT c.relrowsecurity;

  IF missing_rls IS NOT NULL THEN
    RAISE EXCEPTION 'RLS audit failed; tables without RLS: %', missing_rls;
  END IF;

  SELECT string_agg(format('%I.%I', n.nspname, c.relname), ', ' ORDER BY c.relname)
    INTO missing_policy
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind = 'r'
    AND NOT EXISTS (
      SELECT 1 FROM pg_policies p
      WHERE p.schemaname = n.nspname AND p.tablename = c.relname
    );

  IF missing_policy IS NOT NULL THEN
    RAISE EXCEPTION 'RLS audit failed; tables without policies: %', missing_policy;
  END IF;
END $$;

-- No anonymous role may receive direct table privileges.
DO $$
DECLARE
  broad_anon text;
BEGIN
  SELECT string_agg(format('%I.%I:%s', table_schema, table_name, privilege_type), ', ' ORDER BY table_name)
    INTO broad_anon
  FROM information_schema.role_table_grants
  WHERE table_schema = 'public'
    AND grantee = 'anon'
    AND privilege_type IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER');

  IF broad_anon IS NOT NULL THEN
    RAISE EXCEPTION 'RLS audit failed; anon grants found: %', broad_anon;
  END IF;
END $$;

commit;

select 'REMOTE_RLS_AUDIT_PASS' as result limit 1;
