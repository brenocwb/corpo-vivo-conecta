import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { BookOpen, Plus, Edit, Trash2, Eye, UserPlus, List } from 'lucide-react';
import Navbar from '@/components/navigation/Navbar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlanStepsEditor } from '@/components/plans/PlanStepsEditor';
import { AssignPlanDialog } from '@/components/plans/AssignPlanDialog';

interface Plan {
  id: string;
  title: string;
  description: string;
  created_at: string;
  is_public: boolean;
  steps_count?: number;
}

interface PlanStep {
  id?: string;
  step_order: number;
  title: string;
  description: string;
  content: string;
}

const PlanosPage = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [steps, setSteps] = useState<PlanStep[]>([]);
  const [activeTab, setActiveTab] = useState('info');
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedPlanForAssign, setSelectedPlanForAssign] = useState<{ id: string; title: string } | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    is_public: false,
  });

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
      
      const plansWithCount = data?.map(plan => ({
        ...plan,
        steps_count: plan.steps_count?.[0]?.count || 0
      })) || [];
      
      setPlans(plansWithCount);
    } catch (error: any) {
      console.error('Erro ao carregar planos:', error);
      toast.error('Erro ao carregar planos');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlanSteps = async (planId: string) => {
    try {
      const { data, error } = await supabase
        .from('plan_steps')
        .select('*')
        .eq('plan_id', planId)
        .order('step_order');

      if (error) throw error;
      setSteps(data || []);
    } catch (error) {
      console.error('Erro ao carregar etapas:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (activeTab === 'info' && !formData.title.trim()) {
      toast.error('Preencha o título do plano');
      return;
    }

    setLoading(true);
    try {
      if (editingPlan) {
        // Update plan
        const { error: planError } = await supabase
          .from('plans')
          .update({
            title: formData.title,
            description: formData.description,
            is_public: formData.is_public,
          })
          .eq('id', editingPlan.id);

        if (planError) throw planError;

        // Update steps
        if (activeTab === 'steps') {
          // Delete existing steps
          await supabase
            .from('plan_steps')
            .delete()
            .eq('plan_id', editingPlan.id);

          // Insert new steps
          if (steps.length > 0) {
            const stepsToInsert = steps.map(step => ({
              plan_id: editingPlan.id,
              step_order: step.step_order,
              title: step.title,
              description: step.description,
              content: step.content,
            }));

            const { error: stepsError } = await supabase
              .from('plan_steps')
              .insert(stepsToInsert);

            if (stepsError) throw stepsError;
          }
        }

        toast.success('Plano atualizado com sucesso!');
      } else {
        // Create new plan
        const { data: newPlan, error: planError } = await supabase
          .from('plans')
          .insert({
            title: formData.title,
            description: formData.description,
            is_public: formData.is_public,
            church_id: profile?.church_id,
          })
          .select()
          .single();

        if (planError) throw planError;

        // Insert steps
        if (steps.length > 0) {
          const stepsToInsert = steps.map(step => ({
            plan_id: newPlan.id,
            step_order: step.step_order,
            title: step.title,
            description: step.description,
            content: step.content,
          }));

          const { error: stepsError } = await supabase
            .from('plan_steps')
            .insert(stepsToInsert);

          if (stepsError) throw stepsError;
        }

        toast.success('Plano criado com sucesso!');
      }

      closeForm();
      fetchPlans();
    } catch (error: any) {
      console.error('Erro ao salvar plano:', error);
      toast.error('Erro ao salvar plano: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      title: plan.title,
      description: plan.description || '',
      is_public: plan.is_public,
    });
    await fetchPlanSteps(plan.id);
    setActiveTab('info');
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este plano? Isso removerá também o progresso de todos os membros.')) return;
    
    try {
      const { error } = await supabase
        .from('plans')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Plano excluído com sucesso!');
      fetchPlans();
    } catch (error: any) {
      console.error('Erro ao excluir plano:', error);
      toast.error('Erro ao excluir plano: ' + error.message);
    }
  };

  const handleAssignClick = (plan: Plan) => {
    setSelectedPlanForAssign({ id: plan.id, title: plan.title });
    setAssignDialogOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingPlan(null);
    setFormData({ title: '', description: '', is_public: false });
    setSteps([]);
    setActiveTab('info');
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">Planos de Discipulado</h1>
            <p className="text-muted-foreground mt-2">
              Crie e gerencie planos de crescimento espiritual
            </p>
          </div>
          
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Plano
          </Button>
        </div>

        {/* Plans List */}
        <div className="grid gap-6">
          {loading && plans.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-4 text-muted-foreground">Carregando planos...</p>
                </div>
              </CardContent>
            </Card>
          ) : plans.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum plano encontrado</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Comece criando seu primeiro plano de discipulado
                </p>
                <Button onClick={() => setIsFormOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Plano
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <Card key={plan.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{plan.title}</CardTitle>
                        <CardDescription className="mt-2 line-clamp-2">
                          {plan.description}
                        </CardDescription>
                      </div>
                      {plan.is_public && (
                        <Badge variant="secondary">Público</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <List className="h-4 w-4 mr-2" />
                        {plan.steps_count} {plan.steps_count === 1 ? 'etapa' : 'etapas'}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => handleEdit(plan)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAssignClick(plan)}
                        >
                          <UserPlus className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDelete(plan.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Create/Edit Dialog */}
        <Dialog open={isFormOpen} onOpenChange={(open) => !open && closeForm()}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPlan ? 'Editar Plano' : 'Novo Plano de Discipulado'}
              </DialogTitle>
              <DialogDescription>
                {editingPlan ? 'Atualize os dados e etapas do plano' : 'Crie um novo plano com suas etapas'}
              </DialogDescription>
            </DialogHeader>
            
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="info">Informações</TabsTrigger>
                <TabsTrigger value="steps">Etapas</TabsTrigger>
              </TabsList>

              <form onSubmit={handleSubmit}>
                <TabsContent value="info" className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="title">Título *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Ex: Discipulado Básico"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Descreva o objetivo e conteúdo deste plano"
                      rows={4}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_public"
                      checked={formData.is_public}
                      onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="is_public" className="cursor-pointer">
                      Tornar este plano público (visível para outras igrejas)
                    </Label>
                  </div>
                </TabsContent>

                <TabsContent value="steps" className="mt-4">
                  <PlanStepsEditor steps={steps} onChange={setSteps} />
                </TabsContent>

                <div className="flex justify-end space-x-2 mt-6 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={closeForm}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Salvando...' : (editingPlan ? 'Atualizar' : 'Criar Plano')}
                  </Button>
                </div>
              </form>
            </Tabs>
          </DialogContent>
        </Dialog>

        {/* Assign Plan Dialog */}
        {selectedPlanForAssign && (
          <AssignPlanDialog
            open={assignDialogOpen}
            onOpenChange={setAssignDialogOpen}
            planId={selectedPlanForAssign.id}
            planTitle={selectedPlanForAssign.title}
          />
        )}
      </div>
    </div>
  );
};

export default PlanosPage;
