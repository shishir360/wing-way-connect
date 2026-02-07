-- ==============================================================================
-- CHECK TRACKING IDs: RUN THIS IN SUPABASE SQL EDITOR
-- ==============================================================================

-- 1. List all shipments to see what IDs exist
SELECT tracking_id, sender_name, created_at, status FROM public.shipments ORDER BY created_at DESC LIMIT 10;

-- 2. List all flights to see what Refs/PNRs exist
SELECT booking_ref, pnr, airline, created_at FROM public.flight_bookings ORDER BY created_at DESC LIMIT 10;

-- 3. Check RLS status (just to be sure)
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('shipments', 'flight_bookings');
