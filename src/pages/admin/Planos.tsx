import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { BookOpen, Plus, Edit, Trash2, Globe, Lock, Video, FileText, Link, ListOrdered } from 'lucide-react';
import Navbar from '@/components/navigation/Navbar';

interface Plan {
  id: string;
  title: string;
  description?: string;
  plan_type: 'texto' | 'pdf' | 'video' | 'link';
  is_public: boolean;
  created_at: string;
  steps_count: number;
}

interface PlanStep {
  id: string;
  plan_id: string;
  step_order: number;
  title: string;
  description?: string;
  content?: string;
}

const AdminPlanos = () => {
  const { profile } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);
  const [isStepsDialogOpen, setIsStepsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [selectedPlanForSteps, setSelectedPlanForSteps] = useState<Plan | null>(null);
  const [planSteps, setPlanSteps] = useState<PlanStep[]>([]);
  const [editingStep, setEditingStep] = useState<PlanStep | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    plan_type: 'texto',
    is_public: false,
    content: ''
  });

  const [stepFormData, setStepFormData] = useState({
    title: '',
    description: '',
    content: '',
  });

  const planTypeIcons = {
    texto: <FileText className="h-4 w-4" />,
    pdf: <FileText className="h-4 w-4" />,
    video: <Video className="h-4 w-4" />,
    link: <Link className="h-4 w-4" />,
  };

  useEffect(() => {
    fetchPlans();
  }, [profile?.church_id]);

  const fetchPlans = async () => {
    if (!profile?.church_id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('plans')
        .select(`
          *,
          steps_count:plan_steps(count)
        `)
        .eq('church_id', profile.church_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPlans(data as unknown as Plan[]);
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
      toast.error("Erro ao carregar planos de discipulado");
    } finally {
      setLoading(false);
    }
  };

  const fetchSteps = async (planId: string) => {
    try {
      const { data, error } = await supabase
        .from('plan_steps')
        .select('*')
        .eq('plan_id', planId)
        .order('step_order');

      if (error) throw error;
      setPlanSteps(data || []);
    } catch (error) {
      console.error('Erro ao carregar etapas:', error);
      toast.error("Erro ao carregar etapas do plano");
    }
  };

  const handleOpenStepsDialog = (plan: Plan) => {
    setSelectedPlanForSteps(plan);
    fetchSteps(plan.id);
    setIsStepsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const planData = {
        title: formData.title,
        description: formData.description || null,
        plan_type: formData.plan_type,
        content: formData.content,
        is_public: formData.is_public,
        church_id: profile?.church_id
      };

      if (editingPlan) {
        const { error } = await supabase
          .from('plans')
          .update(planData)
          .eq('id', editingPlan.id);

        if (error) throw error;
        toast.success("Plano atualizado com sucesso!");
      } else {
        const { error } = await supabase
          .from('plans')
          .insert([planData]);

        if (error) throw error;
        toast.success("Plano criado com sucesso!");
      }

      setIsPlanDialogOpen(false);
      setEditingPlan(null);
      setFormData({
        title: '',
        description: '',
        plan_type: 'texto',
        is_public: false,
        content: ''
      });
      fetchPlans();
    } catch (error) {
      console.error('Erro ao salvar plano:', error);
      toast.error("Erro ao salvar plano de discipulado");
    }
  };

  const handleStepSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanForSteps) return;

    try {
      if (editingStep) {
        const { error } = await supabase
          .from('plan_steps')
          .update(stepFormData)
          .eq('id', editingStep.id);

        if (error) throw error;
        toast.success("Etapa atualizada com sucesso!");
      } else {
        const newStepOrder = planSteps.length + 1;
        const { error } = await supabase
          .from('plan_steps')
          .insert([{
            ...stepFormData,
            plan_id: selectedPlanForSteps.id,
            step_order: newStepOrder
          }]);

        if (error) throw error;
        toast.success("Etapa criada com sucesso!");
      }

      setEditingStep(null);
      setStepFormData({ title: '', description: '', content: '' });
      fetchSteps(selectedPlanForSteps.id);
      fetchPlans(); // Refresh the main plans table
    } catch (error) {
      console.error('Erro ao salvar etapa:', error);
      toast.error("Erro ao salvar etapa");
    }
  };

  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      title: plan.title,
      description: plan.description || '',
      plan_type: plan.plan_type,
      is_public: plan.is_public,
      content: plan.content || ''
    });
    setIsPlanDialogOpen(true);
  };
  
  const handleEditStep = (step: PlanStep) => {
    setEditingStep(step);
    setStepFormData({
      title: step.title,
      description: step.description || '',
      content: step.content || '',
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este plano de discipulado?')) return;
    try {
      const { error } = await supabase.from('plans').delete().eq('id', id);
      if (error) throw error;
      toast.success("Plano excluído com sucesso!");
      fetchPlans();
    } catch (error) {
      console.error('Erro ao excluir plano:', error);
      toast.error("Erro ao excluir plano de discipulado");
    }
  };

  const handleDeleteStep = async (id: string, planId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta etapa?')) return;
    try {
      const { error } = await supabase.from('plan_steps').delete().eq('id', id);
      if (error) throw error;
      toast.success("Etapa excluída com sucesso!");
      fetchSteps(planId);
      fetchPlans(); // Refresh the main plans table
    } catch (error) {
      console.error('Erro ao excluir etapa:', error);
      toast.error("Erro ao excluir etapa");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Planos de Discipulado</h1>
            <p className="text-muted-foreground">
              Gerencie os planos e materiais de discipulado da igreja
            </p>
          </div>
          <Dialog open={isPlanDialogOpen} onOpenChange={setIsPlanDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditingPlan(null); setFormData({ title: '', description: '', plan_type: 'texto', is_public: false, content: '' }); }}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Plano
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingPlan ? 'Editar Plano de Discipulado' : 'Novo Plano de Discipulado'}
                </DialogTitle>
                <DialogDescription>
                  {editingPlan ? 'Atualize as informações do plano' : 'Crie um novo plano de discipulado'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor="plan_type">Tipo de Plano</Label>
                  <Select value={formData.plan_type} onValueChange={(value) => setFormData({...formData, plan_type: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="texto">Texto</SelectItem>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="video">Vídeo</SelectItem>
                      <SelectItem value="link">Link Externo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="content">Conteúdo / URL</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                    rows={8}
                    placeholder="Cole o texto, link do YouTube, Google Drive, etc."
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_public"
                    checked={formData.is_public}
                    onCheckedChange={(checked) => setFormData({...formData, is_public: checked})}
                  />
                  <Label htmlFor="is_public">Tornar público (visível para outras igrejas)</Label>
                </div>
                <Button type="submit" className="w-full">
                  {editingPlan ? 'Atualizar Plano' : 'Criar Plano'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="mr-2 h-5 w-5" />
              Planos de Discipulado
            </CardTitle>
            <CardDescription>
              Todos os planos e conteúdos de discipulado da igreja
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Carregando planos...</div>
            ) : plans.length === 0 ? (
              <div className="text-center py-8">Nenhum plano cadastrado</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Etapas</TableHead>
                    <TableHead>Visibilidade</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell className="font-medium">{plan.title}</TableCell>
                      <TableCell>{plan.description}</TableCell>
                      <TableCell className="flex items-center gap-2">
                        {planTypeIcons[plan.plan_type] || plan.plan_type}
                        <span className="capitalize">{plan.plan_type}</span>
                      </TableCell>
                      <TableCell>{plan.steps_count}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {plan.is_public ? (
                            <>
                              <Globe className="h-4 w-4 text-green-600" />
                              <span className="text-sm text-green-600">Público</span>
                            </>
                          ) : (
                            <>
                              <Lock className="h-4 w-4 text-gray-600" />
                              <span className="text-sm text-gray-600">Privado</span>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(plan)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDelete(plan.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button variant="secondary" size="sm" onClick={() => handleOpenStepsDialog(plan)}>
                            <ListOrdered className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={isStepsDialogOpen} onOpenChange={setIsStepsDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Gerenciar Etapas do Plano</DialogTitle>
              <DialogDescription>
                Adicione, edite ou exclua as etapas do plano "{selectedPlanForSteps?.title}".
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <form onSubmit={handleStepSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="step_title">Título da Etapa</Label>
                  <Input
                    id="step_title"
                    value={stepFormData.title}
                    onChange={(e) => setStepFormData({ ...stepFormData, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="step_description">Descrição</Label>
                  <Textarea
                    id="step_description"
                    value={stepFormData.description}
                    onChange={(e) => setStepFormData({ ...stepFormData, description: e.target.value })}
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor="step_content">Conteúdo</Label>
                  <Textarea
                    id="step_content"
                    value={stepFormData.content}
                    onChange={(e) => setStepFormData({ ...stepFormData, content: e.target.value })}
                    rows={6}
                    placeholder="Conteúdo completo da etapa, links, versículos, etc."
                  />
                </div>
                <div className="flex space-x-2">
                  <Button type="submit" className="flex-1">
                    {editingStep ? 'Atualizar Etapa' : 'Adicionar Etapa'}
                  </Button>
                  {editingStep && (
                    <Button type="button" variant="outline" onClick={() => { setEditingStep(null); setStepFormData({ title: '', description: '', content: '' }); }}>
                      Cancelar Edição
                    </Button>
                  )}
                </div>
              </form>
              <div className="space-y-2 mt-6">
                <h4 className="font-semibold">Etapas Existentes ({planSteps.length})</h4>
                {planSteps.length > 0 ? (
                  planSteps.map((step) => (
                    <div key={step.id} className="border rounded-lg p-3 flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium">Etapa {step.step_order}: {step.title}</p>
                        <p className="text-sm text-muted-foreground">{step.description}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEditStep(step)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteStep(step.id, step.plan_id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhuma etapa cadastrada neste plano.</p>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminPlanos;
