-- ==============================================================================
-- FIX AGENT SCHEMA & ADMIN PERMISSIONS
-- RUN THIS IN SUPABASE SQL EDITOR TO FIX "relation does not exist" ERROR
-- ==============================================================================

-- 1. Create agent_documents table if it doesn't exist
create table if not exists public.agent_documents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  document_type text not null, -- e.g., 'business_license', 'nid'
  document_url text not null,
  status text default 'pending', -- pending, verified, rejected
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable RLS
alter table public.agent_documents enable row level security;

-- 3. Create Basic Policies for Agent Documents
-- Agents can upload their own docs
drop policy if exists "Agents can upload own docs" on public.agent_documents;
create policy "Agents can upload own docs" 
on public.agent_documents for insert 
with check (auth.uid() = user_id);

-- Agents can view their own docs
drop policy if exists "Agents can view own docs" on public.agent_documents;
create policy "Agents can view own docs" 

on public.agent_documents for select 
using (auth.uid() = user_id);

-- ==============================================================================
-- ADMIN PERMISSIONS (From previous failed script)
-- ==============================================================================

-- 4. Ensure Admins can VIEW ALL PROFILES
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
  OR auth.uid() = id -- Users see themselves
);

-- 5. Ensure Admins can VIEW ALL AGENT DOCUMENTS
DROP POLICY IF EXISTS "Admins can view agent docs" ON public.agent_documents;
CREATE POLICY "Admins can view agent docs" 
ON public.agent_documents FOR SELECT 
TO authenticated 
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
  OR auth.uid() = user_id -- Agents see their own
);

-- 6. Ensure Admins can MANAGE USER ROLES (Approve/Reject/Activate)
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles" 
ON public.user_roles FOR ALL 
TO authenticated 
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- 7. Add 'is_active' column to Profiles if it doesn't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- 8. Allow Admins to UPDATE profiles (to set is_active)
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
CREATE POLICY "Admins can update profiles" 
ON public.profiles FOR UPDATE
TO authenticated 
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
  OR auth.uid() = id
);
