-- Create shipment_scans table
CREATE TABLE IF NOT EXISTS public.shipment_scans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    shipment_id UUID REFERENCES public.shipments(id) ON DELETE CASCADE,
    scanned_by UUID REFERENCES auth.users(id),
    scan_type TEXT NOT NULL, -- 'pickup', 'handover', 'checkpoint', 'delivery'
    location TEXT,
    notes TEXT,
    scanned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.shipment_scans ENABLE ROW LEVEL SECURITY;

-- Policies
-- 1. Agents and Admins can view scans
CREATE POLICY "Agents and Admins can view scans" ON public.shipment_scans
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role IN ('admin', 'agent')
        )
    );

-- 2. Agents and Admins can insert scans
CREATE POLICY "Agents and Admins can insert scans" ON public.shipment_scans
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role IN ('admin', 'agent')
        )
    );

-- Grant permissions
GRANT SELECT, INSERT ON public.shipment_scans TO authenticated;
GRANT SELECT, INSERT ON public.shipment_scans TO service_role;
