import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Megaphone, Eye, Clock, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: string;
  target_audience: string;
  target_audience_value?: string;
  is_urgent: boolean;
  is_featured: boolean;
  created_at: string;
  author_id: string;
  profiles?: {
    full_name: string;
  } | null;
}

const Comunicados = () => {
  const { profile } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'geral',
    target_audience: 'todos',
    target_audience_value: '',
    is_urgent: false,
    is_featured: false
  });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select(`
          *,
          profiles!announcements_author_id_fkey(full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnnouncements((data as any) || []);
    } catch (error) {
      console.error('Erro ao carregar comunicados:', error);
      toast.error('Erro ao carregar comunicados');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile?.id || !profile?.church_id) {
      toast.error('Erro de autenticação');
      return;
    }

    try {
      const { error } = await supabase
        .from('announcements')
        .insert({
          ...formData,
          author_id: profile.id,
          church_id: profile.church_id
        });

      if (error) throw error;

      toast.success('Comunicado criado com sucesso!');
      setFormData({
        title: '',
        content: '',
        type: 'geral',
        target_audience: 'todos',
        target_audience_value: '',
        is_urgent: false,
        is_featured: false
      });
      setIsDialogOpen(false);
      fetchAnnouncements();
    } catch (error) {
      console.error('Erro ao criar comunicado:', error);
      toast.error('Erro ao criar comunicado');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Comunicados e Avisos</h1>
          <p className="text-muted-foreground">
            Gerencie comunicados importantes para a igreja
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Comunicado
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Novo Comunicado</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Título</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Título do comunicado"
                  required
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Conteúdo</label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Conteúdo do comunicado"
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Tipo</label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="geral">Geral</SelectItem>
                      <SelectItem value="evento">Evento</SelectItem>
                      <SelectItem value="urgente">Urgente</SelectItem>
                      <SelectItem value="ministerial">Ministerial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Público-Alvo</label>
                  <Select value={formData.target_audience} onValueChange={(value) => setFormData({ ...formData, target_audience: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="papel">Por Função</SelectItem>
                      <SelectItem value="grupos">Por Grupo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex space-x-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="urgent"
                    checked={formData.is_urgent}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_urgent: checked as boolean })}
                  />
                  <label htmlFor="urgent" className="text-sm">Urgente</label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="featured"
                    checked={formData.is_featured}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked as boolean })}
                  />
                  <label htmlFor="featured" className="text-sm">Em Destaque</label>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  Criar Comunicado
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {announcements.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Megaphone className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum comunicado encontrado</h3>
              <p className="text-muted-foreground text-center">
                Crie o primeiro comunicado para manter sua igreja informada.
              </p>
            </CardContent>
          </Card>
        ) : (
          announcements.map((announcement) => (
            <Card key={announcement.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{announcement.title}</CardTitle>
                      {announcement.is_urgent && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Urgente
                        </Badge>
                      )}
                      {announcement.is_featured && (
                        <Badge variant="secondary" className="text-xs">
                          Em Destaque
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {announcement.target_audience}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(announcement.created_at)}
                      </span>
                      <span>
                        Por: {announcement.profiles?.full_name || 'Autor desconhecido'}
                      </span>
                    </div>
                  </div>
                  <Badge variant="outline">{announcement.type}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{announcement.content}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Comunicados;