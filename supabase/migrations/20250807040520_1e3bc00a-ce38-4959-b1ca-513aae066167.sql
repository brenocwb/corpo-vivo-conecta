-- Create announcements table for Comunicados e Avisos
CREATE TABLE public.announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'geral',
  target_audience TEXT NOT NULL DEFAULT 'todos', -- 'todos', 'grupos', 'papel'
  target_audience_value TEXT, -- group_id, role name, etc
  author_id UUID NOT NULL,
  church_id UUID NOT NULL,
  is_urgent BOOLEAN NOT NULL DEFAULT false,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_announcement_status table to track reads
CREATE TABLE public.user_announcement_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  announcement_id UUID NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, announcement_id)
);

-- Enable RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_announcement_status ENABLE ROW LEVEL SECURITY;

-- Create policies for announcements
CREATE POLICY "Users can view announcements in their church"
ON public.announcements FOR SELECT
USING (church_id = get_user_church(auth.uid()));

CREATE POLICY "Leaders can create announcements in their church"
ON public.announcements FOR INSERT
WITH CHECK (
  church_id = get_user_church(auth.uid()) AND
  author_id = (SELECT id FROM profiles WHERE user_id = auth.uid()) AND
  get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'pastor'::user_role, 'lider'::user_role])
);

CREATE POLICY "Authors can update their announcements"
ON public.announcements FOR UPDATE
USING (author_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Create policies for user_announcement_status
CREATE POLICY "Users can manage their announcement status"
ON public.user_announcement_status FOR ALL
USING (user_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Add triggers for updated_at
CREATE TRIGGER update_announcements_updated_at
BEFORE UPDATE ON public.announcements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();