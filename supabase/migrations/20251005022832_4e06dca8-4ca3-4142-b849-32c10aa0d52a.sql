-- Dropar funções antigas primeiro
DROP FUNCTION IF EXISTS public.generate_pastoral_alerts() CASCADE;
DROP FUNCTION IF EXISTS public.check_and_generate_alerts() CASCADE;

-- Criar função atualizada de alertas para usar o novo sistema de roles
CREATE OR REPLACE FUNCTION public.generate_pastoral_alerts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Alert para discípulo ausente (mais de 2 semanas sem reunião)
  INSERT INTO public.alerts (type, title, message, target_user_id, related_member_id)
  SELECT 
    'discipulo_ausente',
    'Discípulo Ausente',
    'Discípulo ' || p.full_name || ' não tem encontros há mais de 2 semanas',
    leader_profile.id,
    p.id
  FROM public.discipulados d
  JOIN public.profiles p ON p.id = d.disciple_id
  JOIN public.profiles leader_profile ON leader_profile.id = d.leader_id
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
    );

  -- Alert para novo convertido (conversão recente) - envia para admins/pastores
  INSERT INTO public.alerts (type, title, message, target_user_id, related_member_id)
  SELECT DISTINCT
    'novo_convertido',
    'Novo Convertido',
    'Novo convertido ' || p.full_name || ' precisa de acompanhamento especial',
    admin_profile.id,
    p.id
  FROM public.profiles p
  CROSS JOIN public.profiles admin_profile
  JOIN public.user_roles ur ON ur.user_id = admin_profile.user_id
  WHERE p.conversion_date > NOW() - INTERVAL '30 days'
    AND p.church_id = admin_profile.church_id
    AND ur.role IN ('admin', 'pastor')
    AND NOT EXISTS (
      SELECT 1 FROM public.alerts a
      WHERE a.type = 'novo_convertido'
        AND a.related_member_id = p.id
        AND a.target_user_id = admin_profile.id
        AND a.created_at > NOW() - INTERVAL '7 days'
    );

  -- Alert para membros sem grupo familiar
  INSERT INTO public.alerts (type, title, message, target_user_id, related_member_id)
  SELECT DISTINCT
    'sem_grupo',
    'Membro sem Grupo Familiar',
    'Membro ' || p.full_name || ' não está em nenhum grupo familiar',
    admin_profile.id,
    p.id
  FROM public.profiles p
  CROSS JOIN public.profiles admin_profile
  JOIN public.user_roles ur ON ur.user_id = admin_profile.user_id
  WHERE NOT EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.member_id = p.id AND gm.active = true
    )
    AND p.church_id = admin_profile.church_id
    AND ur.role IN ('admin', 'pastor', 'lider')
    AND NOT EXISTS (
      SELECT 1 FROM public.alerts a
      WHERE a.type = 'sem_grupo'
        AND a.related_member_id = p.id
        AND a.target_user_id = admin_profile.id
        AND a.created_at > NOW() - INTERVAL '14 days'
    );

  -- Alert para reuniões de grupo sem registro de presença
  INSERT INTO public.alerts (type, title, message, target_user_id, related_group_id)
  SELECT DISTINCT
    'sem_presenca',
    'Reunião sem Registro de Presença',
    'Reunião do grupo ' || hg.name || ' em ' || TO_CHAR(gm.meeting_date, 'DD/MM/YYYY') || ' não tem registro de presença',
    leader_profile.id,
    hg.id
  FROM public.group_meetings gm
  JOIN public.house_groups hg ON hg.id = gm.group_id
  JOIN public.profiles leader_profile ON leader_profile.id = hg.leader_id
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
    );
END;
$$;

-- Criar função wrapper para chamada via cron
CREATE OR REPLACE FUNCTION public.check_and_generate_alerts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM public.generate_pastoral_alerts();
END;
$$;