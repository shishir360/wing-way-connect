-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own role" ON user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;

-- 1. Policies for PROFILES
-- Allow users to view their own profile
CREATE POLICY "Users can view own profile" 
ON profiles FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);

-- Allow admins to view ALL profiles
CREATE POLICY "Admins can view all profiles" 
ON profiles FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND (user_roles.role = 'admin' OR user_roles.role = 'super_admin')
  )
);

-- 2. Policies for USER_ROLES
-- Allow users to view their own role
CREATE POLICY "Users can view own role" 
ON user_roles FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Allow admins to view ALL roles
CREATE POLICY "Admins can view all roles" 
ON user_roles FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND (ur.role = 'admin' OR ur.role = 'super_admin')
  )
);

-- Allow admins to insert/update/delete roles
CREATE POLICY "Admins can manage roles" 
ON user_roles FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND (ur.role = 'admin' OR ur.role = 'super_admin')
  )
);
