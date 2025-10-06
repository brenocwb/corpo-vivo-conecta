-- Adicionar índices para otimizar queries de alertas
CREATE INDEX IF NOT EXISTS idx_discipulados_active ON public.discipulados(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_discipulados_leader ON public.discipulados(leader_id) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_discipulados_disciple ON public.discipulados(disciple_id) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_encontros_discipulado_date ON public.encontros(discipulado_id, meeting_date);
CREATE INDEX IF NOT EXISTS idx_profiles_conversion_date ON public.profiles(conversion_date, church_id) WHERE conversion_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_group_members_active ON public.group_members(member_id, active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_group_meetings_date ON public.group_meetings(group_id, meeting_date);
CREATE INDEX IF NOT EXISTS idx_meeting_attendance_meeting ON public.meeting_attendance(meeting_id);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON public.alerts(type, related_member_id, created_at);
CREATE INDEX IF NOT EXISTS idx_house_groups_leader ON public.house_groups(leader_id, church_id, active);

-- Remover função antiga e recriar com novo tipo de retorno e queries otimizadas
DROP FUNCTION IF EXISTS public.generate_pastoral_alerts();
DROP FUNCTION IF EXISTS public.check_and_generate_alerts();

CREATE OR REPLACE FUNCTION public.generate_pastoral_alerts()
RETURNS TABLE(
  alert_type text,
  count bigint
)
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
  -- Alert para discípulo ausente (mais de 2 semanas sem reunião)
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
  INSERT INTO public.alerts (type, title, message, target_user_id, related_member_id)
  SELECT 
    'discipulo_ausente',
    'Discípulo Ausente',
    'Discípulo ' || disciple_name || ' não tem encontros há mais de 2 semanas',
    leader_profile_id,
    disciple_id
  FROM discipulos_ausentes;
  
  GET DIAGNOSTICS v_discipulo_ausente_count = ROW_COUNT;

  -- Alert para novo convertido (conversão recente)
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
  INSERT INTO public.alerts (type, title, message, target_user_id, related_member_id)
  SELECT 
    'novo_convertido',
    'Novo Convertido',
    'Novo convertido ' || full_name || ' precisa de acompanhamento especial',
    admin_profile_id,
    member_id
  FROM novos_convertidos;
  
  GET DIAGNOSTICS v_novo_convertido_count = ROW_COUNT;

  -- Alert para membros sem grupo familiar
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
  INSERT INTO public.alerts (type, title, message, target_user_id, related_member_id)
  SELECT 
    'sem_grupo',
    'Membro sem Grupo Familiar',
    'Membro ' || full_name || ' não está em nenhum grupo familiar',
    admin_profile_id,
    member_id
  FROM membros_sem_grupo;
  
  GET DIAGNOSTICS v_sem_grupo_count = ROW_COUNT;

  -- Alert para reuniões de grupo sem registro de presença
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
  INSERT INTO public.alerts (type, title, message, target_user_id, related_group_id)
  SELECT 
    'sem_presenca',
    'Reunião sem Registro de Presença',
    'Reunião do grupo ' || group_name || ' em ' || TO_CHAR(meeting_date, 'DD/MM/YYYY') || ' não tem registro de presença',
    leader_profile_id,
    group_id
  FROM reunioes_sem_presenca;
  
  GET DIAGNOSTICS v_sem_presenca_count = ROW_COUNT;

  -- Retornar métricas
  RETURN QUERY SELECT 'discipulo_ausente'::text, v_discipulo_ausente_count;
  RETURN QUERY SELECT 'novo_convertido'::text, v_novo_convertido_count;
  RETURN QUERY SELECT 'sem_grupo'::text, v_sem_grupo_count;
  RETURN QUERY SELECT 'sem_presenca'::text, v_sem_presenca_count;
END;
$function$;

-- Recriar função wrapper
CREATE OR REPLACE FUNCTION public.check_and_generate_alerts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.generate_pastoral_alerts();
END;
$function$;