-- DANGER: This script will delete all data in admins and agents tables
-- Run this in the Supabase SQL Editor to reset your authentication tables

-- 1. Drop existing policies
DROP POLICY IF EXISTS "Admins can view their own profile" ON public.admins;
DROP POLICY IF EXISTS "Admins can update their own profile" ON public.admins;
DROP POLICY IF EXISTS "Agents can view their own profile" ON public.agents;
DROP POLICY IF EXISTS "Agents can update their own profile" ON public.agents;

-- 2. Drop existing tables
DROP TABLE IF EXISTS public.admins;
DROP TABLE IF EXISTS public.agents;

-- 3. Recreate Admins Table
CREATE TABLE public.admins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    email TEXT NOT NULL,
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT admins_user_id_key UNIQUE (user_id)
);

-- 4. Recreate Agents Table
CREATE TABLE public.agents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    email TEXT NOT NULL,
    full_name TEXT,
    phone TEXT,
    license_number TEXT,
    status TEXT DEFAULT 'offline',
    is_approved BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT agents_user_id_key UNIQUE (user_id)
);

-- 5. Enable RLS
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

-- 6. Create Permissive Policies (for easy testing)
-- Allow users to insert their own profile during signup
CREATE POLICY "Enable insert for authenticated users only" ON public.admins FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Enable select for users based on user_id" ON public.admins FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Enable insert for authenticated users only" ON public.agents FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Enable select for users based on user_id" ON public.agents FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 7. Grant access to authenticated users
GRANT ALL ON public.admins TO authenticated;
GRANT ALL ON public.agents TO authenticated;
GRANT ALL ON public.admins TO service_role;
GRANT ALL ON public.agents TO service_role;
