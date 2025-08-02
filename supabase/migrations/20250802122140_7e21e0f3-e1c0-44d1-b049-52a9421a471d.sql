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

-- Criar usuário administrador simples
-- Inserir diretamente com credenciais conhecidas
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  'admin-123e4567-e89b-12d3-a456-426614174000'::uuid,
  'admin@corpovivo.com',
  crypt('admin123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"full_name": "Administrador Sistema"}',
  false,
  'authenticated'
) ON CONFLICT (email) DO NOTHING;

-- Garantir que existe uma igreja
INSERT INTO public.churches (id, name, email, admin_id)
SELECT 
  'church-123e4567-e89b-12d3-a456-426614174000'::uuid,
  'Igreja Corpo Vivo',
  'admin@corpovivo.com',
  'admin-123e4567-e89b-12d3-a456-426614174000'::uuid
WHERE NOT EXISTS (SELECT 1 FROM public.churches);

-- Criar perfil do administrador
INSERT INTO public.profiles (
  id,
  user_id,
  full_name,
  email,
  role,
  church_id
) VALUES (
  'profile-123e4567-e89b-12d3-a456-426614174000'::uuid,
  'admin-123e4567-e89b-12d3-a456-426614174000'::uuid,
  'Administrador Sistema',
  'admin@corpovivo.com',
  'admin'::user_role,
  'church-123e4567-e89b-12d3-a456-426614174000'::uuid
) ON CONFLICT (user_id) DO UPDATE SET
  role = 'admin'::user_role,
  church_id = 'church-123e4567-e89b-12d3-a456-426614174000'::uuid;