-- Add short_id column to shipments table
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS short_id TEXT;

-- Create an index for faster lookups by short_id
CREATE INDEX IF NOT EXISTS idx_shipments_short_id ON shipments(short_id);

-- Start backfilling existing rows (optional, but good for consistency)
-- We won't force unique yet for existing data to avoid conflicts, 
-- but we might want to ensure new ones are unique in the application logic or later constraints.
