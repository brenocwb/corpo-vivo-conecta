-- Corrigir search_path nas funções para resolver warnings de segurança
CREATE OR REPLACE FUNCTION generate_pastoral_alerts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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

  -- Alert para novo convertido (conversão recente)
  INSERT INTO public.alerts (type, title, message, target_user_id, related_member_id)
  SELECT 
    'novo_convertido',
    'Novo Convertido',
    'Novo convertido ' || p.full_name || ' precisa de acompanhamento especial',
    admin_profile.id,
    p.id
  FROM public.profiles p
  JOIN public.profiles admin_profile ON admin_profile.church_id = p.church_id AND admin_profile.role = 'admin'
  WHERE p.conversion_date > NOW() - INTERVAL '30 days'
    AND NOT EXISTS (
      SELECT 1 FROM public.alerts a
      WHERE a.type = 'novo_convertido'
        AND a.related_member_id = p.id
        AND a.created_at > NOW() - INTERVAL '7 days'
    );

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION check_and_generate_alerts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  PERFORM public.generate_pastoral_alerts();
END;
$$;