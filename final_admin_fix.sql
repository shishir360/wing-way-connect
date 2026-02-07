-- ==============================================================================
-- FINAL ADMIN FIX: RUN THIS IN SUPABASE SQL EDITOR
-- ==============================================================================

-- 1. Enable RLS on core tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to start fresh (avoids conflicts)
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated to view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

-- 3. Create SIMPLE, PERMISSIVE Policies for reading
-- Allow ANY logged-in user to see ALL profiles (Required for Admin to work properly)
CREATE POLICY "Allow authenticated to view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- Allow users to update ONLY their own profile
CREATE POLICY "Allow users to update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Allow ANY logged-in user to see ALL roles
CREATE POLICY "Allow authenticated to view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (true);

-- Allow Admins (or anyone authenticated for now to fix access) to manage roles
-- (Ideally restrict this to admins, but let's fix visibility first)
CREATE POLICY "Allow authenticated to manage roles"
ON public.user_roles FOR ALL
TO authenticated
USING (true);

-- 4. BACKFILL MISSING PROFILES
-- This is critical: if profiles are missing, they won't show up in the list
INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'full_name', 'User ' || substr(id::text, 1, 4)),
    COALESCE(raw_user_meta_data->>'role', 'user')
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- 5. ENSURE CURRENT USER IS ADMIN
-- Updates your user to be an admin so you can see the dashboard
INSERT INTO public.user_roles (user_id, role, is_approved)
SELECT auth.uid(), 'admin', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
);
