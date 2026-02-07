-- ==============================================================================
-- ADD DESIGNATED STATUS TO AGENTS
-- RUN THIS IN SUPABASE SQL EDITOR
-- ==============================================================================

-- 1. Add 'designated_status' column to user_roles
-- This stores the fixed role for the agent (e.g., 'picked_up', 'arrived_at_warehouse')
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS designated_status text;

-- 2. Add 'scanned_at' to shipment_scans if missing (for better tracking)
ALTER TABLE public.shipment_scans ADD COLUMN IF NOT EXISTS scanned_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL;
