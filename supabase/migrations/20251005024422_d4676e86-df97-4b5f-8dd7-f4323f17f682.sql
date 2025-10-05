-- Remover a coluna role da tabela profiles (correção crítica #1)
-- Esta coluna está duplicada e causa inconsistências com a tabela user_roles

ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;

-- Adicionar índice para melhorar performance das consultas de role
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);

-- Criar função de segurança para validar mudanças de role
-- Previne que usuários não-admin modifiquem roles ou que roles inválidos sejam atribuídos
CREATE OR REPLACE FUNCTION public.validate_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  requester_role user_role;
  target_church_id uuid;
  requester_church_id uuid;
BEGIN
  -- Obter role do usuário que está fazendo a mudança
  SELECT role INTO requester_role
  FROM public.user_roles
  WHERE user_id = auth.uid()
  ORDER BY CASE role
    WHEN 'admin' THEN 1
    WHEN 'pastor' THEN 2
    WHEN 'missionario' THEN 3
    WHEN 'lider' THEN 4
    WHEN 'membro' THEN 5
  END
  LIMIT 1;

  -- Apenas admins podem modificar roles
  IF requester_role IS NULL OR requester_role != 'admin' THEN
    RAISE EXCEPTION 'Apenas administradores podem modificar roles de usuários';
  END IF;

  -- Validar que ambos os usuários são da mesma igreja
  SELECT church_id INTO requester_church_id
  FROM public.profiles
  WHERE user_id = auth.uid();

  SELECT church_id INTO target_church_id
  FROM public.profiles
  WHERE user_id = NEW.user_id;

  IF requester_church_id IS NULL OR target_church_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não possui igreja associada';
  END IF;

  IF requester_church_id != target_church_id THEN
    RAISE EXCEPTION 'Não é permitido modificar roles de usuários de outras igrejas';
  END IF;

  RETURN NEW;
END;
$$;

-- Adicionar trigger para validar mudanças de role (correção crítica #3)
DROP TRIGGER IF EXISTS validate_role_change_trigger ON public.user_roles;
CREATE TRIGGER validate_role_change_trigger
  BEFORE INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_role_change();