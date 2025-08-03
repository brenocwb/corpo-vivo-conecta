-- Corrigir definitivamente o problema de recursão infinita
-- Remover TODAS as políticas da tabela profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;  
DROP POLICY IF EXISTS "Admins can view all profiles in their church" ON public.profiles;
DROP POLICY IF EXISTS "Leaders can view their supervised members" ON public.profiles;

-- Criar políticas simples sem recursão
CREATE POLICY "allow_select_own_profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "allow_update_own_profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Garantir que o usuário atual tem um perfil completo
INSERT INTO public.profiles (user_id, full_name, email, role, church_id)
SELECT 
  '6975cd48-3b50-48aa-bd12-122252daca59'::uuid,
  'Breno Andrade',
  'breno.albuquerque@gmail.com',
  'admin'::user_role,
  (SELECT id FROM public.churches LIMIT 1)
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = '6975cd48-3b50-48aa-bd12-122252daca59'::uuid
);

-- Atualizar perfil existente se já existe
UPDATE public.profiles 
SET 
  role = 'admin'::user_role,
  church_id = (SELECT id FROM public.churches LIMIT 1),
  full_name = 'Breno Andrade'
WHERE user_id = '6975cd48-3b50-48aa-bd12-122252daca59'::uuid;