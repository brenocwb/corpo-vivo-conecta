-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('admin', 'lider', 'membro');

-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'membro',
  church_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create churches table
CREATE TABLE public.churches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  admin_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add foreign key to profiles after churches table is created
ALTER TABLE public.profiles ADD CONSTRAINT fk_profiles_church 
  FOREIGN KEY (church_id) REFERENCES public.churches(id);

-- Create house_groups table (grupos familiares)
CREATE TABLE public.house_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  meeting_day INTEGER NOT NULL CHECK (meeting_day >= 0 AND meeting_day <= 6), -- 0=Sunday, 6=Saturday
  meeting_time TIME NOT NULL,
  leader_id UUID NOT NULL REFERENCES public.profiles(id),
  church_id UUID NOT NULL REFERENCES public.churches(id),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create group_members table
CREATE TABLE public.group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.house_groups(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(group_id, member_id)
);

-- Create group_meetings table (agenda e presença)
CREATE TABLE public.group_meetings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.house_groups(id) ON DELETE CASCADE,
  meeting_date DATE NOT NULL,
  theme TEXT,
  notes TEXT,
  visitors_count INTEGER DEFAULT 0,
  decisions_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, meeting_date)
);

-- Create meeting_attendance table (lista de presença)
CREATE TABLE public.meeting_attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL REFERENCES public.group_meetings(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  present BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  UNIQUE(meeting_id, member_id)
);

-- Create discipulados table (relações entre líder e discípulo)
CREATE TABLE public.discipulados (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  leader_id UUID NOT NULL REFERENCES public.profiles(id),
  disciple_id UUID NOT NULL REFERENCES public.profiles(id),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  active BOOLEAN NOT NULL DEFAULT true,
  goals TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CHECK (leader_id != disciple_id),
  UNIQUE(leader_id, disciple_id, start_date)
);

-- Create encontros table (reuniões individuais registradas)
CREATE TABLE public.encontros (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  discipulado_id UUID NOT NULL REFERENCES public.discipulados(id) ON DELETE CASCADE,
  meeting_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER,
  topic TEXT,
  notes TEXT,
  next_goals TEXT,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create estudos table (materiais bíblicos)
CREATE TABLE public.estudos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  bible_verses TEXT,
  author_id UUID REFERENCES public.profiles(id),
  church_id UUID REFERENCES public.churches(id),
  category TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create atividades table (orações, jejuns, metas, tarefas)
CREATE TYPE public.activity_type AS ENUM ('oracao', 'jejum', 'meta', 'tarefa', 'leitura_biblica');

CREATE TABLE public.atividades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type activity_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create alerts table (alertas automáticos)
CREATE TYPE public.alert_type AS ENUM ('discipulo_ausente', 'novo_convertido', 'grupo_sobrecarregado', 'encontro_atrasado');

CREATE TABLE public.alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type alert_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  target_user_id UUID NOT NULL REFERENCES public.profiles(id),
  related_group_id UUID REFERENCES public.house_groups(id),
  related_member_id UUID REFERENCES public.profiles(id),
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.churches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.house_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discipulados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encontros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estudos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atividades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Create function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID)
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.profiles WHERE user_id = user_uuid;
$$;

-- Create function to get user church
CREATE OR REPLACE FUNCTION public.get_user_church(user_uuid UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT church_id FROM public.profiles WHERE user_id = user_uuid;
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles in their church" 
ON public.profiles FOR SELECT 
USING (
  public.get_user_role(auth.uid()) = 'admin' AND 
  church_id = public.get_user_church(auth.uid())
);

-- RLS Policies for churches
CREATE POLICY "Users can view their church" 
ON public.churches FOR SELECT 
USING (id = public.get_user_church(auth.uid()));

CREATE POLICY "Admins can update their church" 
ON public.churches FOR UPDATE 
USING (
  public.get_user_role(auth.uid()) = 'admin' AND 
  id = public.get_user_church(auth.uid())
);

-- RLS Policies for house_groups
CREATE POLICY "Users can view groups in their church" 
ON public.house_groups FOR SELECT 
USING (church_id = public.get_user_church(auth.uid()));

CREATE POLICY "Leaders and admins can manage groups in their church" 
ON public.house_groups FOR ALL 
USING (
  church_id = public.get_user_church(auth.uid()) AND 
  (public.get_user_role(auth.uid()) IN ('admin', 'lider') OR leader_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
);

-- RLS Policies for group_members
CREATE POLICY "Users can view group members in their church" 
ON public.group_members FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.house_groups hg 
    WHERE hg.id = group_id AND hg.church_id = public.get_user_church(auth.uid())
  )
);

-- RLS Policies for atividades
CREATE POLICY "Users can manage their own activities" 
ON public.atividades FOR ALL 
USING (user_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- RLS Policies for alerts
CREATE POLICY "Users can view their own alerts" 
ON public.alerts FOR SELECT 
USING (target_user_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own alerts" 
ON public.alerts FOR UPDATE 
USING (target_user_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    NEW.email,
    'membro'
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_churches_updated_at BEFORE UPDATE ON public.churches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_house_groups_updated_at BEFORE UPDATE ON public.house_groups FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_group_meetings_updated_at BEFORE UPDATE ON public.group_meetings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_discipulados_updated_at BEFORE UPDATE ON public.discipulados FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_encontros_updated_at BEFORE UPDATE ON public.encontros FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_estudos_updated_at BEFORE UPDATE ON public.estudos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_atividades_updated_at BEFORE UPDATE ON public.atividades FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();