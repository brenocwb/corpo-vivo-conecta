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
import { BookOpen, Plus, Edit, Trash2, Globe, Lock, Video, FileText, Link } from 'lucide-react';
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

const AdminPlanos = () => {
  const { profile } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    plan_type: 'texto',
    is_public: false,
    content: ''
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

      setIsDialogOpen(false);
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

  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      title: plan.title,
      description: plan.description || '',
      plan_type: plan.plan_type,
      is_public: plan.is_public,
      content: plan.content || ''
    });
    setIsDialogOpen(true);
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
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminPlanos;
