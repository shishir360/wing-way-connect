-- ==============================================================================
-- FIX FLIGHT SUBMISSION: RUN THIS IN SUPABASE SQL EDITOR
-- ==============================================================================

-- 1. Create the Booking Reference Generator Function
-- The app needs this to create unique IDs like WC-FL-12345
CREATE OR REPLACE FUNCTION public.generate_booking_ref()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    new_ref text;
    exists_check boolean;
BEGIN
    LOOP
        new_ref := 'WC-FL-' || floor(10000 + random() * 90000)::text;
        
        -- Check if it already exists
        SELECT EXISTS (SELECT 1 FROM public.flight_bookings WHERE booking_ref = new_ref) INTO exists_check;
        
        -- If unique, exit loop
        IF NOT exists_check THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN new_ref;
END;
$$;

-- 2. Ensure Flight Bookings Table has all required columns
-- Adding columns that might be missing from the base setup
ALTER TABLE public.flight_bookings ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- Flight Info
ALTER TABLE public.flight_bookings ADD COLUMN IF NOT EXISTS booking_ref text;
ALTER TABLE public.flight_bookings ADD COLUMN IF NOT EXISTS pnr text;
ALTER TABLE public.flight_bookings ADD COLUMN IF NOT EXISTS airline text;
ALTER TABLE public.flight_bookings ADD COLUMN IF NOT EXISTS flight_number text;
ALTER TABLE public.flight_bookings ADD COLUMN IF NOT EXISTS from_city text;
ALTER TABLE public.flight_bookings ADD COLUMN IF NOT EXISTS to_city text;
ALTER TABLE public.flight_bookings ADD COLUMN IF NOT EXISTS departure_date text;
ALTER TABLE public.flight_bookings ADD COLUMN IF NOT EXISTS return_date text;
ALTER TABLE public.flight_bookings ADD COLUMN IF NOT EXISTS departure_time text;
ALTER TABLE public.flight_bookings ADD COLUMN IF NOT EXISTS arrival_time text;
ALTER TABLE public.flight_bookings ADD COLUMN IF NOT EXISTS arrival_date text;
ALTER TABLE public.flight_bookings ADD COLUMN IF NOT EXISTS duration text;
ALTER TABLE public.flight_bookings ADD COLUMN IF NOT EXISTS stops integer DEFAULT 0;
ALTER TABLE public.flight_bookings ADD COLUMN IF NOT EXISTS stop_location text;

-- Passenger Info
ALTER TABLE public.flight_bookings ADD COLUMN IF NOT EXISTS adults integer DEFAULT 1;
ALTER TABLE public.flight_bookings ADD COLUMN IF NOT EXISTS children integer DEFAULT 0;
ALTER TABLE public.flight_bookings ADD COLUMN IF NOT EXISTS cabin_class text;
ALTER TABLE public.flight_bookings ADD COLUMN IF NOT EXISTS trip_type text;

-- Pricing & Status
ALTER TABLE public.flight_bookings ADD COLUMN IF NOT EXISTS price_per_person decimal;
ALTER TABLE public.flight_bookings ADD COLUMN IF NOT EXISTS total_price decimal;
ALTER TABLE public.flight_bookings ADD COLUMN IF NOT EXISTS status text DEFAULT 'confirmed';
ALTER TABLE public.flight_bookings ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'unpaid';


-- 3. Reset RLS Policies for Flight Bookings to be safe
ALTER TABLE public.flight_bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own bookings" ON public.flight_bookings;
DROP POLICY IF EXISTS "Users can create bookings" ON public.flight_bookings;
DROP POLICY IF EXISTS "Admins/Agents can manage bookings" ON public.flight_bookings;

-- Allow users to insert their own bookings
CREATE POLICY "Users can create bookings" 
ON public.flight_bookings FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Allow users to see their own
CREATE POLICY "Users view own bookings" 
ON public.flight_bookings FOR SELECT 
TO authenticated 
USING (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'agent'))
);

-- Allow admins/agents to manage (update/delete) bookings
CREATE POLICY "Admins/Agents can manage bookings" 
ON public.flight_bookings FOR ALL 
TO authenticated 
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'agent'))
);
