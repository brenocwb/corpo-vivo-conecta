import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, CheckCircle, ArrowLeft } from 'lucide-react';
import Navbar from '@/components/navigation/Navbar';

interface Plan {
  id: string;
  title: string;
  description: string;
  steps_count: number;
}

interface Step {
  id: string;
  step_order: number;
  title: string;
  description: string;
  content: string;
}

const MembroPlanoDetalhe = () => {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [planProgress, setPlanProgress] = useState<any>(null);

  useEffect(() => {
    if (planId && profile?.id) {
      fetchPlanData();
    }
  }, [planId, profile?.id]);

  const fetchPlanData = async () => {
    setLoading(true);
    try {
      // Fetch plan and steps
      const { data: planData, error: planError } = await supabase
        .from('plans')
        .select(`
          *,
          steps_count:plan_steps(count)
        `)
        .eq('id', planId)
        .maybeSingle();

      if (planError) throw planError;
      if (!planData) {
        console.error("Plano não encontrado.");
        setLoading(false);
        return;
      }
      setPlan(planData as unknown as Plan);
      
      const { data: stepsData, error: stepsError } = await supabase
        .from('plan_steps')
        .select('*')
        .eq('plan_id', planId)
        .order('step_order');
      
      if (stepsError) throw stepsError;
      setSteps(stepsData || []);

      // Fetch user's progress for this plan
      const { data: progressData, error: progressError } = await supabase
        .from('plan_progress')
        .select('*')
        .eq('user_id', profile?.id)
        .eq('plan_id', planId)
        .maybeSingle();

      if (progressError) throw progressError;
      setPlanProgress(progressData);

    } catch (error) {
      console.error('Erro ao carregar dados do plano:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o plano de discipulado.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleCompleteStep = async (stepOrder: number) => {
      if (!planProgress) return;
  
      try {
        const newStep = stepOrder + 1;
        const { error } = await supabase
          .from('plan_progress')
          .update({
            current_step: newStep,
            status: newStep > steps.length ? 'concluido' : 'em_progresso',
            completed_at: newStep > steps.length ? new Date().toISOString() : null,
          })
          .eq('id', planProgress.id);
  
        if (error) throw error;
  
        toast({
          title: "Etapa concluída!",
          description: `Você avançou para a etapa ${newStep}.`,
        });
        fetchPlanData();
      } catch (error) {
        console.error('Erro ao atualizar progresso:', error);
        toast({
          title: "Erro",
          description: "Não foi possível concluir a etapa.",
          variant: "destructive",
        });
      }
    };
    
    if (loading) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Carregando plano...</p>
          </div>
        </div>
      );
    }
    
    if (!plan) {
        return (
          <div className="min-h-screen bg-background">
            <Navbar />
            <div className="max-w-4xl mx-auto p-6 text-center">
              <h1 className="text-3xl font-bold">Plano não Encontrado</h1>
              <p className="text-muted-foreground mt-2">
                O plano de discipulado que você está procurando não existe ou não está acessível.
              </p>
              <Button onClick={() => navigate(-1)} className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            </div>
          </div>
        );
    }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex items-center space-x-4 mb-6">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{plan.title}</h1>
            <p className="text-muted-foreground">{plan.description}</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Seu Progresso</CardTitle>
            <CardDescription>
              {planProgress?.status === 'concluido' ? 'Plano concluído!' : `Você está na etapa ${planProgress?.current_step || 0} de ${plan?.steps_count}.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={((planProgress?.current_step || 0) / plan?.steps_count) * 100} className="mt-2" />
          </CardContent>
        </Card>

        <div className="grid gap-4">
          {steps.map((step) => (
            <Card key={step.id}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  Etapa {step.step_order}: {step.title}
                  {step.step_order <= (planProgress?.current_step || 0) && (
                    <CheckCircle className="ml-2 h-5 w-5 text-green-500" />
                  )}
                </CardTitle>
                <CardDescription>{step.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="prose prose-sm max-w-none">
                  <p>{step.content}</p>
                </div>
                {step.step_order === (planProgress?.current_step || 0) + 1 && (
                  <Button onClick={() => handleCompleteStep(step.step_order)}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Concluir Etapa
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

      </div>
    </div>
  );
};

export default MembroPlanoDetalhe;
