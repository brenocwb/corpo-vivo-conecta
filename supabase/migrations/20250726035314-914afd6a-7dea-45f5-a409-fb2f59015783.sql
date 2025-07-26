-- Fix function search paths
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID)
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT role FROM public.profiles WHERE user_id = user_uuid;
$$;

CREATE OR REPLACE FUNCTION public.get_user_church(user_uuid UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT church_id FROM public.profiles WHERE user_id = user_uuid;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Add missing RLS policies for group_meetings
CREATE POLICY "Users can view meetings in their church" 
ON public.group_meetings FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.house_groups hg 
    WHERE hg.id = group_id AND hg.church_id = public.get_user_church(auth.uid())
  )
);

CREATE POLICY "Leaders can manage meetings in their groups" 
ON public.group_meetings FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.house_groups hg 
    WHERE hg.id = group_id 
    AND hg.church_id = public.get_user_church(auth.uid())
    AND (public.get_user_role(auth.uid()) = 'admin' OR hg.leader_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
  )
);

-- Add missing RLS policies for meeting_attendance
CREATE POLICY "Users can view attendance in their church" 
ON public.meeting_attendance FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.group_meetings gm
    JOIN public.house_groups hg ON hg.id = gm.group_id
    WHERE gm.id = meeting_id AND hg.church_id = public.get_user_church(auth.uid())
  )
);

CREATE POLICY "Leaders can manage attendance in their groups" 
ON public.meeting_attendance FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.group_meetings gm
    JOIN public.house_groups hg ON hg.id = gm.group_id
    WHERE gm.id = meeting_id 
    AND hg.church_id = public.get_user_church(auth.uid())
    AND (public.get_user_role(auth.uid()) = 'admin' OR hg.leader_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
  )
);

-- Add missing RLS policies for discipulados
CREATE POLICY "Users can view discipulados in their church" 
ON public.discipulados FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p1, public.profiles p2
    WHERE p1.id = leader_id AND p2.id = disciple_id
    AND p1.church_id = public.get_user_church(auth.uid())
    AND p2.church_id = public.get_user_church(auth.uid())
    AND (
      leader_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
      disciple_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
      public.get_user_role(auth.uid()) = 'admin'
    )
  )
);

CREATE POLICY "Leaders and admins can manage discipulados" 
ON public.discipulados FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p1, public.profiles p2
    WHERE p1.id = leader_id AND p2.id = disciple_id
    AND p1.church_id = public.get_user_church(auth.uid())
    AND p2.church_id = public.get_user_church(auth.uid())
    AND (
      leader_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
      public.get_user_role(auth.uid()) = 'admin'
    )
  )
);

-- Add missing RLS policies for encontros
CREATE POLICY "Users can view encontros they participate in" 
ON public.encontros FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.discipulados d
    JOIN public.profiles p1 ON p1.id = d.leader_id
    JOIN public.profiles p2 ON p2.id = d.disciple_id
    WHERE d.id = discipulado_id
    AND p1.church_id = public.get_user_church(auth.uid())
    AND p2.church_id = public.get_user_church(auth.uid())
    AND (
      d.leader_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
      d.disciple_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
      public.get_user_role(auth.uid()) = 'admin'
    )
  )
);

CREATE POLICY "Leaders can manage encontros with their disciples" 
ON public.encontros FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.discipulados d
    JOIN public.profiles p1 ON p1.id = d.leader_id
    JOIN public.profiles p2 ON p2.id = d.disciple_id
    WHERE d.id = discipulado_id
    AND p1.church_id = public.get_user_church(auth.uid())
    AND p2.church_id = public.get_user_church(auth.uid())
    AND (
      d.leader_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
      public.get_user_role(auth.uid()) = 'admin'
    )
  )
);

-- Add missing RLS policies for estudos
CREATE POLICY "Users can view public estudos or estudos from their church" 
ON public.estudos FOR SELECT 
USING (
  is_public = true OR 
  church_id = public.get_user_church(auth.uid())
);

CREATE POLICY "Church members can create estudos for their church" 
ON public.estudos FOR INSERT 
WITH CHECK (
  church_id = public.get_user_church(auth.uid()) AND
  author_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Authors and admins can update estudos" 
ON public.estudos FOR UPDATE 
USING (
  author_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
  (church_id = public.get_user_church(auth.uid()) AND public.get_user_role(auth.uid()) = 'admin')
);