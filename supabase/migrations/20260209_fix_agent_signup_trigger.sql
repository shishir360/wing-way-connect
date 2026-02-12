
-- Migration: fix_handle_new_user_trigger
-- Date: 2026-02-09
-- Description: Updates the handle_new_user trigger to respect the role provided in user metadata during signup.

create or replace function public.handle_new_user()
returns trigger as $$
declare
  requested_role text;
begin
  -- Get role from metadata, default to 'user' if not present
  requested_role := new.raw_user_meta_data->>'role';
  if requested_role is null then
    requested_role := 'user';
  end if;

  -- Create Profile
  insert into public.profiles (id, full_name, email, phone, role)
  values (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.email, 
    new.raw_user_meta_data->>'phone',
    requested_role
  );
  
  -- Logic for Agents
  if requested_role = 'agent' then
    insert into public.user_roles (user_id, role, is_approved)
    values (new.id, 'agent', false); -- Agents start unapproved
  
  -- Logic for Users (and others)
  else
    insert into public.user_roles (user_id, role, is_approved)
    values (new.id, 'user', true); -- Users are auto-approved
  end if;
  
  return new;
end;
$$ language plpgsql security definer;
