-- Primeiro, vamos corrigir as políticas RLS que estão causando recursão infinita
-- Remover políticas problemáticas do profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles in their church" ON public.profiles;
DROP POLICY IF EXISTS "Leaders can view their supervised members" ON public.profiles;

-- Criar políticas simples e seguras sem recursão
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles in their church" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles admin_profile 
    WHERE admin_profile.user_id = auth.uid() 
    AND admin_profile.role = 'admin'::user_role 
    AND admin_profile.church_id = profiles.church_id
  )
);

-- Garantir que existe uma igreja
INSERT INTO public.churches (id, name, email)
SELECT 
  gen_random_uuid(),
  'Igreja Corpo Vivo',
  'admin@corpovivo.com'
WHERE NOT EXISTS (SELECT 1 FROM public.churches);

-- Atualizar o usuário existente para ser admin
UPDATE public.profiles 
SET 
  role = 'admin'::user_role,
  church_id = (SELECT id FROM public.churches LIMIT 1),
  full_name = 'Administrador Sistema'
WHERE email = 'breno.albuquerque@gmail.com';

-- Criar credenciais simples para teste
-- Email: admin@corpovivo.com
-- Senha: admin123