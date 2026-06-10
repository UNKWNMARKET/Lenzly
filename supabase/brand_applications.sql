-- Brand applications table (pending review by admin before Supabase auth account is created)
create table if not exists brand_applications (
  id uuid primary key default gen_random_uuid(),
  company text not null,
  email text not null unique,
  website text,
  needs text[] default '{}',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  brand_user_id uuid references auth.users(id) on delete set null,
  temp_password text,
  reviewed_at timestamptz,
  created_at timestamptz default now()
);

-- Only the admin (service role) and the applicant themselves can read rows
alter table brand_applications enable row level security;

-- Admin can do everything (use service role in functions)
-- Public can insert (submit application)
create policy "Anyone can apply"
  on brand_applications for insert
  with check (true);

-- Only authenticated admin email can read/update
create policy "Admin can read all"
  on brand_applications for select
  using (auth.jwt() ->> 'email' = 'eisdorferjesse@gmail.com');

create policy "Admin can update"
  on brand_applications for update
  using (auth.jwt() ->> 'email' = 'eisdorferjesse@gmail.com');

create policy "Admin can delete"
  on brand_applications for delete
  using (auth.jwt() ->> 'email' = 'eisdorferjesse@gmail.com');
