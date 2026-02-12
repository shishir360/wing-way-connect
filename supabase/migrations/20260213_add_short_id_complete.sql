-- 1. Add short_id column to shipments table if it doesn't exist
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS short_id TEXT;

-- 2. Create an index for faster lookups by short_id
CREATE INDEX IF NOT EXISTS idx_shipments_short_id ON shipments(short_id);

-- 3. Create a unique, alphanumeric 6-digit generation function
CREATE OR REPLACE FUNCTION public.generate_short_id()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  result TEXT := '';
  i INTEGER := 0;
  is_unique BOOLEAN := FALSE;
BEGIN
  WHILE NOT is_unique LOOP
    result := '';
    FOR i IN 1..6 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END FOR;
    
    -- Check uniqueness in both shipments and potentially other tables if needed
    SELECT NOT EXISTS (SELECT 1 FROM shipments WHERE short_id = result) INTO is_unique;
  END LOOP;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 4. Backfill existing rows with short IDs
UPDATE shipments SET short_id = generate_short_id() WHERE short_id IS NULL;

-- 5. Add a check constraint to ensure it's not null for future rows (optional but recommended)
-- ALTER TABLE shipments ALTER COLUMN short_id SET NOT NULL;
