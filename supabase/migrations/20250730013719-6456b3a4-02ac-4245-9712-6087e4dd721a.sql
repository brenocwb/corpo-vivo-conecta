-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles in their church" ON public.profiles;
DROP POLICY IF EXISTS "Hierarchical supervision access" ON public.profiles;

-- Drop existing functions that cause recursion
DROP FUNCTION IF EXISTS public.get_user_role(uuid);
DROP FUNCTION IF EXISTS public.get_user_church(uuid);

-- Create new security definer functions that don't cause recursion
CREATE OR REPLACE FUNCTION public.get_current_user_profile()
RETURNS TABLE(id uuid, role user_role, church_id uuid)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT p.id, p.role, p.church_id 
  FROM public.profiles p 
  WHERE p.user_id = auth.uid()
  LIMIT 1;
$$;

-- Create simple policies without recursion
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
USING (user_id = auth.uid());

-- Simple admin policy for viewing profiles in same church
CREATE POLICY "Church members can view profiles" 
ON public.profiles 
FOR SELECT 
USING (
  church_id = (
    SELECT church_id FROM public.profiles 
    WHERE user_id = auth.uid() 
    LIMIT 1
  )
);

-- Allow profile creation during signup
CREATE POLICY "Allow profile creation" 
ON public.profiles 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Update other tables to use the new function approach
-- Fix alerts policies
DROP POLICY IF EXISTS "Users can view their own alerts" ON public.alerts;
DROP POLICY IF EXISTS "Users can update their own alerts" ON public.alerts;

CREATE POLICY "Users can view own alerts" 
ON public.alerts 
FOR SELECT 
USING (
  target_user_id = (
    SELECT id FROM public.profiles 
    WHERE user_id = auth.uid() 
    LIMIT 1
  )
);

CREATE POLICY "Users can update own alerts" 
ON public.alerts 
FOR UPDATE 
USING (
  target_user_id = (
    SELECT id FROM public.profiles 
    WHERE user_id = auth.uid() 
    LIMIT 1
  )
);

-- Fix church policies
DROP POLICY IF EXISTS "Users can view their church" ON public.churches;
DROP POLICY IF EXISTS "Admins can update their church" ON public.churches;

CREATE POLICY "Users can view church" 
ON public.churches 
FOR SELECT 
USING (
  id = (
    SELECT church_id FROM public.profiles 
    WHERE user_id = auth.uid() 
    LIMIT 1
  )
);

CREATE POLICY "Admins can update church" 
ON public.churches 
FOR UPDATE 
USING (
  id = (
    SELECT church_id FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
    LIMIT 1
  )
);

-- Allow church and profile creation for new users
CREATE POLICY "Allow church creation" 
ON public.churches 
FOR INSERT 
WITH CHECK (true);

-- Fix house_groups policies
DROP POLICY IF EXISTS "Users can view groups in their church" ON public.house_groups;
DROP POLICY IF EXISTS "Leaders and admins can manage groups in their church" ON public.house_groups;

CREATE POLICY "Users can view church groups" 
ON public.house_groups 
FOR SELECT 
USING (
  church_id = (
    SELECT church_id FROM public.profiles 
    WHERE user_id = auth.uid() 
    LIMIT 1
  )
);

CREATE POLICY "Leaders can manage groups" 
ON public.house_groups 
FOR ALL 
USING (
  church_id = (
    SELECT church_id FROM public.profiles 
    WHERE user_id = auth.uid() 
    LIMIT 1
  ) AND (
    leader_id = (
      SELECT id FROM public.profiles 
      WHERE user_id = auth.uid() 
      LIMIT 1
    ) OR 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'pastor', 'missionario', 'lider')
      LIMIT 1
    )
  )
);

-- Enable INSERT for house groups
CREATE POLICY "Allow group creation" 
ON public.house_groups 
FOR INSERT 
WITH CHECK (
  church_id = (
    SELECT church_id FROM public.profiles 
    WHERE user_id = auth.uid() 
    LIMIT 1
  )
);