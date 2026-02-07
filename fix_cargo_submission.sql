-- ==============================================================================
-- FIX CARGO SUBMISSION: RUN THIS IN SUPABASE SQL EDITOR
-- ==============================================================================

-- 1. Create the Tracking ID Generator Function
-- The app needs this to create unique IDs like WC-SH-12345
CREATE OR REPLACE FUNCTION public.generate_tracking_id()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    new_id text;
    exists_check boolean;
BEGIN
    LOOP
        new_id := 'WC-SH-' || floor(10000 + random() * 90000)::text;
        
        -- Check if it already exists
        SELECT EXISTS (SELECT 1 FROM public.shipments WHERE tracking_id = new_id) INTO exists_check;
        
        -- If unique, exit loop
        IF NOT exists_check THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN new_id;
END;
$$;

-- 2. Ensure Shipments Table has all required columns
-- Adding columns that might be missing from the base setup
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- Sender & Receiver Details (CRITICALLY IMPORTANT)
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS sender_name text;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS sender_phone text;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS sender_email text;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS pickup_address text;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS receiver_name text;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS receiver_phone text;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS delivery_address text;

-- Shipment Details
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS route text;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS cargo_type text;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS packages integer DEFAULT 1;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS contents text;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS from_city text;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS to_city text;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS service_type text;

-- Costs & Options
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS base_cost decimal;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS insurance_cost decimal;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS fragile_fee decimal;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS total_cost decimal;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS has_insurance boolean DEFAULT false;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS is_fragile boolean DEFAULT false;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'unpaid';

-- 3. Reset RLS Policies for Shipments to be safe
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own shipments" ON public.shipments;
DROP POLICY IF EXISTS "Users can create shipments" ON public.shipments;
DROP POLICY IF EXISTS "Admins/Agents can manage shipments" ON public.shipments;

-- Allow users to insert their own shipments
CREATE POLICY "Users can create shipments" 
ON public.shipments FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Allow users to see their own
CREATE POLICY "Users view own shipments" 
ON public.shipments FOR SELECT 
TO authenticated 
USING (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'agent'))
);

-- Allow admins/agents to manage (update/delete) shipments
CREATE POLICY "Admins/Agents can manage shipments" 
ON public.shipments FOR ALL 
TO authenticated 
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'agent'))
);
