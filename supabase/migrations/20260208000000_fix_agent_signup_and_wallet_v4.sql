
-- 0. CLEANUP: DROP OLD FUNCTIONS/POLICIES TO AVOID CONFLICTS
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);
DROP FUNCTION IF EXISTS public.has_role(uuid, text);

-- 1. ROBUST has_role FUNCTION (ACCEPTS TEXT)
-- This version accepts text and compares against role column safely casting to text
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      -- Cast column to text just in case it is an enum or other type
      AND role::text = _role
  );
$$;

-- 2. FIX USER_ROLES RLS ISSUE
-- Allow authenticated users to insert their *own* role during signup
DROP POLICY IF EXISTS "Users can insert their own role" ON public.user_roles;

-- Create the refined policy
CREATE POLICY "Users can insert their own role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  -- Compare as text to be safe
  AND role::text IN ('agent', 'user') 
);


-- 3. CREATE WALLETS TABLE (For Commission/Consumption)
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
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update all wallets" ON public.wallets;
CREATE POLICY "Admins can update all wallets" ON public.wallets
FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));


-- 4. CREATE TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID REFERENCES public.wallets(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(12,2) NOT NULL, -- Positive for credit, negative for debit
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
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can insert transactions" ON public.transactions;
CREATE POLICY "Admins can insert transactions" ON public.transactions
FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));


-- 5. AUTO-CREATE WALLET FOR NEW USERS
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

-- 6. BACKFILL WALLETS FOR EXISTING USERS
INSERT INTO public.wallets (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- 7. GRANT PERMISSIONS
GRANT ALL ON public.wallets TO postgres;
GRANT ALL ON public.wallets TO service_role;
GRANT ALL ON public.transactions TO postgres;
GRANT ALL ON public.transactions TO service_role;
