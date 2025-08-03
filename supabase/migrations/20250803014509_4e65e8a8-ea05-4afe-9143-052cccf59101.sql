-- Expandir tabela profiles com campos espirituais
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS prayer_requests text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS spiritual_challenges text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS growth_milestones text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS private_notes text;

-- Criar função para gerar alertas automáticos
CREATE OR REPLACE FUNCTION generate_pastoral_alerts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Alert para discípulo ausente (mais de 2 semanas sem reunião)
  INSERT INTO alerts (type, title, message, target_user_id, related_member_id)
  SELECT 
    'discipulo_ausente',
    'Discípulo Ausente',
    'Discípulo ' || p.full_name || ' não tem encontros há mais de 2 semanas',
    leader_profile.id,
    p.id
  FROM discipulados d
  JOIN profiles p ON p.id = d.disciple_id
  JOIN profiles leader_profile ON leader_profile.id = d.leader_id
  WHERE d.active = true
    AND NOT EXISTS (
      SELECT 1 FROM encontros e 
      WHERE e.discipulado_id = d.id 
        AND e.meeting_date > NOW() - INTERVAL '14 days'
    )
    AND NOT EXISTS (
      SELECT 1 FROM alerts a
      WHERE a.type = 'discipulo_ausente'
        AND a.related_member_id = p.id
        AND a.created_at > NOW() - INTERVAL '7 days'
    );

  -- Alert para novo convertido (conversão recente)
  INSERT INTO alerts (type, title, message, target_user_id, related_member_id)
  SELECT 
    'novo_convertido',
    'Novo Convertido',
    'Novo convertido ' || p.full_name || ' precisa de acompanhamento especial',
    admin_profile.id,
    p.id
  FROM profiles p
  JOIN profiles admin_profile ON admin_profile.church_id = p.church_id AND admin_profile.role = 'admin'
  WHERE p.conversion_date > NOW() - INTERVAL '30 days'
    AND NOT EXISTS (
      SELECT 1 FROM alerts a
      WHERE a.type = 'novo_convertido'
        AND a.related_member_id = p.id
        AND a.created_at > NOW() - INTERVAL '7 days'
    );

  RETURN NEW;
END;
$$;

-- Criar trigger para executar a função diariamente (será executado em operações de insert/update)
CREATE OR REPLACE FUNCTION check_and_generate_alerts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM generate_pastoral_alerts();
END;
$$;

-- Adicionar configurações de alerta
CREATE TABLE IF NOT EXISTS alert_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid NOT NULL,
  alert_type text NOT NULL,
  criteria jsonb NOT NULL DEFAULT '{}',
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela de configurações
ALTER TABLE alert_settings ENABLE ROW LEVEL SECURITY;

-- Política para visualizar configurações da própria igreja
CREATE POLICY "Users can view alert settings in their church"
ON alert_settings
FOR SELECT
USING (church_id = get_user_church(auth.uid()));

-- Política para admins gerenciarem configurações
CREATE POLICY "Admins can manage alert settings"
ON alert_settings
FOR ALL
USING (
  church_id = get_user_church(auth.uid()) 
  AND get_user_role(auth.uid()) = 'admin'::user_role
);

-- Inserir configurações padrão de alertas
INSERT INTO alert_settings (church_id, alert_type, criteria, enabled)
SELECT 
  c.id,
  'discipulo_ausente',
  '{"weeks_absent": 2}'::jsonb,
  true
FROM churches c
WHERE NOT EXISTS (
  SELECT 1 FROM alert_settings 
  WHERE church_id = c.id AND alert_type = 'discipulo_ausente'
);

INSERT INTO alert_settings (church_id, alert_type, criteria, enabled)
SELECT 
  c.id,
  'novo_convertido',
  '{"days_since_conversion": 30}'::jsonb,
  true
FROM churches c
WHERE NOT EXISTS (
  SELECT 1 FROM alert_settings 
  WHERE church_id = c.id AND alert_type = 'novo_convertido'
);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_alert_settings_updated_at
BEFORE UPDATE ON alert_settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();