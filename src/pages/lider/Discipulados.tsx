import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Users, Calendar, Target, Plus, CheckCircle, BookOpen } from 'lucide-react';
import Navbar from '@/components/navigation/Navbar';
import { Link } from 'react-router-dom';

interface Discipulado {
  id: string;
  leader_id: string;
  disciple_id: string;
  start_date: string;
  disciple: {
    id: string;
    full_name: string;
  };
}

interface DiscipleshipPlan {
  id: string;
  title: string;
  description: string;
  steps_count: number;
}

interface PlanProgress {
  id: string;
  user_id: string;
  plan_id: string;
  current_step: number;
  plan: DiscipleshipPlan;
  status: 'nao_iniciado' | 'em_progresso' | 'concluido' | 'arquivado' | 'removido';
}

const LiderDiscipulados = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [discipulados, setDiscipulados] = useState<Discipulado[]>([]);
  const [discipleshipPlans, setDiscipleshipPlans] = useState<DiscipleshipPlan[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [disciplesWithProgress, setDisciplesWithProgress] = useState<any[]>([]);

  const [assignPlanForm, setAssignPlanForm] = useState({
    disciple_id: '',
    plan_id: '',
  });

  useEffect(() => {
    if (profile?.id) {
      fetchData();
    }
  }, [profile?.id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch discipleships for the current leader
      const { data: discipuladosData, error: discipuladosError } = await supabase
        .from('discipulados')
        .select(`
          id,
          leader_id,
          disciple_id,
          start_date,
          disciple:profiles(id, full_name)
        `)
        .eq('leader_id', profile?.id)
        .eq('active', true);

      if (discipuladosError) throw discipuladosError;
      setDiscipulados(discipuladosData as Discipulado[]);

      // Fetch all available discipleship plans
      const { data: plansData, error: plansError } = await supabase
        .from('plans')
        .select('id, title, description, steps_count')
        .eq('church_id', profile?.church_id);

      if (plansError) throw plansError;
      setDiscipleshipPlans(plansData as DiscipleshipPlan[]);
      
      // Fetch progress for each disciple
      if (discipuladosData) {
        const disciplesProgress = await Promise.all(
          discipuladosData.map(async (discipulado) => {
            const { data: progress, error: progressError } = await supabase
              .from('plan_progress')
              .select(`
                *,
                plan:plans(id, title, description, steps_count)
              `)
              .eq('user_id', discipulado.disciple_id)
              .eq('status', 'em_progresso'); // Apenas planos em progresso
              
            if (progressError) {
              console.error(`Erro ao buscar progresso para o discípulo ${discipulado.disciple.full_name}:`, progressError);
            }

            return {
              ...discipulado,
              plans_progress: progress || [],
            };
          })
        );
        setDisciplesWithProgress(disciplesProgress);
      }

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Verificação para garantir que o formulário não está vazio
      if (!assignPlanForm.disciple_id || !assignPlanForm.plan_id) {
          console.error("Discípulo e Plano são obrigatórios.");
          // TODO: Adicionar um toast de erro para feedback ao usuário
          return;
      }
      
      const { error } = await supabase.from('plan_progress').insert([
        {
          user_id: assignPlanForm.disciple_id,
          plan_id: assignPlanForm.plan_id,
          started_at: new Date().toISOString(),
          status: 'em_progresso',
          current_step: 0,
        },
      ]);
      
      if (error) throw error;
      console.log('Plano atribuído com sucesso!');
      setIsDialogOpen(false);
      setAssignPlanForm({ disciple_id: '', plan_id: '' });
      fetchData(); // Recarregar os dados para atualizar a lista
      // TODO: Adicionar um toast de sucesso aqui
    } catch (error) {
      console.error('Erro ao atribuir plano:', error);
      // TODO: Adicionar um toast de erro aqui
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <Navbar />
      <div className="container mx-auto p-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Discipulados
            </h1>
            <p className="text-muted-foreground mt-2">
              Acompanhe o crescimento espiritual dos seus discípulos
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Atribuir Plano
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Atribuir Plano de Discipulado</DialogTitle>
                <DialogDescription>
                  Selecione um discípulo e um plano para iniciar a jornada.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAssignPlan} className="space-y-4">
                <div>
                  <Label htmlFor="disciple_id">Discípulo</Label>
                  <Select
                    value={assignPlanForm.disciple_id}
                    onValueChange={(value) => setAssignPlanForm({ ...assignPlanForm, disciple_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um discípulo" />
                    </SelectTrigger>
                    <SelectContent>
                      {discipulados.map((d) => (
                        <SelectItem key={d.disciple.id} value={d.disciple.id}>
                          {d.disciple.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="plan_id">Plano de Discipulado</Label>
                  <Select
                    value={assignPlanForm.plan_id}
                    onValueChange={(value) => setAssignPlanForm({ ...assignPlanForm, plan_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um plano" />
                    </SelectTrigger>
                    <SelectContent>
                      {discipleshipPlans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full">
                  Atribuir Plano
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Progresso dos Discípulos</CardTitle>
            <CardDescription>
              Acompanhe os planos de discipulado de cada um
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Carregando progresso...
              </div>
            ) : disciplesWithProgress.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum discípulo ativo para acompanhar.
              </div>
            ) : (
              <div className="space-y-4">
                {disciplesWithProgress.map((disciple) => (
                  <div key={disciple.id} className="border rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-2">{disciple.disciple.full_name}</h3>
                    {disciple.plans_progress.length > 0 ? (
                      <div className="space-y-3">
                        {disciple.plans_progress.map((progress: PlanProgress) => (
                          <div key={progress.id}>
                            <p className="text-sm font-medium">{progress.plan.title}</p>
                            <Progress value={(progress.current_step / progress.plan.steps_count) * 100} className="mt-1" />
                            <p className="text-xs text-muted-foreground mt-1">
                              Etapa {progress.current_step} de {progress.plan.steps_count}
                            </p>
                            <Link to={`/plano/${progress.plan.id}`}>
                                <Button size="sm" variant="outline" className="mt-2">Ver Progresso</Button>
                            </Link>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Nenhum plano em progresso.</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Removendo a seção de Discípulos Ativos e Próximos Encontros para focar no novo módulo */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Registrar Novo Encontro</CardTitle>
              <CardDescription>
                Documente o encontro de discipulado realizado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="disciple">Discípulo</Label>
                    <Input
                      id="disciple"
                      placeholder="Selecione o discípulo"
                    />
                  </div>
                  <div>
                    <Label htmlFor="meeting_date">Data do Encontro</Label>
                    <Input
                      id="meeting_date"
                      type="datetime-local"
                    />
                  </div>
                  <div>
                    <Label htmlFor="topic">Tema do Encontro</Label>
                    <Input
                      id="topic"
                      placeholder="Ex: Oração, Estudo Bíblico, Aconselhamento"
                    />
                  </div>
                  <div>
                    <Label htmlFor="duration">Duração (minutos)</Label>
                    <Input
                      id="duration"
                      type="number"
                      placeholder="60"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="notes">Anotações do Encontro</Label>
                  <Textarea
                    id="notes"
                    placeholder="Resumo do que foi conversado, orações realizadas, versículos estudados..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="next_goals">Próximas Metas</Label>
                  <Textarea
                    id="next_goals"
                    placeholder="Objetivos para o próximo encontro..."
                    rows={2}
                  />
                </div>
                <Button type="submit" className="w-full">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Registrar Encontro
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LiderDiscipulados;
