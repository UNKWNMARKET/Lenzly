create table if not exists business_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade unique,
  email text,
  company text,
  description text,
  location text,
  team_size text,
  website text,
  photography_needs text[] default '{}',
  budget text,
  onboarding_complete boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table business_profiles enable row level security;

-- Brand can read/update their own profile
create policy "Brand can manage own profile"
  on business_profiles for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Admin can read all
create policy "Admin can read all profiles"
  on business_profiles for select
  using (auth.jwt() ->> 'email' = 'eisdorferjesse@gmail.com');
