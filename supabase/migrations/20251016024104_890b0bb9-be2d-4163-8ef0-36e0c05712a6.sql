-- Políticas RLS para plan_steps permitindo admins/pastores gerenciarem etapas
CREATE POLICY "Admins can manage plan steps in their church"
ON plan_steps
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM plans p
    WHERE p.id = plan_steps.plan_id
    AND p.church_id = get_user_church(auth.uid())
    AND get_user_role(auth.uid()) IN ('admin', 'pastor')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM plans p
    WHERE p.id = plan_steps.plan_id
    AND p.church_id = get_user_church(auth.uid())
    AND get_user_role(auth.uid()) IN ('admin', 'pastor')
  )
);

-- Garantir que a política de SELECT já existente permite ver etapas
DROP POLICY IF EXISTS "Users can view plan steps in their church" ON plan_steps;

CREATE POLICY "Users can view plan steps in their church"
ON plan_steps
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM plans p
    WHERE p.id = plan_steps.plan_id
    AND (p.church_id = get_user_church(auth.uid()) OR p.is_public = true)
  )
);