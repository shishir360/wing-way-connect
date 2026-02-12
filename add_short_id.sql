-- Add short_id column to shipments table
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS short_id TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_shipments_short_id ON shipments(short_id);

-- Comment
COMMENT ON COLUMN shipments.short_id IS 'A short, unique PIN for easy identification (e.g., 6 digits)';
