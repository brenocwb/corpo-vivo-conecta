-- Criar enum para prioridades de alertas
CREATE TYPE alert_priority AS ENUM ('baixa', 'media', 'alta', 'urgente');

-- Adicionar coluna priority na tabela alerts
ALTER TABLE public.alerts 
ADD COLUMN priority alert_priority NOT NULL DEFAULT 'media';

-- Criar índice para consultas por prioridade
CREATE INDEX idx_alerts_priority ON public.alerts(priority) WHERE read = false;

-- Criar tabela de follow-ups/agendamentos
CREATE TABLE public.alert_follow_ups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id uuid NOT NULL REFERENCES public.alerts(id) ON DELETE CASCADE,
  scheduled_for timestamp with time zone NOT NULL,
  notes text,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamp with time zone,
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela de follow-ups
ALTER TABLE public.alert_follow_ups ENABLE ROW LEVEL SECURITY;

-- Policies para alert_follow_ups
CREATE POLICY "Users can view follow-ups for their alerts"
ON public.alert_follow_ups
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.alerts a
    WHERE a.id = alert_follow_ups.alert_id
    AND a.target_user_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  )
);

CREATE POLICY "Users can create follow-ups for their alerts"
ON public.alert_follow_ups
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.alerts a
    WHERE a.id = alert_follow_ups.alert_id
    AND a.target_user_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  )
  AND created_by = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can update their own follow-ups"
ON public.alert_follow_ups
FOR UPDATE
USING (created_by = (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Trigger para updated_at
CREATE TRIGGER update_alert_follow_ups_updated_at
BEFORE UPDATE ON public.alert_follow_ups
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Atualizar função generate_pastoral_alerts para incluir prioridades
DROP FUNCTION IF EXISTS public.generate_pastoral_alerts();

CREATE OR REPLACE FUNCTION public.generate_pastoral_alerts()
RETURNS TABLE(alert_type text, count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_discipulo_ausente_count bigint := 0;
  v_novo_convertido_count bigint := 0;
  v_sem_grupo_count bigint := 0;
  v_sem_presenca_count bigint := 0;
BEGIN
  -- Alert para discípulo ausente (mais de 2 semanas sem reunião) - PRIORIDADE ALTA
  WITH discipulos_ausentes AS (
    SELECT 
      d.leader_id,
      d.disciple_id,
      p.full_name as disciple_name,
      leader_profile.id as leader_profile_id
    FROM public.discipulados d
    INNER JOIN public.profiles p ON p.id = d.disciple_id
    INNER JOIN public.profiles leader_profile ON leader_profile.id = d.leader_id
    WHERE d.active = true
      AND NOT EXISTS (
        SELECT 1 FROM public.encontros e 
        WHERE e.discipulado_id = d.id 
          AND e.meeting_date > NOW() - INTERVAL '14 days'
      )
      AND NOT EXISTS (
        SELECT 1 FROM public.alerts a
        WHERE a.type = 'discipulo_ausente'
          AND a.related_member_id = p.id
          AND a.created_at > NOW() - INTERVAL '7 days'
      )
  )
  INSERT INTO public.alerts (type, title, message, target_user_id, related_member_id, priority)
  SELECT 
    'discipulo_ausente',
    'Discípulo Ausente',
    'Discípulo ' || disciple_name || ' não tem encontros há mais de 2 semanas',
    leader_profile_id,
    disciple_id,
    'alta'::alert_priority
  FROM discipulos_ausentes;
  
  GET DIAGNOSTICS v_discipulo_ausente_count = ROW_COUNT;

  -- Alert para novo convertido (conversão recente) - PRIORIDADE URGENTE
  WITH novos_convertidos AS (
    SELECT DISTINCT
      p.id as member_id,
      p.full_name,
      admin_profile.id as admin_profile_id
    FROM public.profiles p
    INNER JOIN public.profiles admin_profile ON admin_profile.church_id = p.church_id
    INNER JOIN public.user_roles ur ON ur.user_id = admin_profile.user_id
    WHERE p.conversion_date > NOW() - INTERVAL '30 days'
      AND ur.role IN ('admin', 'pastor')
      AND NOT EXISTS (
        SELECT 1 FROM public.alerts a
        WHERE a.type = 'novo_convertido'
          AND a.related_member_id = p.id
          AND a.target_user_id = admin_profile.id
          AND a.created_at > NOW() - INTERVAL '7 days'
      )
  )
  INSERT INTO public.alerts (type, title, message, target_user_id, related_member_id, priority)
  SELECT 
    'novo_convertido',
    'Novo Convertido',
    'Novo convertido ' || full_name || ' precisa de acompanhamento especial',
    admin_profile_id,
    member_id,
    'urgente'::alert_priority
  FROM novos_convertidos;
  
  GET DIAGNOSTICS v_novo_convertido_count = ROW_COUNT;

  -- Alert para membros sem grupo familiar - PRIORIDADE MEDIA
  WITH membros_sem_grupo AS (
    SELECT DISTINCT
      p.id as member_id,
      p.full_name,
      admin_profile.id as admin_profile_id
    FROM public.profiles p
    INNER JOIN public.profiles admin_profile ON admin_profile.church_id = p.church_id
    INNER JOIN public.user_roles ur ON ur.user_id = admin_profile.user_id
    WHERE NOT EXISTS (
        SELECT 1 FROM public.group_members gm
        WHERE gm.member_id = p.id AND gm.active = true
      )
      AND ur.role IN ('admin', 'pastor', 'lider')
      AND NOT EXISTS (
        SELECT 1 FROM public.alerts a
        WHERE a.type = 'sem_grupo'
          AND a.related_member_id = p.id
          AND a.target_user_id = admin_profile.id
          AND a.created_at > NOW() - INTERVAL '14 days'
      )
  )
  INSERT INTO public.alerts (type, title, message, target_user_id, related_member_id, priority)
  SELECT 
    'sem_grupo',
    'Membro sem Grupo Familiar',
    'Membro ' || full_name || ' não está em nenhum grupo familiar',
    admin_profile_id,
    member_id,
    'media'::alert_priority
  FROM membros_sem_grupo;
  
  GET DIAGNOSTICS v_sem_grupo_count = ROW_COUNT;

  -- Alert para reuniões de grupo sem registro de presença - PRIORIDADE BAIXA
  WITH reunioes_sem_presenca AS (
    SELECT DISTINCT
      hg.id as group_id,
      hg.name as group_name,
      gm.meeting_date,
      leader_profile.id as leader_profile_id
    FROM public.group_meetings gm
    INNER JOIN public.house_groups hg ON hg.id = gm.group_id
    INNER JOIN public.profiles leader_profile ON leader_profile.id = hg.leader_id
    WHERE gm.meeting_date < NOW() - INTERVAL '2 days'
      AND gm.meeting_date > NOW() - INTERVAL '30 days'
      AND NOT EXISTS (
        SELECT 1 FROM public.meeting_attendance ma
        WHERE ma.meeting_id = gm.id
      )
      AND NOT EXISTS (
        SELECT 1 FROM public.alerts a
        WHERE a.type = 'sem_presenca'
          AND a.related_group_id = hg.id
          AND a.created_at > NOW() - INTERVAL '7 days'
      )
  )
  INSERT INTO public.alerts (type, title, message, target_user_id, related_group_id, priority)
  SELECT 
    'sem_presenca',
    'Reunião sem Registro de Presença',
    'Reunião do grupo ' || group_name || ' em ' || TO_CHAR(meeting_date, 'DD/MM/YYYY') || ' não tem registro de presença',
    leader_profile_id,
    group_id,
    'baixa'::alert_priority
  FROM reunioes_sem_presenca;
  
  GET DIAGNOSTICS v_sem_presenca_count = ROW_COUNT;

  -- Retornar métricas
  RETURN QUERY SELECT 'discipulo_ausente'::text, v_discipulo_ausente_count;
  RETURN QUERY SELECT 'novo_convertido'::text, v_novo_convertido_count;
  RETURN QUERY SELECT 'sem_grupo'::text, v_sem_grupo_count;
  RETURN QUERY SELECT 'sem_presenca'::text, v_sem_presenca_count;
END;
$function$;