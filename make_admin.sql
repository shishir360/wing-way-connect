-- ==========================================
-- PROMOTE USER TO ADMIN
-- ==========================================

-- 1. Insert or Update User Role to 'admin'
INSERT INTO public.user_roles (user_id, role, is_approved)
SELECT id, 'admin', true
FROM auth.users
WHERE email = 'shishirmd681@gmai.com' -- Replace with exact email
ON CONFLICT (user_id, role) 
DO UPDATE SET role = 'admin', is_approved = true;

-- 2. Update Profile to reflect role (optional but good for UI)
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'shishirmd681@gmai.com';

-- 3. Verify
SELECT * FROM public.user_roles 
WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'shishirmd681@gmai.com');
