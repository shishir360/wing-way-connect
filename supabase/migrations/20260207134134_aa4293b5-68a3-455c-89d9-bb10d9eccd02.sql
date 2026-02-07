
-- Allow users to assign admin role to themselves during signup (via admin code)
-- This policy allows insert if the user is setting their own user_id
CREATE POLICY "Users can self-assign roles during signup"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
