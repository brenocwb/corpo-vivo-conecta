import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Plus, BookOpen, Video, FileText, ExternalLink, Search } from 'lucide-react';
import Navbar from '@/components/navigation/Navbar';
import { toast } from 'sonner';

interface Resource {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  type: string;
  author: string;
  url: string;
  difficulty_level: string;
  is_public: boolean;
  created_at: string;
  author_profile?: {
    full_name: string;
  };
}

const BibliotecaRecursos = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [resources, setResources] = useState<Resource[]>([]);
  const [filteredResources, setFilteredResources] = useState<Resource[]>([]);
  const [isNewResourceDialogOpen, setIsNewResourceDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('todas');
  const [selectedType, setSelectedType] = useState('todos');
  
  const [newResourceForm, setNewResourceForm] = useState({
    title: '',
    description: '',
    content: '',
    category: 'estudo_biblico',
    type: 'artigo',
    author: '',
    url: '',
    difficulty_level: 'iniciante',
    is_public: false,
  });

  useEffect(() => {
    if (profile?.id) {
      fetchResources();
    }
  }, [profile?.id]);

  useEffect(() => {
    filterResources();
  }, [resources, searchTerm, selectedCategory, selectedType]);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .or(`is_public.eq.true,church_id.eq.${profile?.church_id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Buscar informações dos autores
      const resourcesWithAuthors = await Promise.all(
        (data || []).map(async (resource) => {
          if (resource.created_by) {
            const { data: authorData } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', resource.created_by)
              .single();
            
            return {
              ...resource,
              author_profile: authorData
            };
          }
          return resource;
        })
      );
      
      setResources(resourcesWithAuthors);
    } catch (error) {
      console.error('Erro ao carregar recursos:', error);
      toast.error('Erro ao carregar recursos.');
    } finally {
      setLoading(false);
    }
  };

  const filterResources = () => {
    let filtered = resources;

    if (searchTerm) {
      filtered = filtered.filter(resource =>
        resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.author.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'todas') {
      filtered = filtered.filter(resource => resource.category === selectedCategory);
    }

    if (selectedType !== 'todos') {
      filtered = filtered.filter(resource => resource.type === selectedType);
    }

    setFilteredResources(filtered);
  };

  const handleNewResourceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!newResourceForm.title.trim()) {
        toast.error('Título é obrigatório.');
        return;
      }
      
      const { error } = await supabase.from('resources').insert([
        {
          ...newResourceForm,
          created_by: profile?.id,
          church_id: profile?.church_id,
        },
      ]);
      
      if (error) throw error;
      toast.success('Recurso criado com sucesso!');
      setIsNewResourceDialogOpen(false);
      setNewResourceForm({
        title: '',
        description: '',
        content: '',
        category: 'estudo_biblico',
        type: 'artigo',
        author: '',
        url: '',
        difficulty_level: 'iniciante',
        is_public: false,
      });
      fetchResources();
    } catch (error) {
      console.error('Erro ao criar recurso:', error);
      toast.error('Erro ao criar recurso.');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'artigo':
        return <FileText className="h-4 w-4" />;
      case 'estudo':
        return <BookOpen className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'iniciante':
        return 'bg-green-100 text-green-800';
      case 'intermediario':
        return 'bg-yellow-100 text-yellow-800';
      case 'avancado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const canCreateResource = profile?.role === 'admin' || profile?.role === 'pastor' || profile?.role === 'lider';

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <Navbar />
      <div className="container mx-auto p-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Biblioteca de Recursos
            </h1>
            <p className="text-muted-foreground mt-2">
              Acesse estudos, artigos e materiais para crescimento espiritual
            </p>
          </div>
          
          {canCreateResource && (
            <Dialog open={isNewResourceDialogOpen} onOpenChange={setIsNewResourceDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Recurso
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Novo Recurso</DialogTitle>
                  <DialogDescription>
                    Adicione um novo recurso à biblioteca.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleNewResourceSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="title">Título</Label>
                    <Input
                      id="title"
                      placeholder="Título do recurso"
                      value={newResourceForm.title}
                      onChange={(e) => setNewResourceForm({ ...newResourceForm, title: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      placeholder="Breve descrição do recurso"
                      rows={2}
                      value={newResourceForm.description}
                      onChange={(e) => setNewResourceForm({ ...newResourceForm, description: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category">Categoria</Label>
                      <Select
                        value={newResourceForm.category}
                        onValueChange={(value) => setNewResourceForm({ ...newResourceForm, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="estudo_biblico">Estudo Bíblico</SelectItem>
                          <SelectItem value="oracao">Oração</SelectItem>
                          <SelectItem value="discipulado">Discipulado</SelectItem>
                          <SelectItem value="evangelismo">Evangelismo</SelectItem>
                          <SelectItem value="lideranca">Liderança</SelectItem>
                          <SelectItem value="familia">Família</SelectItem>
                          <SelectItem value="jovens">Jovens</SelectItem>
                          <SelectItem value="devocionais">Devocionais</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="type">Tipo</Label>
                      <Select
                        value={newResourceForm.type}
                        onValueChange={(value) => setNewResourceForm({ ...newResourceForm, type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="artigo">Artigo</SelectItem>
                          <SelectItem value="video">Vídeo</SelectItem>
                          <SelectItem value="estudo">Estudo</SelectItem>
                          <SelectItem value="livro">Livro</SelectItem>
                          <SelectItem value="podcast">Podcast</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="author">Autor</Label>
                      <Input
                        id="author"
                        placeholder="Nome do autor"
                        value={newResourceForm.author}
                        onChange={(e) => setNewResourceForm({ ...newResourceForm, author: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="difficulty_level">Nível</Label>
                      <Select
                        value={newResourceForm.difficulty_level}
                        onValueChange={(value) => setNewResourceForm({ ...newResourceForm, difficulty_level: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="iniciante">Iniciante</SelectItem>
                          <SelectItem value="intermediario">Intermediário</SelectItem>
                          <SelectItem value="avancado">Avançado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="url">URL (opcional)</Label>
                    <Input
                      id="url"
                      placeholder="Link para o recurso externo"
                      value={newResourceForm.url}
                      onChange={(e) => setNewResourceForm({ ...newResourceForm, url: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="content">Conteúdo</Label>
                    <Textarea
                      id="content"
                      placeholder="Conteúdo do recurso ou resumo detalhado"
                      rows={5}
                      value={newResourceForm.content}
                      onChange={(e) => setNewResourceForm({ ...newResourceForm, content: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is_public"
                      checked={newResourceForm.is_public}
                      onChange={(e) => setNewResourceForm({ ...newResourceForm, is_public: e.target.checked })}
                    />
                    <Label htmlFor="is_public">Tornar público (visível para todas as igrejas)</Label>
                  </div>
                  <Button type="submit" className="w-full">
                    <BookOpen className="mr-2 h-4 w-4" />
                    Criar Recurso
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar recursos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas Categorias</SelectItem>
                  <SelectItem value="estudo_biblico">Estudo Bíblico</SelectItem>
                  <SelectItem value="oracao">Oração</SelectItem>
                  <SelectItem value="discipulado">Discipulado</SelectItem>
                  <SelectItem value="evangelismo">Evangelismo</SelectItem>
                  <SelectItem value="lideranca">Liderança</SelectItem>
                  <SelectItem value="familia">Família</SelectItem>
                  <SelectItem value="jovens">Jovens</SelectItem>
                  <SelectItem value="devocionais">Devocionais</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos Tipos</SelectItem>
                  <SelectItem value="artigo">Artigo</SelectItem>
                  <SelectItem value="video">Vídeo</SelectItem>
                  <SelectItem value="estudo">Estudo</SelectItem>
                  <SelectItem value="livro">Livro</SelectItem>
                  <SelectItem value="podcast">Podcast</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Recursos */}
        <div className="grid gap-6">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando recursos...
            </div>
          ) : filteredResources.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum recurso encontrado</h3>
                <p className="text-muted-foreground">
                  {resources.length === 0 
                    ? 'Nenhum recurso foi adicionado ainda.' 
                    : 'Tente ajustar os filtros de busca.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredResources.map((resource) => (
              <Card key={resource.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getTypeIcon(resource.type)}
                        <CardTitle className="text-lg">{resource.title}</CardTitle>
                        {resource.is_public && (
                          <Badge variant="secondary">Público</Badge>
                        )}
                      </div>
                      <CardDescription>
                        {resource.author && `Por ${resource.author}`}
                        {resource.author_profile?.full_name && ` • Adicionado por ${resource.author_profile.full_name}`}
                        {' • ' + new Date(resource.created_at).toLocaleDateString('pt-BR')}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getDifficultyColor(resource.difficulty_level)}>
                        {resource.difficulty_level.charAt(0).toUpperCase() + resource.difficulty_level.slice(1)}
                      </Badge>
                      <Badge variant="outline">{resource.category.replace('_', ' ')}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {resource.description && (
                    <p className="text-sm text-muted-foreground mb-4">
                      {resource.description}
                    </p>
                  )}
                  
                  {resource.content && (
                    <div className="bg-muted/50 rounded-lg p-3 mb-4">
                      <p className="text-sm whitespace-pre-wrap">
                        {resource.content.length > 300 
                          ? resource.content.substring(0, 300) + '...' 
                          : resource.content}
                      </p>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    {resource.url && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(resource.url, '_blank')}
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Acessar Link
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default BibliotecaRecursos;