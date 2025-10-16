import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, CheckCircle, ArrowLeft, ChevronLeft, ChevronRight, Award } from 'lucide-react';
import Navbar from '@/components/navigation/Navbar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

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

  const currentStepData = steps.find(s => s.step_order === (planProgress?.current_step || 0) + 1);
  const nextStepData = steps.find(s => s.step_order === (planProgress?.current_step || 0) + 2);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{plan.title}</h1>
            <p className="text-muted-foreground">{plan.description}</p>
          </div>
          {planProgress?.status === 'concluido' && (
            <Badge className="bg-green-500 hover:bg-green-600">
              <Award className="h-4 w-4 mr-1" />
              Concluído
            </Badge>
          )}
        </div>

        {/* Progress Card */}
        <Card className="border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle>Seu Progresso</CardTitle>
            <CardDescription>
              {planProgress?.status === 'concluido' 
                ? '🎉 Parabéns! Você concluiu este plano!' 
                : `Você está na etapa ${planProgress?.current_step || 0} de ${plan?.steps_count}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Progress 
                value={((planProgress?.current_step || 0) / (plan?.steps_count || 1)) * 100} 
                className="h-3"
              />
              <p className="text-sm text-muted-foreground text-right">
                {Math.round(((planProgress?.current_step || 0) / (plan?.steps_count || 1)) * 100)}% completo
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Current Step Focus */}
        {currentStepData && planProgress?.status !== 'concluido' && (
          <Card className="border-2 border-primary">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <Badge variant="default" className="mb-2">Etapa Atual</Badge>
                  <CardTitle className="text-2xl">
                    {currentStepData.step_order}. {currentStepData.title}
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {currentStepData.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="prose prose-sm max-w-none bg-muted p-4 rounded-lg">
                <p className="whitespace-pre-wrap">{currentStepData.content}</p>
              </div>
              
              <div className="flex justify-between items-center pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  {nextStepData && (
                    <p>Próxima: <span className="font-medium">{nextStepData.title}</span></p>
                  )}
                </div>
                <Button 
                  onClick={() => handleCompleteStep(currentStepData.step_order)}
                  size="lg"
                >
                  <CheckCircle className="mr-2 h-5 w-5" />
                  Concluir Etapa
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* All Steps */}
        <Card>
          <CardHeader>
            <CardTitle>Todas as Etapas</CardTitle>
            <CardDescription>
              Navegue por todas as etapas do plano
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {steps.map((step) => {
                const isCompleted = step.step_order <= (planProgress?.current_step || 0);
                const isCurrent = step.step_order === (planProgress?.current_step || 0) + 1;
                
                return (
                  <div
                    key={step.id}
                    className={`p-4 border rounded-lg transition-all ${
                      isCurrent 
                        ? 'border-primary bg-primary/5' 
                        : isCompleted 
                        ? 'border-green-500/50 bg-green-500/5'
                        : 'border-border'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        isCompleted 
                          ? 'bg-green-500 text-white' 
                          : isCurrent
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          <span className="font-semibold">{step.step_order}</span>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{step.title}</h3>
                          {isCurrent && <Badge variant="default">Atual</Badge>}
                          {isCompleted && <Badge variant="secondary" className="bg-green-500/10 text-green-700 dark:text-green-400">Concluída</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">{step.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default MembroPlanoDetalhe;
