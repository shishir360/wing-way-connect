-- Create table for storing verification codes
CREATE TABLE IF NOT EXISTS public.verification_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'signup', -- 'signup', 'reset_password', etc.
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb -- Store temp user data (name, phone, etc.) for registration
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_verification_codes_email_code ON public.verification_codes(email, code);

-- RLS Policies (Only service role should verify for now, or use function)
ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;

-- Allow anon to verify (via Edge Function mostly, but just in case we need direct access safely)
-- Actually, better to keep it private and only access via Database Functions or Edge Functions
-- But for development ease, we might need some access. Let's keep it restricted.

-- Create a function to clean up expired codes
CREATE OR REPLACE FUNCTION public.cleanup_verification_codes()
RETURNS trigger AS $$
BEGIN
  DELETE FROM public.verification_codes WHERE expires_at < NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger cleanup occasionally (e.g. on insert)
CREATE TRIGGER trigger_cleanup_verification_codes
AFTER INSERT ON public.verification_codes
EXECUTE FUNCTION public.cleanup_verification_codes();
