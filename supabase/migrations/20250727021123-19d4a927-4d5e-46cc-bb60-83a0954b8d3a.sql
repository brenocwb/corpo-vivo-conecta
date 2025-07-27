-- Atualizar enum de user_role para incluir a hierarquia completa
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'pastor';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'missionario';

-- Atualizar tabela profiles para incluir campos hierárquicos
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS supervisor_id uuid REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS birth_date date,
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS emergency_contact text,
ADD COLUMN IF NOT EXISTS emergency_phone text,
ADD COLUMN IF NOT EXISTS baptism_date date,
ADD COLUMN IF NOT EXISTS conversion_date date;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_profiles_supervisor ON public.profiles(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_profiles_church_role ON public.profiles(church_id, role);

-- Atualizar políticas RLS para incluir supervisores
DROP POLICY IF EXISTS "Supervisors can view their supervised members" ON public.profiles;
CREATE POLICY "Supervisors can view their supervised members" 
ON public.profiles 
FOR SELECT 
USING (
  supervisor_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  OR id IN (
    WITH RECURSIVE hierarchy AS (
      SELECT id, supervisor_id 
      FROM public.profiles 
      WHERE id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
      
      UNION ALL
      
      SELECT p.id, p.supervisor_id
      FROM public.profiles p
      INNER JOIN hierarchy h ON p.supervisor_id = h.id
    )
    SELECT id FROM hierarchy
  )
);

-- Criar tabela para integração com Google Calendar
CREATE TABLE IF NOT EXISTS public.google_calendar_integration (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  calendar_id text NOT NULL,
  access_token_encrypted text,
  refresh_token_encrypted text,
  token_expires_at timestamp with time zone,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.google_calendar_integration ENABLE ROW LEVEL SECURITY;

-- Políticas para Google Calendar
CREATE POLICY "Users can manage their own calendar integration" 
ON public.google_calendar_integration 
FOR ALL 
USING (user_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Trigger para updated_at
CREATE TRIGGER update_google_calendar_integration_updated_at
BEFORE UPDATE ON public.google_calendar_integration
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();