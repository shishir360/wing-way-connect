-- Add assigned_agent column to shipments table
ALTER TABLE shipments 
ADD COLUMN IF NOT EXISTS assigned_agent UUID REFERENCES auth.users(id);

-- Create an index for faster lookups by assigned_agent
CREATE INDEX IF NOT EXISTS idx_shipments_assigned_agent ON shipments(assigned_agent);

-- Optional: Comment on column
COMMENT ON COLUMN shipments.assigned_agent IS 'The ID of the agent currently responsible for the shipment';
