-- ============================================================================
-- LENZLY — Content & user reporting (App Store UGC requirement)
-- Run this whole file in Supabase → SQL Editor → New query → Run
-- Safe to run more than once.
--
-- Stores reports of posts and users so moderators can review them. A signed-in
-- user can file a report (insert only); they cannot read other people's
-- reports. Admin review happens through the service role / admin dashboard.
-- ----------------------------------------------------------------------------

create table if not exists public.reports (
  id           uuid primary key default gen_random_uuid(),
  reporter_id  uuid not null references auth.users(id) on delete cascade,
  target_type  text not null check (target_type in ('post', 'user', 'comment', 'story')),
  target_id    uuid not null,
  reason       text not null,
  details      text,
  status       text not null default 'open' check (status in ('open', 'reviewing', 'resolved', 'dismissed')),
  created_at   timestamptz not null default now()
);

create index if not exists reports_status_idx on public.reports(status, created_at desc);
create index if not exists reports_target_idx on public.reports(target_type, target_id);

alter table public.reports enable row level security;

drop policy if exists "reports_owner_insert"  on public.reports;
drop policy if exists "reports_owner_read"     on public.reports;

-- A signed-in user can file a report as themselves
create policy "reports_owner_insert"
on public.reports for insert to authenticated
with check ( auth.uid() = reporter_id );

-- A user can see only the reports they filed (status updates). Moderators use
-- the service role, which bypasses RLS.
create policy "reports_owner_read"
on public.reports for select to authenticated
using ( auth.uid() = reporter_id );
