-- Create plans table
CREATE TABLE IF NOT EXISTS public.plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  plan_type TEXT NOT NULL DEFAULT 'texto',
  is_public BOOLEAN NOT NULL DEFAULT false,
  church_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create plan_steps table
CREATE TABLE IF NOT EXISTS public.plan_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL,
  step_order INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create plan_progress table if not exists
CREATE TABLE IF NOT EXISTS public.plan_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plan_id UUID NOT NULL,
  current_step INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'nao_iniciado',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_steps ENABLE ROW LEVEL SECURITY;

-- Create policies for plans
CREATE POLICY "Admins can manage plans in their church" 
ON public.plans 
FOR ALL 
USING ((church_id = get_user_church(auth.uid())) AND (get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'pastor'::user_role])));

CREATE POLICY "Users can view public plans or plans from their church" 
ON public.plans 
FOR SELECT 
USING ((is_public = true) OR (church_id = get_user_church(auth.uid())));

-- Create policies for plan_steps
CREATE POLICY "Admins can manage plan steps in their church" 
ON public.plan_steps 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM plans p 
  WHERE p.id = plan_steps.plan_id 
    AND p.church_id = get_user_church(auth.uid()) 
    AND get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'pastor'::user_role])
));

CREATE POLICY "Users can view plan steps in their church" 
ON public.plan_steps 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM plans p 
  WHERE p.id = plan_steps.plan_id 
    AND (p.is_public = true OR p.church_id = get_user_church(auth.uid()))
));

-- Add triggers for updated_at
CREATE TRIGGER update_plans_updated_at
BEFORE UPDATE ON public.plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_plan_steps_updated_at
BEFORE UPDATE ON public.plan_steps
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_plan_progress_updated_at
BEFORE UPDATE ON public.plan_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();