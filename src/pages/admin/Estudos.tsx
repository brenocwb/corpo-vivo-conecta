import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { BookOpen, Plus, Edit, Trash2, Globe, Lock } from 'lucide-react';
import Navbar from '@/components/navigation/Navbar';

interface Estudo {
  id: string;
  title: string;
  description?: string;
  content?: string;
  category?: string;
  bible_verses?: string;
  is_public: boolean;
  created_at: string;
  author?: {
    full_name: string;
  };
}

const AdminEstudos = () => {
  const { profile } = useAuth();
  const [estudos, setEstudos] = useState<Estudo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEstudo, setEditingEstudo] = useState<Estudo | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    category: '',
    bible_verses: '',
    is_public: false
  });

  useEffect(() => {
    fetchEstudos();
  }, []);

  const fetchEstudos = async () => {
    try {
      const { data } = await supabase
        .from('estudos')
        .select(`
          *,
          author:profiles!estudos_author_id_fkey(full_name)
        `)
        .order('created_at', { ascending: false });

      setEstudos(data || []);
    } catch (error) {
      console.error('Erro ao carregar estudos:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar estudos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const estudoData = {
        title: formData.title,
        description: formData.description || null,
        content: formData.content || null,
        category: formData.category || null,
        bible_verses: formData.bible_verses || null,
        is_public: formData.is_public,
        church_id: profile?.church_id,
        author_id: profile?.id
      };

      if (editingEstudo) {
        const { error } = await supabase
          .from('estudos')
          .update(estudoData)
          .eq('id', editingEstudo.id);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Estudo atualizado com sucesso!",
        });
      } else {
        const { error } = await supabase
          .from('estudos')
          .insert([estudoData]);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Estudo criado com sucesso!",
        });
      }

      setIsDialogOpen(false);
      setEditingEstudo(null);
      setFormData({
        title: '',
        description: '',
        content: '',
        category: '',
        bible_verses: '',
        is_public: false
      });
      fetchEstudos();
    } catch (error) {
      console.error('Erro ao salvar estudo:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar estudo",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (estudo: Estudo) => {
    setEditingEstudo(estudo);
    setFormData({
      title: estudo.title,
      description: estudo.description || '',
      content: estudo.content || '',
      category: estudo.category || '',
      bible_verses: estudo.bible_verses || '',
      is_public: estudo.is_public
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este estudo?')) return;

    try {
      const { error } = await supabase
        .from('estudos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Estudo excluído com sucesso!",
      });
      fetchEstudos();
    } catch (error) {
      console.error('Erro ao excluir estudo:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir estudo",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Carregando estudos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Material de Estudo</h1>
            <p className="text-muted-foreground">
              Gerencie os estudos e materiais bíblicos da igreja
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingEstudo(null);
                setFormData({
                  title: '',
                  description: '',
                  content: '',
                  category: '',
                  bible_verses: '',
                  is_public: false
                });
              }}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Estudo
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingEstudo ? 'Editar Estudo' : 'Novo Estudo'}
                </DialogTitle>
                <DialogDescription>
                  {editingEstudo ? 'Atualize as informações do estudo' : 'Crie um novo material de estudo'}
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
                  <Label htmlFor="category">Categoria</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    placeholder="Ex: Discipulado, Evangelismo, Oração..."
                  />
                </div>

                <div>
                  <Label htmlFor="bible_verses">Versículos Bíblicos</Label>
                  <Textarea
                    id="bible_verses"
                    value={formData.bible_verses}
                    onChange={(e) => setFormData({...formData, bible_verses: e.target.value})}
                    placeholder="Ex: João 3:16, Romanos 8:28..."
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="content">Conteúdo</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                    rows={8}
                    placeholder="Digite o conteúdo completo do estudo..."
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
                  {editingEstudo ? 'Atualizar Estudo' : 'Criar Estudo'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="mr-2 h-5 w-5" />
              Estudos Cadastrados
            </CardTitle>
            <CardDescription>
              Todos os materiais de estudo da igreja
            </CardDescription>
          </CardHeader>
          <CardContent>
            {estudos.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum estudo cadastrado</h3>
                <p className="text-muted-foreground mb-4">
                  Comece criando seu primeiro material de estudo
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Autor</TableHead>
                    <TableHead>Visibilidade</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {estudos.map((estudo) => (
                    <TableRow key={estudo.id}>
                      <TableCell className="font-medium">{estudo.title}</TableCell>
                      <TableCell>
                        {estudo.category && (
                          <Badge variant="outline">{estudo.category}</Badge>
                        )}
                      </TableCell>
                      <TableCell>{estudo.author?.full_name || 'Não definido'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {estudo.is_public ? (
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
                        {new Date(estudo.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(estudo)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(estudo.id)}
                          >
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

export default AdminEstudos;