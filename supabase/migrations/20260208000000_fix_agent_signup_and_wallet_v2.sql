
-- 1. ROBUST FIX FOR USER_ROLES
-- We use a DO block to safely check if the enum exists and add 'agent' if needed.
DO $$
BEGIN
    -- Check if the type exists
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        -- If it exists, try to add 'agent' to it (suppressing error if it already exists in newer Postgres versions)
        -- Note: 'ADD VALUE IF NOT EXISTS' is supported in Postgres 12+
        BEGIN
            ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'agent';
        EXCEPTION
            WHEN duplicate_object THEN null; -- Ignore if already exists
            WHEN OTHERS THEN null; -- Ignore other errors (like if it's not an enum, though name checked)
        END;
    END IF;
END $$;

-- Drop the old policy if it exists to replace it
DROP POLICY IF EXISTS "Users can insert their own role" ON public.user_roles;

-- Create the refined policy
-- We use role::text to be safe whether the underlying column is an ENUM or TEXT
CREATE POLICY "Users can insert their own role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND role::text IN ('agent', 'user') 
);


-- 2. CREATE WALLETS TABLE (For Commission/Consumption)
-- Using IF NOT EXISTS to be safe if you partly ran the previous script
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    balance DECIMAL(12,2) DEFAULT 0.00 NOT NULL,
    commission_rate DECIMAL(5,2) DEFAULT 0.00, 
    currency TEXT DEFAULT 'BDT',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for Wallets
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

-- Wallets Policies (Drop first to avoid "policy already exists" error)
DROP POLICY IF EXISTS "Users can view their own wallet" ON public.wallets;
CREATE POLICY "Users can view their own wallet" ON public.wallets
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all wallets" ON public.wallets;
CREATE POLICY "Admins can view all wallets" ON public.wallets
FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role)); -- Keep this cast for admin as it likely exists, or we should safer cast

DROP POLICY IF EXISTS "Admins can update all wallets" ON public.wallets;
CREATE POLICY "Admins can update all wallets" ON public.wallets
FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


-- 3. CREATE TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID REFERENCES public.wallets(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'commission', 'payment', 'refund', 'adjustment')),
    description TEXT,
    reference_id UUID,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for Transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Transactions Policies
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
CREATE POLICY "Users can view their own transactions" ON public.transactions
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.wallets WHERE wallets.id = transactions.wallet_id AND wallets.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Admins can view all transactions" ON public.transactions;
CREATE POLICY "Admins can view all transactions" ON public.transactions
FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can insert transactions" ON public.transactions;
CREATE POLICY "Admins can insert transactions" ON public.transactions
FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


-- 4. AUTO-CREATE WALLET FOR NEW USERS
CREATE OR REPLACE FUNCTION public.handle_new_user_wallet()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.wallets (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create wallet on signup
DROP TRIGGER IF EXISTS on_auth_user_created_wallet ON auth.users;
CREATE TRIGGER on_auth_user_created_wallet
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_wallet();

-- 5. BACKFILL WALLETS FOR EXISTING USERS
INSERT INTO public.wallets (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- 6. GRANT PERMISSIONS
GRANT ALL ON public.wallets TO postgres;
GRANT ALL ON public.wallets TO service_role;
GRANT ALL ON public.transactions TO postgres;
GRANT ALL ON public.transactions TO service_role;
