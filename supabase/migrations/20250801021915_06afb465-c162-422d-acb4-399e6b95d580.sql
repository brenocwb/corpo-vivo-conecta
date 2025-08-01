-- Criar usuário administrador para testes
-- Inserir usuário na tabela auth.users
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role,
  aud
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'breno.albuquerque@gmail.com',
  crypt('admin123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Breno Albuquerque"}',
  false,
  'authenticated',
  'authenticated'
);

-- Criar perfil do administrador
INSERT INTO public.profiles (
  user_id,
  full_name,
  email,
  role,
  church_id
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'breno.albuquerque@gmail.com'),
  'Breno Albuquerque',
  'breno.albuquerque@gmail.com',
  'admin',
  (SELECT id FROM public.churches LIMIT 1)
);