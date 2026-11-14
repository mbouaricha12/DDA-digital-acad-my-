-- DDA Lot 7 migration 0010: Communauté — fil de posts (MVP).
-- Real posts, written by real authenticated learners through the BFF; the
-- browser never gets direct table access (same architecture as billing and
-- BRVM publications: only the BFF's service role reads/writes this table,
-- RLS denies anon/authenticated outright). No simulated post, no fabricated
-- participant or reply count is ever derived from this table.

create table if not exists public.dda_community_posts (
  post_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  author_display_name text not null check (char_length(btrim(author_display_name)) between 1 and 80),
  body text not null check (char_length(btrim(body)) between 1 and 1000),
  status text not null default 'visible' check (status in ('visible', 'removed')),
  removed_reason text check (removed_reason is null or char_length(removed_reason) <= 300),
  created_at timestamptz not null default now()
);
create index if not exists dda_community_posts_feed_idx on public.dda_community_posts(status, created_at desc);
create index if not exists dda_community_posts_user_idx on public.dda_community_posts(user_id, created_at desc);

alter table public.dda_community_posts enable row level security;
revoke all on table public.dda_community_posts from anon, authenticated;
drop policy if exists dda_community_posts_no_browser_access on public.dda_community_posts;
create policy dda_community_posts_no_browser_access on public.dda_community_posts for all to anon, authenticated using (false) with check (false);
