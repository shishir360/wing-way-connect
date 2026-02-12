-- Migration to fix Agent Signup by using Server-Side Trigger
-- This ensures that when a user signs up with metadata { role: 'agent' }, 
-- they automatically get the 'agent' role in user_roles and an entry in agents table.

-- 1. Ensure role column in user_roles is TEXT (already verified, but for safety)
DO $$ 
BEGIN 
    -- We cannot easily check type in DO block for ALTER, but we know it is text from previous check.
    -- If it was enum, we would need to drop constraint. 
    -- Proceeding with trigger creation.
END $$;

-- 2. Create the Trigger Function
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER AS $$
DECLARE
  _role text;
  _full_name text;
  _phone text;
  _email text;
BEGIN
  -- Extract metadata
  _role := NEW.raw_user_meta_data->>'role';
  _full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
  _phone := COALESCE(NEW.raw_user_meta_data->>'phone', '');
  _email := NEW.email;

  -- Only proceed if role is 'agent'
  IF _role = 'agent' THEN
    
    -- A. Insert into user_roles
    INSERT INTO public.user_roles (user_id, role, is_approved)
    VALUES (NEW.id, 'agent', false) -- Default to unapproved
    ON CONFLICT (user_id, role) DO NOTHING;

    -- B. Insert into agents table
    INSERT INTO public.agents (user_id, email, full_name, phone, is_approved, status)
    VALUES (NEW.id, _email, _full_name, _phone, false, 'offline')
    ON CONFLICT (user_id) DO NOTHING;

  ELSIF _role = 'user' THEN
     -- Optional: Insert 'user' role if needed
     INSERT INTO public.user_roles (user_id, role)
     VALUES (NEW.id, 'user')
     ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create the Trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;
CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();
