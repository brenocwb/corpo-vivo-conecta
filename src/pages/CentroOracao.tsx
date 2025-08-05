import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Heart, Check, Clock, AlertTriangle } from 'lucide-react';
import Navbar from '@/components/navigation/Navbar';
import { toast } from 'sonner';

interface PrayerRequest {
  id: string;
  title: string;
  description: string;
  category: string;
  urgency: string;
  status: string;
  answered_at: string | null;
  testimony: string | null;
  private: boolean;
  created_at: string;
  requested_by: string;
  requester?: {
    full_name: string;
  } | null;
}

const CentroOracao = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [prayerRequests, setPrayerRequests] = useState<PrayerRequest[]>([]);
  const [isNewRequestDialogOpen, setIsNewRequestDialogOpen] = useState(false);
  
  const [newRequestForm, setNewRequestForm] = useState({
    title: '',
    description: '',
    category: 'geral',
    urgency: 'normal',
    private: false,
  });

  useEffect(() => {
    if (profile?.id) {
      fetchPrayerRequests();
    }
  }, [profile?.id]);

  const fetchPrayerRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('prayer_requests')
        .select('*')
        .eq('church_id', profile?.church_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Buscar informações dos solicitantes
      const requestsWithUsers = await Promise.all(
        (data || []).map(async (request) => {
          const { data: userData } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', request.requested_by)
            .single();
          
          return {
            ...request,
            requester: userData
          };
        })
      );
      
      setPrayerRequests(requestsWithUsers);
    } catch (error) {
      console.error('Erro ao carregar pedidos de oração:', error);
      toast.error('Erro ao carregar pedidos de oração.');
    } finally {
      setLoading(false);
    }
  };

  const handleNewRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!newRequestForm.title.trim()) {
        toast.error('Título é obrigatório.');
        return;
      }
      
      const { error } = await supabase.from('prayer_requests').insert([
        {
          title: newRequestForm.title,
          description: newRequestForm.description,
          category: newRequestForm.category,
          urgency: newRequestForm.urgency,
          private: newRequestForm.private,
          requested_by: profile?.id,
          church_id: profile?.church_id,
        },
      ]);
      
      if (error) throw error;
      toast.success('Pedido de oração criado com sucesso!');
      setIsNewRequestDialogOpen(false);
      setNewRequestForm({
        title: '',
        description: '',
        category: 'geral',
        urgency: 'normal',
        private: false,
      });
      fetchPrayerRequests();
    } catch (error) {
      console.error('Erro ao criar pedido de oração:', error);
      toast.error('Erro ao criar pedido de oração.');
    }
  };

  const updateRequestStatus = async (requestId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('prayer_requests')
        .update({ 
          status,
          answered_at: status === 'respondido' ? new Date().toISOString() : null
        })
        .eq('id', requestId);
      
      if (error) throw error;
      toast.success('Status atualizado com sucesso!');
      fetchPrayerRequests();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status.');
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'alta':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'normal':
        return <Clock className="h-4 w-4 text-primary" />;
      default:
        return <Heart className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'respondido':
        return 'bg-green-100 text-green-800';
      case 'em_oracao':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <Navbar />
      <div className="container mx-auto p-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Centro de Oração
            </h1>
            <p className="text-muted-foreground mt-2">
              Compartilhe e acompanhe pedidos de oração da comunidade
            </p>
          </div>
          
          <Dialog open={isNewRequestDialogOpen} onOpenChange={setIsNewRequestDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Pedido
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Pedido de Oração</DialogTitle>
                <DialogDescription>
                  Compartilhe seu pedido com a comunidade.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleNewRequestSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    placeholder="Ex: Oração pela saúde, Viagem..."
                    value={newRequestForm.title}
                    onChange={(e) => setNewRequestForm({ ...newRequestForm, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    placeholder="Descreva seu pedido de oração..."
                    rows={3}
                    value={newRequestForm.description}
                    onChange={(e) => setNewRequestForm({ ...newRequestForm, description: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="category">Categoria</Label>
                  <Select
                    value={newRequestForm.category}
                    onValueChange={(value) => setNewRequestForm({ ...newRequestForm, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="geral">Geral</SelectItem>
                      <SelectItem value="saude">Saúde</SelectItem>
                      <SelectItem value="familia">Família</SelectItem>
                      <SelectItem value="trabalho">Trabalho</SelectItem>
                      <SelectItem value="financeiro">Financeiro</SelectItem>
                      <SelectItem value="ministerio">Ministério</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="urgency">Urgência</Label>
                  <Select
                    value={newRequestForm.urgency}
                    onValueChange={(value) => setNewRequestForm({ ...newRequestForm, urgency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baixa">Baixa</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="private"
                    checked={newRequestForm.private}
                    onChange={(e) => setNewRequestForm({ ...newRequestForm, private: e.target.checked })}
                  />
                  <Label htmlFor="private">Pedido privado (apenas líderes verão)</Label>
                </div>
                <Button type="submit" className="w-full">
                  <Heart className="mr-2 h-4 w-4" />
                  Criar Pedido
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando pedidos de oração...
            </div>
          ) : prayerRequests.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Heart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum pedido de oração ainda</h3>
                <p className="text-muted-foreground">
                  Seja o primeiro a compartilhar um pedido de oração.
                </p>
              </CardContent>
            </Card>
          ) : (
            prayerRequests.map((request) => (
              <Card key={request.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getUrgencyIcon(request.urgency)}
                        <CardTitle className="text-lg">{request.title}</CardTitle>
                        {request.private && (
                          <Badge variant="secondary">Privado</Badge>
                        )}
                      </div>
                      <CardDescription>
                        Por {request.requester?.full_name} • {new Date(request.created_at).toLocaleDateString('pt-BR')}
                        {request.answered_at && (
                          <span className="ml-2">
                            • Respondido em {new Date(request.answered_at).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(request.status)}>
                        {request.status === 'em_oracao' ? 'Em Oração' : 'Respondido'}
                      </Badge>
                      <Badge variant="outline">{request.category}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {request.description && (
                    <p className="text-sm text-muted-foreground mb-4">
                      {request.description}
                    </p>
                  )}
                  
                  {request.testimony && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                      <h4 className="font-semibold text-green-800 mb-1">Testemunho:</h4>
                      <p className="text-sm text-green-700">{request.testimony}</p>
                    </div>
                  )}
                  
                  {(profile?.role === 'admin' || profile?.role === 'pastor' || request.requested_by === profile?.id) && (
                    <div className="flex gap-2">
                      {request.status === 'em_oracao' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateRequestStatus(request.id, 'respondido')}
                        >
                          <Check className="mr-2 h-4 w-4" />
                          Marcar como Respondido
                        </Button>
                      )}
                      {request.status === 'respondido' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateRequestStatus(request.id, 'em_oracao')}
                        >
                          <Clock className="mr-2 h-4 w-4" />
                          Voltar para Em Oração
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CentroOracao;