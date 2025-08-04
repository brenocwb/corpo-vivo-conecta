import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { BookOpen, Plus, Edit, Trash2, Eye } from 'lucide-react';
import Navbar from '@/components/navigation/Navbar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Plan {
  id: string;
  title: string;
  description: string;
  created_at: string;
}

const PlanosPage = () => {
  const { profile } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });

  // Mock data for demonstration
  const mockPlans = [
    {
      id: '1',
      title: 'Discipulado Básico',
      description: 'Plano de discipulado para novos convertidos',
      created_at: new Date().toISOString()
    },
    {
      id: '2', 
      title: 'Crescimento Espiritual',
      description: 'Plano para desenvolvimento da vida cristã',
      created_at: new Date().toISOString()
    }
  ];

  useEffect(() => {
    // Using mock data for now
    setPlans(mockPlans);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingPlan) {
        // Update existing plan (mock)
        const updatedPlans = plans.map(plan => 
          plan.id === editingPlan.id 
            ? { ...plan, ...formData }
            : plan
        );
        setPlans(updatedPlans);
        toast.success('Plano atualizado com sucesso!');
        setEditingPlan(null);
      } else {
        // Create new plan (mock)
        const newPlan: Plan = {
          id: Date.now().toString(),
          title: formData.title,
          description: formData.description,
          created_at: new Date().toISOString()
        };
        setPlans([newPlan, ...plans]);
        toast.success('Plano criado com sucesso!');
      }

      setFormData({ title: '', description: '' });
      setIsFormOpen(false);
    } catch (error: any) {
      toast.error('Erro ao salvar plano: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      title: plan.title,
      description: plan.description,
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este plano?')) return;
    
    try {
      const updatedPlans = plans.filter(plan => plan.id !== id);
      setPlans(updatedPlans);
      toast.success('Plano excluído com sucesso!');
    } catch (error) {
      toast.error('Erro ao excluir plano');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <Navbar />
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Planos de Discipulado
            </h1>
            <p className="text-muted-foreground mt-2">
              Gerencie os planos de discipulado da igreja
            </p>
          </div>
          
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Novo Plano
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>
                  {editingPlan ? 'Editar Plano' : 'Novo Plano de Discipulado'}
                </DialogTitle>
                <DialogDescription>
                  {editingPlan ? 'Atualize os dados do plano' : 'Crie um novo plano de discipulado'}
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Digite o título do plano"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Digite a descrição do plano"
                    rows={4}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setIsFormOpen(false);
                      setEditingPlan(null);
                      setFormData({ title: '', description: '' });
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Salvando...' : (editingPlan ? 'Atualizar' : 'Criar')}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6">
          {plans.length === 0 ? (
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
                        <CardDescription className="mt-2">
                          {plan.description}
                        </CardDescription>
                      </div>
                      <Badge variant="secondary">
                        Ativo
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-muted-foreground">
                        Criado em {new Date(plan.created_at).toLocaleDateString('pt-BR')}
                      </p>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleEdit(plan)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleDelete(plan.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlanosPage;