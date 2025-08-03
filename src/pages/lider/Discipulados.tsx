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
import { Users, Calendar, Target, Plus, CheckCircle, BookOpen, Clock, ListOrdered, Link as LinkIcon, Edit, Trash2 } from 'lucide-react';
import Navbar from '@/components/navigation/Navbar';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

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

interface Encontro {
  id: string;
  meeting_date: string;
  topic: string;
  notes: string;
  next_goals: string;
}

const LiderDiscipulados = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [discipulados, setDiscipulados] = useState<Discipulado[]>([]);
  const [discipleshipPlans, setDiscipleshipPlans] = useState<DiscipleshipPlan[]>([]);
  const [disciplesWithProgress, setDisciplesWithProgress] = useState<any[]>([]);

  const [isAssignPlanDialogOpen, setIsAssignPlanDialogOpen] = useState(false);
  const [isNewMeetingDialogOpen, setIsNewMeetingDialogOpen] = useState(false);
  const [isMeetingsHistoryDialogOpen, setIsMeetingsHistoryDialogOpen] = useState(false);

  const [selectedDisciple, setSelectedDisciple] = useState<Discipulado | null>(null);
  const [meetingHistory, setMeetingHistory] = useState<Encontro[]>([]);

  const [assignPlanForm, setAssignPlanForm] = useState({
    disciple_id: '',
    plan_id: '',
  });
  
  const [newMeetingForm, setNewMeetingForm] = useState({
    discipulado_id: '',
    meeting_date: '',
    topic: '',
    duration_minutes: '',
    notes: '',
    next_goals: '',
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
      toast.error("Erro ao carregar dados de discipulados.");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!assignPlanForm.disciple_id || !assignPlanForm.plan_id) {
          toast.error("Discípulo e Plano são obrigatórios.");
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
      toast.success('Plano atribuído com sucesso!');
      setIsAssignPlanDialogOpen(false);
      setAssignPlanForm({ disciple_id: '', plan_id: '' });
      fetchData();
    } catch (error) {
      console.error('Erro ao atribuir plano:', error);
      toast.error('Erro ao atribuir plano: ' + (error as Error).message);
    }
  };

  const handleNewMeetingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!newMeetingForm.discipulado_id || !newMeetingForm.meeting_date || !newMeetingForm.topic) {
        toast.error("Discípulo, data e tema são obrigatórios.");
        return;
      }
      
      const { error } = await supabase.from('encontros').insert([
        {
          discipulado_id: newMeetingForm.discipulado_id,
          meeting_date: newMeetingForm.meeting_date,
          topic: newMeetingForm.topic,
          duration_minutes: newMeetingForm.duration_minutes ? parseInt(newMeetingForm.duration_minutes) : null,
          notes: newMeetingForm.notes,
          next_goals: newMeetingForm.next_goals,
        },
      ]);
      
      if (error) throw error;
      toast.success('Encontro registrado com sucesso!');
      setIsNewMeetingDialogOpen(false);
      setNewMeetingForm({
        discipulado_id: '',
        meeting_date: '',
        topic: '',
        duration_minutes: '',
        notes: '',
        next_goals: '',
      });
      fetchData();
    } catch (error) {
      console.error('Erro ao registrar encontro:', error);
      toast.error('Erro ao registrar encontro: ' + (error as Error).message);
    }
  };
  
  const fetchMeetingHistory = async (discipuladoId: string) => {
    try {
      const { data, error } = await supabase
        .from('encontros')
        .select('*')
        .eq('discipulado_id', discipuladoId)
        .order('meeting_date', { ascending: false });
      
      if (error) throw error;
      setMeetingHistory(data || []);
      setIsMeetingsHistoryDialogOpen(true);
    } catch (error) {
      console.error('Erro ao buscar histórico de encontros:', error);
      toast.error('Erro ao buscar histórico de encontros.');
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
          
          <div className="flex gap-2">
              <Dialog open={isAssignPlanDialogOpen} onOpenChange={setIsAssignPlanDialogOpen}>
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
              
              <Dialog open={isNewMeetingDialogOpen} onOpenChange={setIsNewMeetingDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="secondary" onClick={() => setNewMeetingForm({...newMeetingForm, discipulado_id: ''})}>
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Encontro
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Registrar Novo Encontro</DialogTitle>
                    <DialogDescription>
                      Documente um encontro de discipulado realizado.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleNewMeetingSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="discipulado_id">Discípulo</Label>
                      <Select
                        value={newMeetingForm.discipulado_id}
                        onValueChange={(value) => setNewMeetingForm({ ...newMeetingForm, discipulado_id: value })}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o discípulo" />
                        </SelectTrigger>
                        <SelectContent>
                          {discipulados.map((d) => (
                            <SelectItem key={d.id} value={d.id}>
                              {d.disciple.full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="meeting_date">Data do Encontro</Label>
                      <Input
                        id="meeting_date"
                        type="datetime-local"
                        value={newMeetingForm.meeting_date}
                        onChange={(e) => setNewMeetingForm({ ...newMeetingForm, meeting_date: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="topic">Tema do Encontro</Label>
                      <Input
                        id="topic"
                        placeholder="Ex: Oração, Estudo Bíblico, Aconselhamento"
                        value={newMeetingForm.topic}
                        onChange={(e) => setNewMeetingForm({ ...newMeetingForm, topic: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="duration_minutes">Duração (minutos)</Label>
                      <Input
                        id="duration_minutes"
                        type="number"
                        placeholder="60"
                        value={newMeetingForm.duration_minutes}
                        onChange={(e) => setNewMeetingForm({ ...newMeetingForm, duration_minutes: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="notes">Anotações do Encontro</Label>
                      <Textarea
                        id="notes"
                        placeholder="Resumo do que foi conversado, orações realizadas, versículos estudados..."
                        rows={3}
                        value={newMeetingForm.notes}
                        onChange={(e) => setNewMeetingForm({ ...newMeetingForm, notes: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="next_goals">Próximas Metas</Label>
                      <Textarea
                        id="next_goals"
                        placeholder="Objetivos para o próximo encontro..."
                        rows={2}
                        value={newMeetingForm.next_goals}
                        onChange={(e) => setNewMeetingForm({ ...newMeetingForm, next_goals: e.target.value })}
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Registrar Encontro
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
          </div>
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
                {disciplesWithProgress.map((discipulado) => (
                  <div key={discipulado.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-lg">{discipulado.disciple.full_name}</h3>
                        <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => fetchMeetingHistory(discipulado.id)}>
                                <Calendar className="mr-2 h-4 w-4" />
                                Histórico
                            </Button>
                            <Button size="sm" onClick={() => { setIsNewMeetingDialogOpen(true); setNewMeetingForm({...newMeetingForm, discipulado_id: discipulado.id}); }}>
                                <Plus className="mr-2 h-4 w-4" />
                                Encontro
                            </Button>
                        </div>
                    </div>
                    {discipulado.plans_progress.length > 0 ? (
                      <div className="space-y-3">
                        {discipulado.plans_progress.map((progress: PlanProgress) => (
                          <div key={progress.id}>
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium">{progress.plan.title}</p>
                                <Link to={`/plano/${progress.plan.id}`}>
                                    <Button size="sm" variant="outline" className="h-7 px-2">Ver Plano</Button>
                                </Link>
                            </div>
                            <Progress value={(progress.current_step / progress.plan.steps_count) * 100} className="mt-1" />
                            <p className="text-xs text-muted-foreground mt-1">
                              Etapa {progress.current_step} de {progress.plan.steps_count}
                            </p>
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
      </div>
      
      {/* Modal para Histórico de Encontros */}
      <Dialog open={isMeetingsHistoryDialogOpen} onOpenChange={setIsMeetingsHistoryDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Histórico de Encontros</DialogTitle>
            <DialogDescription>
              Todos os encontros registrados com este discípulo.
            </DialogDescription>
          </DialogHeader>
          {meetingHistory.length > 0 ? (
            <div className="space-y-4">
              {meetingHistory.map((encontro) => (
                <Card key={encontro.id}>
                  <CardHeader className="p-4 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-base">{encontro.topic}</CardTitle>
                      <CardDescription className="text-xs">
                          {new Date(encontro.meeting_date).toLocaleDateString()}
                          <span className="mx-1">·</span>
                          {new Date(encontro.meeting_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 text-sm space-y-2">
                      <p className="font-semibold">Notas:</p>
                      <p>{encontro.notes}</p>
                      <p className="font-semibold">Próximas Metas:</p>
                      <p>{encontro.next_goals}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              Nenhum encontro registrado ainda.
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LiderDiscipulados;
