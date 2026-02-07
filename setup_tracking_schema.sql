-- ==============================================================================
-- TRACKING SCHEMA SETUP: RUN THIS IN SUPABASE SQL EDITOR
-- ==============================================================================

-- 1. Create Shipment Timeline Table (If missing)
CREATE TABLE IF NOT EXISTS public.shipment_timeline (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    shipment_id uuid REFERENCES public.shipments(id) ON DELETE CASCADE,
    student_id text, -- optional reference if needed
    status text NOT NULL,
    description text,
    location text,
    event_time timestamptz DEFAULT now(),
    is_current boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.shipment_timeline ENABLE ROW LEVEL SECURITY;

-- 3. Tracking Policies (Public Access)
DROP POLICY IF EXISTS "Public can view timeline" ON public.shipment_timeline;

CREATE POLICY "Public can view timeline" 
ON public.shipment_timeline FOR SELECT 
TO public 
USING (true);

-- 4. Admin/Agent Management Policies
DROP POLICY IF EXISTS "Admins can manage timeline" ON public.shipment_timeline;

CREATE POLICY "Admins can manage timeline" 
ON public.shipment_timeline FOR ALL 
TO authenticated 
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'agent'))
);

-- 5. Re-apply Tracking Access for Shipments & Flights (Just in case)
DROP POLICY IF EXISTS "Public can view shipments by tracking_id" ON public.shipments;

CREATE POLICY "Public can view shipments by tracking_id" 
ON public.shipments FOR SELECT 
TO public 
USING (true);

DROP POLICY IF EXISTS "Public can view flights by ref" ON public.flight_bookings;

CREATE POLICY "Public can view flights by ref" 
ON public.flight_bookings FOR SELECT 
TO public 
USING (true);
