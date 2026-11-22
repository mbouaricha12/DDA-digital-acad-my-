-- DDA — defense-in-depth RLS for the private resource-file bucket
-- (final pre-launch audit follow-up, 2026-11). The 'dda-resources' bucket
-- is created programmatically by bff/src/resources-storage.js
-- (SupabaseStorageAdapter.ensureBucket) as public:false, and the BFF's
-- service role is the only caller that ever touches it (bypasses RLS
-- entirely). This explicit deny policy is a second, independent layer:
-- even if the bucket were ever misconfigured as public, or exposed via a
-- future anon/authenticated client in the browser, no such client could
-- read, write or list objects in it. Harmless to run before the bucket
-- exists -- the policy simply matches zero rows until then.
-- A RESTRICTIVE policy combines with AND against every permissive policy
-- on this table, so this blocks anon/authenticated for this one bucket
-- regardless of what any other (current or future) permissive policy on
-- storage.objects grants for other buckets -- a true deny, not merely
-- "no explicit grant".
drop policy if exists dda_resources_bucket_no_browser_access on storage.objects;
create policy dda_resources_bucket_no_browser_access on storage.objects
  as restrictive
  for all to anon, authenticated
  using (bucket_id <> 'dda-resources')
  with check (bucket_id <> 'dda-resources');
