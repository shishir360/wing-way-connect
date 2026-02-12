-- Migration: fix_recursion_securely
-- Date: 2026-02-12
-- Description: Fixes infinite recursion in RLS policies by using SECURITY DEFINER functions for role checks.

-- 1. Create Helper Functions (SECURITY DEFINER to bypass RLS)

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_agent()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'agent'
      AND is_approved = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Refactor USER_ROLES Policies

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Roles are viewable by everyone" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;

-- Everyone can read roles (needed for login/auth checks often)
CREATE POLICY "Read roles"
  ON public.user_roles FOR SELECT
  USING (true);

-- Only Admins can CUD (Create, Update, Delete)
CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update roles"
  ON public.user_roles FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE
  USING (public.is_admin());


-- 3. Refactor PROFILES Policies

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins and Users view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins and Users update own profile" ON public.profiles;


-- View: Everyone can see profiles (or restrict to self + admin if preferred, but public profiles are common)
-- Let's go with: Users see own, Admins see all. 
CREATE POLICY "Users view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

-- Update: Users update own, Admins update all
CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR public.is_admin());

-- Insert: Usually handled by triggers, but if needed
CREATE POLICY "Users insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id OR public.is_admin());


-- 4. Refactor FLIGHT_BOOKINGS Policies (Example for resource tables)

ALTER TABLE public.flight_bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own bookings" ON public.flight_bookings;
DROP POLICY IF EXISTS "Admins view all bookings" ON public.flight_bookings;
-- (Drop generic/old policies if any)

CREATE POLICY "Users view own bookings"
  ON public.flight_bookings FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin() OR public.is_agent());

CREATE POLICY "Users insert own bookings"
  ON public.flight_bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id OR public.is_admin() OR public.is_agent());

CREATE POLICY "Users update own bookings"
  ON public.flight_bookings FOR UPDATE
  USING (auth.uid() = user_id OR public.is_admin()); -- Agents might need special logic, but keeping simple

-- 5. Refactor AGENT_DOCUMENTS Policies

ALTER TABLE public.agent_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins and Owners view docs" ON public.agent_documents;
DROP POLICY IF EXISTS "Agents can upload own docs" ON public.agent_documents;

CREATE POLICY "View agent docs"
  ON public.agent_documents FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Upload agent docs"
  ON public.agent_documents FOR INSERT
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Update agent docs"
  ON public.agent_documents FOR UPDATE
  USING (auth.uid() = user_id OR public.is_admin());

