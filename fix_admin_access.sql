-- ==============================================================================
-- fix_admin_access.sql
-- COMPLETE FIX FOR ADMIN ACCESS & USER LIST
-- ==============================================================================

-- 1. Ensure Profiles Table Exists
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  full_name text,
  email text,
  phone text,
  role text default 'user',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Ensure User Roles Table Exists
create table if not exists public.user_roles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  role text not null check (role in ('admin', 'agent', 'user')),
  is_approved boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, role)
);


-- 3. Fix RLS Policies (Allow Admins & Authenticated Users to View)
-- Enable RLS
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;

-- Allow ANY logged-in user to VIEW profiles (needed for Admin list to fetch)
drop policy if exists "Enable read access for authenticated users" on public.profiles;
create policy "Enable read access for authenticated users" on public.profiles
  for select using (auth.role() = 'authenticated');

-- Allow Users to Update their OWN profile
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Allow ANY logged-in user to VIEW roles
drop policy if exists "Enable read access for authenticated users" on public.user_roles;
create policy "Enable read access for authenticated users" on public.user_roles
  for select using (auth.role() = 'authenticated');


-- 4. Create/Fix Trigger for New User Signup
-- This ensures that when a user signs up via Auth, they are automatically added to 'profiles'
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, phone, role)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    new.raw_user_meta_data->>'phone', -- Ensures phone number is captured
    coalesce(new.raw_user_meta_data->>'role', 'user')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger definition
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 5. Backfill Missing Profiles (Optional but Retry Safe)
-- Tries to insert profiles for existing users if they are missing
insert into public.profiles (id, email, full_name)
select id, email, raw_user_meta_data->>'full_name'
from auth.users
where id not in (select id from public.profiles)
on conflict do nothing;
