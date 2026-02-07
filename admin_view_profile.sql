-- ==============================================================================
-- ADMIN PROFILE VIEW & ACTIVATE: RUN THIS IN SUPABASE SQL EDITOR
-- ==============================================================================

-- 1. Ensure Admins can VIEW ALL PROFILES
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
  OR auth.uid() = id -- Users see themselves
);

-- 2. Ensure Admins can VIEW ALL AGENT DOCUMENTS
DROP POLICY IF EXISTS "Admins can view agent docs" ON public.agent_documents;
CREATE POLICY "Admins can view agent docs" 
ON public.agent_documents FOR SELECT 
TO authenticated 
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
  OR auth.uid() = user_id -- Agents see their own
);

-- 3. Ensure Admins can MANAGE USER ROLES (Approve/Reject/Activate)
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles" 
ON public.user_roles FOR ALL 
TO authenticated 
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- 4. Add 'is_active' column to Profiles if it doesn't exist (for general activation)
-- If we want to deactivate ANY user, we should have a flag.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- 5. Allow Admins to UPDATE profiles (to set is_active)
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
CREATE POLICY "Admins can update profiles" 
ON public.profiles FOR UPDATE
TO authenticated 
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
  OR auth.uid() = id
);
