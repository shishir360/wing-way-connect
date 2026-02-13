
-- Seed Live Delivery Updates
-- This script adds dummy scan data to the shipment_scans table so the "Live Delivery Updates" section is populated.

INSERT INTO public.shipment_scans (shipment_id, scanned_by, scan_type, location, notes, scanned_at)
SELECT
    id,
    (SELECT id FROM auth.users LIMIT 1), -- Assigns the scan to the first available user/agent found
    'checkpoint',
    'Dhaka Distribution Center',
    'Package arrived at main distribution hub',
    NOW() - (random() * interval '4 hours')
FROM public.shipments
ORDER BY created_at DESC
LIMIT 5
ON CONFLICT DO NOTHING;

-- Also add an 'out_for_delivery' scan for one of them
INSERT INTO public.shipment_scans (shipment_id, scanned_by, scan_type, location, notes, scanned_at)
SELECT
    id,
    (SELECT id FROM auth.users LIMIT 1),
    'out_for_delivery',
    'Dhaka City',
    'Out for delivery with rider',
    NOW() - interval '10 minutes'
FROM public.shipments
ORDER BY created_at DESC
LIMIT 1
OFFSET 1
ON CONFLICT DO NOTHING;
