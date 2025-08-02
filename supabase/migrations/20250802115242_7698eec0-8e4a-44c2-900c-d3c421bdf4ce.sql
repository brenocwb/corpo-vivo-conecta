-- Criar novo usuário administrador
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
  role
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'admin@corpovivoconecta.com',
  crypt('Admin123!', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Administrador Sistema"}',
  false,
  'authenticated'
);

-- Criar perfil do administrador
INSERT INTO public.profiles (
  user_id,
  full_name,
  email,
  role,
  church_id
) 
SELECT 
  u.id,
  'Administrador Sistema',
  'admin@corpovivoconecta.com',
  'admin'::user_role,
  (SELECT id FROM churches LIMIT 1)
FROM auth.users u 
WHERE u.email = 'admin@corpovivoconecta.com';