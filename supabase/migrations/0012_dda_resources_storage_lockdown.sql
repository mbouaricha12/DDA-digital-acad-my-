-- DDA migration 0012: lock the 'dda-resources' Storage bucket away from the browser.
-- A RESTRICTIVE policy is ANDed with every permissive policy on storage.objects,
-- so no present or future permissive policy can ever expose this bucket to the
-- anon/authenticated roles. Only the BFF's service role (which bypasses RLS)
-- may read or write objects in 'dda-resources' (e.g. via signed URLs it issues).
-- Objects in every other bucket are unaffected by this policy.
--
-- Guarded on storage.objects existing so scripts/replay_p3_migrations.sh still
-- replays cleanly against a plain local PostgreSQL without the Supabase storage schema.
do $$
begin
  if to_regclass('storage.objects') is not null then
    execute 'drop policy if exists dda_resources_bucket_no_browser_access on storage.objects';
    execute $policy$
      create policy dda_resources_bucket_no_browser_access
      on storage.objects
      as restrictive
      for all
      to anon, authenticated
      using (bucket_id <> 'dda-resources')
      with check (bucket_id <> 'dda-resources')
    $policy$;
  end if;
end
$$;
