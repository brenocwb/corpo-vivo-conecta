-- Fix infinite recursion in profiles RLS policies
-- Drop existing problematic policies first
DROP POLICY IF EXISTS "Hierarchical supervision access" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles in their church" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Create new policies without recursion
CREATE POLICY "Users can view their own profile" 
ON profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create a safer policy for admins using a function
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Create a function to get user's church
CREATE OR REPLACE FUNCTION public.get_current_user_church()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT church_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- New admin policy without recursion
CREATE POLICY "Admins can view all profiles in their church" 
ON profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles p1 
    WHERE p1.user_id = auth.uid() 
    AND p1.role = 'admin' 
    AND p1.church_id = profiles.church_id
  )
);

-- Simplified hierarchical access policy
CREATE POLICY "Leaders can view their supervised members" 
ON profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles supervisor 
    WHERE supervisor.user_id = auth.uid() 
    AND (
      (supervisor.role = 'pastor' AND supervisor.church_id = profiles.church_id) OR
      (supervisor.role = 'missionario' AND profiles.supervisor_id = supervisor.id) OR
      (supervisor.role = 'lider' AND profiles.supervisor_id = supervisor.id)
    )
  )
);