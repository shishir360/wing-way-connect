-- Create admins table
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
    email TEXT NOT NULL,
    full_name TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create agents table
CREATE TABLE IF NOT EXISTS public.agents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
    email TEXT NOT NULL,
    full_name TEXT,
    phone TEXT,
    license_number TEXT,
    vehicle_type TEXT,
    status TEXT DEFAULT 'offline', -- online, offline, busy
    is_approved BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

-- Policies for admins
CREATE POLICY "Admins can view their own data" ON public.admins
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can update their own data" ON public.admins
    FOR UPDATE USING (auth.uid() = user_id);

-- Policies for agents
CREATE POLICY "Agents can view their own data" ON public.agents
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Agents can update their own data" ON public.agents
    FOR UPDATE USING (auth.uid() = user_id);

-- Grant access to authenticated users
GRANT ALL ON public.admins TO authenticated;
GRANT ALL ON public.agents TO authenticated;
GRANT ALL ON public.admins TO service_role;
GRANT ALL ON public.agents TO service_role;
