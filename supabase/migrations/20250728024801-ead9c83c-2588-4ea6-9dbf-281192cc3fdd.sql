-- Atualizar políticas RLS para hierarquia completa Pastor > Missionário > Líder > Discípulo

-- Política mais específica para perfis - hierarquia supervisionada
DROP POLICY IF EXISTS "Supervisors can view their supervised members" ON public.profiles;

CREATE POLICY "Hierarchical supervision access" ON public.profiles
FOR SELECT USING (
  -- Usuário pode ver seu próprio perfil
  auth.uid() = user_id
  OR
  -- Admins podem ver todos os perfis da sua igreja
  (get_user_role(auth.uid()) = 'admin'::user_role AND church_id = get_user_church(auth.uid()))
  OR
  -- Pastores podem ver todos da sua igreja
  (get_user_role(auth.uid()) = 'pastor'::user_role AND church_id = get_user_church(auth.uid()))
  OR
  -- Missionários podem ver seus supervisionados e supervisionados dos supervisionados
  (get_user_role(auth.uid()) = 'missionario'::user_role AND 
   (supervisor_id = (SELECT id FROM profiles WHERE user_id = auth.uid()) OR
    supervisor_id IN (SELECT id FROM profiles WHERE supervisor_id = (SELECT id FROM profiles WHERE user_id = auth.uid()))))
  OR
  -- Líderes podem ver seus discípulos diretos
  (get_user_role(auth.uid()) = 'lider'::user_role AND 
   supervisor_id = (SELECT id FROM profiles WHERE user_id = auth.uid()))
);

-- Política para group_members permitir inserção/atualização por líderes
DROP POLICY IF EXISTS "Users can view group members in their church" ON public.group_members;

CREATE POLICY "Users can view group members in their church" ON public.group_members
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM house_groups hg 
    WHERE hg.id = group_members.group_id 
    AND hg.church_id = get_user_church(auth.uid())
  )
);

CREATE POLICY "Leaders can manage group members" ON public.group_members
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM house_groups hg 
    WHERE hg.id = group_members.group_id 
    AND hg.church_id = get_user_church(auth.uid())
    AND (
      get_user_role(auth.uid()) = ANY(ARRAY['admin'::user_role, 'pastor'::user_role, 'missionario'::user_role, 'lider'::user_role])
      OR hg.leader_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  )
);

-- Criar tabela para eventos da igreja
CREATE TABLE IF NOT EXISTS public.events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  church_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  event_date timestamp with time zone NOT NULL,
  location text,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  is_recurring boolean NOT NULL DEFAULT false,
  recurrence_pattern text
);

-- RLS para eventos
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view events in their church" ON public.events
FOR SELECT USING (church_id = get_user_church(auth.uid()));

CREATE POLICY "Leaders can manage events in their church" ON public.events
FOR ALL USING (
  church_id = get_user_church(auth.uid()) 
  AND get_user_role(auth.uid()) = ANY(ARRAY['admin'::user_role, 'pastor'::user_role, 'missionario'::user_role, 'lider'::user_role])
);

-- Trigger para updated_at em events
CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Criar tabela para visitantes dos grupos
CREATE TABLE IF NOT EXISTS public.group_visitors (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id uuid NOT NULL,
  meeting_id uuid,
  visitor_name text NOT NULL,
  visitor_phone text,
  visitor_email text,
  notes text,
  follow_up_done boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- RLS para visitantes
ALTER TABLE public.group_visitors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view visitors in their church groups" ON public.group_visitors
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM house_groups hg 
    WHERE hg.id = group_visitors.group_id 
    AND hg.church_id = get_user_church(auth.uid())
  )
);

CREATE POLICY "Leaders can manage visitors in their groups" ON public.group_visitors
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM house_groups hg 
    WHERE hg.id = group_visitors.group_id 
    AND hg.church_id = get_user_church(auth.uid())
    AND (
      get_user_role(auth.uid()) = ANY(ARRAY['admin'::user_role, 'pastor'::user_role, 'missionario'::user_role])
      OR hg.leader_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  )
);

-- Criar tabela para integração com WhatsApp
CREATE TABLE IF NOT EXISTS public.whatsapp_integration (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  church_id uuid NOT NULL,
  api_token_encrypted text,
  phone_number text,
  enabled boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- RLS para WhatsApp
ALTER TABLE public.whatsapp_integration ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage WhatsApp integration" ON public.whatsapp_integration
FOR ALL USING (
  church_id = get_user_church(auth.uid()) 
  AND get_user_role(auth.uid()) = ANY(ARRAY['admin'::user_role, 'pastor'::user_role])
);

-- Trigger para updated_at em whatsapp_integration
CREATE TRIGGER update_whatsapp_integration_updated_at
BEFORE UPDATE ON public.whatsapp_integration
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();