-- ==========================================
-- FIX MISSING USERS & RLS (Run in Supabase SQL Editor)
-- ==========================================

-- 1. BACKFILL PROFILES (Critical step if table is empty)
-- This takes all users from the Auth system and creates Profile entries for them
INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'full_name', 'Unnamed User'),
    COALESCE(raw_user_meta_data->>'role', 'user')
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- 2. RESET POLICIES (Fixes "Permission Denied" errors)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop old/conflicting policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.profiles;

-- Create a simple READ policy for all logged-in users (Admins need to see everyone)
CREATE POLICY "Allow authenticated to view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- Create UPDATE policy for users to edit their own profile
CREATE POLICY "Allow users to update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- 3. CHECK RESULTS
SELECT count(*) as total_profiles_after_fix FROM public.profiles;
