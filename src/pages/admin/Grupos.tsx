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
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Home, Plus, Users, Clock, MapPin, Edit, Trash2 } from 'lucide-react';
import Navbar from '@/components/navigation/Navbar';

interface HouseGroup {
  id: string;
  name: string;
  description?: string;
  address: string;
  meeting_day: number;
  meeting_time: string;
  leader_id: string;
  active: boolean;
  leader?: {
    full_name: string;
  };
}

interface Profile {
  id: string;
  full_name: string;
  role: string;
}

const AdminGrupos = () => {
  const { profile } = useAuth();
  const [groups, setGroups] = useState<HouseGroup[]>([]);
  const [leaders, setLeaders] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<HouseGroup | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    meeting_day: '',
    meeting_time: '',
    leader_id: ''
  });

  const weekDays = [
    'Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch groups with leader info
      const { data: groupsData } = await supabase
        .from('house_groups')
        .select(`
          *,
          leader:profiles!house_groups_leader_id_fkey(full_name)
        `)
        .order('created_at', { ascending: false });

      // Fetch potential leaders
      const { data: leadersData } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .in('role', ['lider', 'pastor', 'missionario']);

      setGroups(groupsData || []);
      setLeaders(leadersData || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar grupos familiares",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const groupData = {
        name: formData.name,
        description: formData.description || null,
        address: formData.address,
        meeting_day: parseInt(formData.meeting_day),
        meeting_time: formData.meeting_time,
        leader_id: formData.leader_id,
        church_id: profile?.church_id
      };

      if (editingGroup) {
        const { error } = await supabase
          .from('house_groups')
          .update(groupData)
          .eq('id', editingGroup.id);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Grupo familiar atualizado com sucesso!",
        });
      } else {
        const { error } = await supabase
          .from('house_groups')
          .insert([groupData]);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Grupo familiar criado com sucesso!",
        });
      }

      setIsDialogOpen(false);
      setEditingGroup(null);
      setFormData({
        name: '',
        description: '',
        address: '',
        meeting_day: '',
        meeting_time: '',
        leader_id: ''
      });
      fetchData();
    } catch (error) {
      console.error('Erro ao salvar grupo:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar grupo familiar",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (group: HouseGroup) => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      description: group.description || '',
      address: group.address,
      meeting_day: group.meeting_day.toString(),
      meeting_time: group.meeting_time,
      leader_id: group.leader_id
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este grupo familiar?')) return;

    try {
      const { error } = await supabase
        .from('house_groups')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Grupo familiar excluído com sucesso!",
      });
      fetchData();
    } catch (error) {
      console.error('Erro ao excluir grupo:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir grupo familiar",
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
            <p className="mt-4 text-muted-foreground">Carregando grupos...</p>
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
            <h1 className="text-3xl font-bold">Grupos Familiares</h1>
            <p className="text-muted-foreground">
              Gerencie as igrejas no lar da sua congregação
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingGroup(null);
                setFormData({
                  name: '',
                  description: '',
                  address: '',
                  meeting_day: '',
                  meeting_time: '',
                  leader_id: ''
                });
              }}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Grupo
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {editingGroup ? 'Editar Grupo Familiar' : 'Novo Grupo Familiar'}
                </DialogTitle>
                <DialogDescription>
                  {editingGroup ? 'Atualize as informações do grupo' : 'Crie um novo grupo familiar'}
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome do Grupo</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="address">Endereço</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    required
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="meeting_day">Dia da Reunião</Label>
                    <Select value={formData.meeting_day} onValueChange={(value) => setFormData({...formData, meeting_day: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o dia" />
                      </SelectTrigger>
                      <SelectContent>
                        {weekDays.map((day, index) => (
                          <SelectItem key={index} value={index.toString()}>
                            {day}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="meeting_time">Horário</Label>
                    <Input
                      id="meeting_time"
                      type="time"
                      value={formData.meeting_time}
                      onChange={(e) => setFormData({...formData, meeting_time: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="leader_id">Líder</Label>
                  <Select value={formData.leader_id} onValueChange={(value) => setFormData({...formData, leader_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um líder" />
                    </SelectTrigger>
                    <SelectContent>
                      {leaders.map((leader) => (
                        <SelectItem key={leader.id} value={leader.id}>
                          {leader.full_name} ({leader.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" className="w-full">
                  {editingGroup ? 'Atualizar Grupo' : 'Criar Grupo'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Home className="mr-2 h-5 w-5" />
              Lista de Grupos Familiares
            </CardTitle>
            <CardDescription>
              Todos os grupos familiares cadastrados na igreja
            </CardDescription>
          </CardHeader>
          <CardContent>
            {groups.length === 0 ? (
              <div className="text-center py-8">
                <Home className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum grupo cadastrado</h3>
                <p className="text-muted-foreground mb-4">
                  Comece criando seu primeiro grupo familiar
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome do Grupo</TableHead>
                    <TableHead>Líder</TableHead>
                    <TableHead>Dia/Horário</TableHead>
                    <TableHead>Endereço</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groups.map((group) => (
                    <TableRow key={group.id}>
                      <TableCell className="font-medium">{group.name}</TableCell>
                      <TableCell>{group.leader?.full_name || 'Não definido'}</TableCell>
                      <TableCell>
                        {weekDays[group.meeting_day]} - {group.meeting_time}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{group.address}</TableCell>
                      <TableCell>
                        <Badge variant={group.active ? 'default' : 'secondary'}>
                          {group.active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(group)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(group.id)}
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

export default AdminGrupos;