-- ==============================================================================
-- FIX INFINITE RECURSION ERROR & MISSING TABLES
-- RUN THIS IN SUPABASE SQL EDITOR
-- ==============================================================================

-- 1. FIX user_roles RECURSION
-- The error happened because the policy to check permissions tried to query the table itself recursively.
-- We fix this by allowing all authenticated users to READ roles (breaking the loop), but only Admins to WRITE.

DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Roles are viewable by everyone" ON public.user_roles;

-- Allow reading roles (Necessary for the Admin check to work without recursion)
CREATE POLICY "Roles are viewable by everyone" 
ON public.user_roles FOR SELECT 
TO authenticated 
USING (true);

-- Allow Admins to INSERT/UPDATE/DELETE
CREATE POLICY "Admins can insert roles" 
ON public.user_roles FOR INSERT 
TO authenticated 
WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
);

CREATE POLICY "Admins can update roles" 
ON public.user_roles FOR UPDATE
TO authenticated 
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
);

CREATE POLICY "Admins can delete roles" 
ON public.user_roles FOR DELETE
TO authenticated 
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- 2. ENSURE agent_documents EXISTS (If previous script failed)
create table if not exists public.agent_documents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  document_type text not null,
  document_url text not null,
  status text default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.agent_documents enable row level security;

-- 3. FIX Agent Docs Policies (Using the now-safe permissions)
drop policy if exists "Admins can view agent docs" on public.agent_documents;
drop policy if exists "Agents can view own docs" on public.agent_documents;
drop policy if exists "Agents can upload own docs" on public.agent_documents;

create policy "Admins and Owners view docs" 
on public.agent_documents for select 
to authenticated 
using (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
);

create policy "Agents can upload own docs" 
on public.agent_documents for insert 
with check (auth.uid() = user_id);

-- 4. FIX Profiles Permissions (Ensure no recursion here too)
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins and Users view profiles" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (
  true -- Profiles are generally public in this app context, or we can restrict. 'true' avoids recursion issues completely for viewing.
);

DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
CREATE POLICY "Admins and Users update own profile" 
ON public.profiles FOR UPDATE
TO authenticated 
USING (
  auth.uid() = id OR
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
);
