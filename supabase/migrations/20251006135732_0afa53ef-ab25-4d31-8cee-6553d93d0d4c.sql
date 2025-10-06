-- Corrigir recursão infinita nas políticas RLS de user_roles
-- Remover políticas antigas que causam recursão
DROP POLICY IF EXISTS "Admins can manage roles in their church" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles in their church" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Criar novas políticas usando a função security definer para evitar recursão
CREATE POLICY "Admins can manage roles in their church"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::user_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::user_role));