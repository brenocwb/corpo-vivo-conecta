-- Verificar se já existe uma igreja, se não criar uma
INSERT INTO public.churches (id, name, email, admin_id)
SELECT 
  gen_random_uuid(),
  'Igreja Principal',
  'admin@corpovivoconecta.com',
  NULL
WHERE NOT EXISTS (SELECT 1 FROM public.churches);

-- Criar usuário administrador direto na tabela profiles
-- Assumindo que o usuário já existe no auth.users, vamos apenas atualizar o perfil
UPDATE public.profiles 
SET 
  role = 'admin'::user_role,
  church_id = (SELECT id FROM public.churches LIMIT 1)
WHERE email = 'breno.albuquerque@gmail.com';

-- Se não existir, criar o perfil
INSERT INTO public.profiles (
  user_id,
  full_name,
  email,
  role,
  church_id
)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', 'Breno Albuquerque'),
  'breno.albuquerque@gmail.com',
  'admin'::user_role,
  (SELECT id FROM public.churches LIMIT 1)
FROM auth.users u
WHERE u.email = 'breno.albuquerque@gmail.com'
AND NOT EXISTS (
  SELECT 1 FROM public.profiles p 
  WHERE p.user_id = u.id
);