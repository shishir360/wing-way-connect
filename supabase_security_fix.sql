-- ==============================================================================
-- fix_user_visibility.sql
-- Run this script in the Supabase SQL Editor to fix User List visibility
-- ==============================================================================

-- 1. Allow Authenticated Users to View All Profiles
-- This ensures that the "Users" list in the dashboard can populate data.
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view all profiles" ON public.profiles
FOR SELECT USING (auth.role() = 'authenticated');


-- 2. Allow Authenticated Users to View User Roles
-- This ensures that we can see who is an agent/admin in the list.
DROP POLICY IF EXISTS "Users can view user roles" ON public.user_roles;

CREATE POLICY "Users can view user roles" ON public.user_roles
FOR SELECT USING (auth.role() = 'authenticated');


-- 3. (Optional) Ensure Admins have full access always
-- This is a fallback to ensure admins are never blocked.
DROP POLICY IF EXISTS "Admins have full control on profiles" ON public.profiles;

CREATE POLICY "Admins have full control on profiles" ON public.profiles
USING (public.has_role(auth.uid(), 'admin'::app_role));

