-- ==============================================================================
-- SETUP NEW PROJECT: RUN THIS IN SUPABASE SQL EDITOR
-- ==============================================================================

-- 1. Create PROFILES Table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  full_name text,
  email text,
  phone text,
  city text,
  country text,
  avatar_url text,
  address text,
  role text default 'user',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create USER_ROLES Table (For Admin/Agent permissions)
create table if not exists public.user_roles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  role text not null check (role in ('admin', 'agent', 'user', 'super_admin')),
  is_approved boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, role)
);

-- 3. Create SHIPMENTS Table
create table if not exists public.shipments (
  id uuid default gen_random_uuid() primary key,
  tracking_id text unique not null,
  user_id uuid references auth.users(id),
  sender_name text,
  sender_phone text,
  sender_address text,
  recipient_name text,
  recipient_phone text,
  recipient_address text,
  status text default 'pending', -- pending, pickup_scheduled, picked_up, in_transit, customs, out_for_delivery, delivered, cancelled
  current_location text,
  weight decimal,
  dimensions text,
  price decimal,
  estimated_delivery timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Create FLIGHT_BOOKINGS Table
create table if not exists public.flight_bookings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id),
  booking_reference text unique,
  airline text,
  flight_number text,
  departure_city text,
  arrival_city text,
  departure_date timestamp with time zone,
  return_date timestamp with time zone,
  passengers integer default 1,
  class text default 'economy',
  status text default 'confirmed',
  total_price decimal,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.shipments enable row level security;
alter table public.flight_bookings enable row level security;

-- 6. Create Policies (Permissive for easy setup)

-- Profiles: Authenticated users can view all (needed for Agent/Admin lists)
create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can insert their own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- User Roles: Authenticated users can view all roles
create policy "Roles are viewable by everyone" on public.user_roles for select using (true);
create policy "Admins can manage roles" on public.user_roles for all using (true); -- Simplified for setup

-- Shipments: Users see their own, Admins/Agents see all
create policy "Users view own shipments" on public.shipments for select using (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'agent'))
);
create policy "Users can create shipments" on public.shipments for insert with check (auth.uid() = user_id);

-- Flight Bookings: Similar to shipments
create policy "Users view own bookings" on public.flight_bookings for select using (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'agent'))
);
create policy "Users can create bookings" on public.flight_bookings for insert with check (auth.uid() = user_id);

-- 7. Create Trigger for New User Signup (Auto-create Profile)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (new.id, new.raw_user_meta_data->>'full_name', new.email, 'user');
  
  -- Auto-assign 'user' role in user_roles
  insert into public.user_roles (user_id, role, is_approved)
  values (new.id, 'user', true);
  
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 8. Add Storage Buckets (Optional, run if needed manually in Storage UI)
-- insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);
-- insert into storage.buckets (id, name, public) values ('shipment-docs', 'shipment-docs', true);
