
-- 1. FIX USER_ROLES RLS ISSUE
-- Allow authenticated users to insert their *own* role during signup
DROP POLICY IF EXISTS "Users can insert their own role" ON public.user_roles;
CREATE POLICY "Users can insert their own role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND role IN ('agent'::public.app_role, 'user'::public.app_role) -- Only allow 'agent' or 'user', not 'admin'
);


-- 2. CREATE WALLETS TABLE (For Commission/Consumption)
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    balance DECIMAL(12,2) DEFAULT 0.00 NOT NULL,
    -- 'commission_rate': Percentage (e.g., 5.00 for 5%) that the admin takes from this agent's bookings
    commission_rate DECIMAL(5,2) DEFAULT 0.00, 
    currency TEXT DEFAULT 'BDT',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for Wallets
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

-- Wallets Policies
CREATE POLICY "Users can view their own wallet" ON public.wallets
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all wallets" ON public.wallets
FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can update all wallets" ON public.wallets
FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


-- 3. CREATE TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID REFERENCES public.wallets(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(12,2) NOT NULL, -- Positive for credit, negative for debit
    type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'commission', 'payment', 'refund', 'adjustment')),
    description TEXT,
    reference_id UUID, -- Can link to shipment_id or booking_id
    created_by UUID REFERENCES auth.users(id), -- Who performed the transaction (admin or system)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for Transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Transactions Policies
CREATE POLICY "Users can view their own transactions" ON public.transactions
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.wallets WHERE wallets.id = transactions.wallet_id AND wallets.user_id = auth.uid())
);

CREATE POLICY "Admins can view all transactions" ON public.transactions
FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can insert transactions" ON public.transactions
FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


-- 4. AUTO-CREATE WALLET FOR NEW USERS
-- We start by creating a function that will be called by the trigger
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
-- This is safe to run because of ON CONFLICT DO NOTHING above, but let's do it explicitly
INSERT INTO public.wallets (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- 6. GRANT PERMISSIONS (Just in case)
GRANT ALL ON public.wallets TO postgres;
GRANT ALL ON public.wallets TO service_role;
GRANT ALL ON public.transactions TO postgres;
GRANT ALL ON public.transactions TO service_role;
