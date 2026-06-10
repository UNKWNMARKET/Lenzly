-- ============================================================================
-- LENZLY — Photography jobs board
-- Lets brand/business accounts post photography jobs they're hiring for.
-- Photographers (any signed-in user) can view open jobs. Safe to re-run.
-- ============================================================================

create table if not exists public.photography_jobs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  title        text not null,
  description  text,
  project_type text,
  location     text,
  is_remote    boolean default false,
  budget       text,
  shoot_date   date,
  status       text not null default 'open',   -- 'open' | 'closed'
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists photography_jobs_user_idx    on public.photography_jobs (user_id, created_at desc);
create index if not exists photography_jobs_status_idx  on public.photography_jobs (status, created_at desc);

alter table public.photography_jobs enable row level security;

-- Any signed-in user (photographers included) can read open jobs.
-- Owners can always read their own jobs regardless of status.
drop policy if exists photography_jobs_select on public.photography_jobs;
create policy photography_jobs_select
  on public.photography_jobs for select
  to authenticated
  using (status = 'open' or auth.uid() = user_id);

-- Owners manage their own job posts.
drop policy if exists photography_jobs_insert on public.photography_jobs;
create policy photography_jobs_insert
  on public.photography_jobs for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists photography_jobs_update on public.photography_jobs;
create policy photography_jobs_update
  on public.photography_jobs for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists photography_jobs_delete on public.photography_jobs;
create policy photography_jobs_delete
  on public.photography_jobs for delete
  to authenticated
  using (auth.uid() = user_id);
