-- Create prayer_requests table for Centro de Oração
CREATE TABLE public.prayer_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'geral',
  urgency TEXT NOT NULL DEFAULT 'normal',
  status TEXT NOT NULL DEFAULT 'em_oracao',
  requested_by UUID NOT NULL,
  church_id UUID NOT NULL,
  answered_at TIMESTAMP WITH TIME ZONE,
  testimony TEXT,
  private BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create resources table for Biblioteca de Recursos
CREATE TABLE public.resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  category TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'artigo',
  author TEXT,
  url TEXT,
  difficulty_level TEXT NOT NULL DEFAULT 'iniciante',
  church_id UUID,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create spiritual_growth table for Sistema de Níveis
CREATE TABLE public.spiritual_growth (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  maturity_level TEXT NOT NULL DEFAULT 'iniciante',
  spiritual_gifts TEXT[],
  growth_goals TEXT[],
  areas_improvement TEXT[],
  last_assessment TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create prayer_group_members for groups prayer requests
CREATE TABLE public.prayer_group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prayer_request_id UUID NOT NULL,
  user_id UUID NOT NULL,
  is_praying BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.prayer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spiritual_growth ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prayer_group_members ENABLE ROW LEVEL SECURITY;

-- Create policies for prayer_requests
CREATE POLICY "Users can view prayer requests in their church"
ON public.prayer_requests FOR SELECT
USING (
  church_id = get_user_church(auth.uid()) AND 
  (private = false OR requested_by = (SELECT id FROM profiles WHERE user_id = auth.uid()))
);

CREATE POLICY "Users can create prayer requests in their church"
ON public.prayer_requests FOR INSERT
WITH CHECK (
  church_id = get_user_church(auth.uid()) AND 
  requested_by = (SELECT id FROM profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can update their own prayer requests"
ON public.prayer_requests FOR UPDATE
USING (requested_by = (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Create policies for resources
CREATE POLICY "Users can view public resources or church resources"
ON public.resources FOR SELECT
USING (is_public = true OR church_id = get_user_church(auth.uid()));

CREATE POLICY "Leaders can create resources in their church"
ON public.resources FOR INSERT
WITH CHECK (
  church_id = get_user_church(auth.uid()) AND 
  created_by = (SELECT id FROM profiles WHERE user_id = auth.uid()) AND
  get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'pastor'::user_role, 'lider'::user_role])
);

CREATE POLICY "Authors can update their resources"
ON public.resources FOR UPDATE
USING (created_by = (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Create policies for spiritual_growth
CREATE POLICY "Users can manage their own spiritual growth"
ON public.spiritual_growth FOR ALL
USING (user_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Leaders can view spiritual growth in their church"
ON public.spiritual_growth FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = spiritual_growth.user_id 
      AND p.church_id = get_user_church(auth.uid())
      AND get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'pastor'::user_role, 'lider'::user_role])
  )
);

-- Create policies for prayer_group_members
CREATE POLICY "Users can view prayer group members in their church"
ON public.prayer_group_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM prayer_requests pr 
    WHERE pr.id = prayer_group_members.prayer_request_id 
      AND pr.church_id = get_user_church(auth.uid())
  )
);

CREATE POLICY "Users can manage their prayer participation"
ON public.prayer_group_members FOR ALL
USING (user_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Add triggers for updated_at
CREATE TRIGGER update_prayer_requests_updated_at
BEFORE UPDATE ON public.prayer_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_resources_updated_at
BEFORE UPDATE ON public.resources
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_spiritual_growth_updated_at
BEFORE UPDATE ON public.spiritual_growth
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();