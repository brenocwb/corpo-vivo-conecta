-- Atualizar usuário existente para ser administrador
UPDATE public.profiles 
SET 
  role = 'admin',
  church_id = (SELECT id FROM public.churches LIMIT 1)
WHERE email = 'breno.albuquerque@gmail.com';