import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserPlus, Edit, Trash2, Home, Calendar, Plus } from 'lucide-react';
import Navbar from '@/components/navigation/Navbar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone?: string;
  role?: string;
  church_id: string;
  birth_date?: string;
  address?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  baptism_date?: string;
  conversion_date?: string;
}

interface Group {
  id: string;
  name: string;
  address: string;
  description: string;
  meeting_day: number;
  meeting_time: string;
  leader_id: string;
  church_id: string;
  leader: {
    full_name: string;
  };
}

interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  location: string;
  is_recurring: boolean;
  recurrence_pattern: string;
  church_id: string;
  created_by: string;
}

const CadastrosPage = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<Profile[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [leaders, setLeaders] = useState<any[]>([]);
  const [filterRole, setFilterRole] = useState('all');

  const [userForm, setUserForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    role: 'membro',
    supervisor_id: '',
    birth_date: '',
    address: '',
    emergency_contact: '',
    emergency_phone: '',
    baptism_date: '',
    conversion_date: ''
  });

  const [groupForm, setGroupForm] = useState({
    name: '',
    address: '',
    description: '',
    meeting_day: '1',
    meeting_time: '',
    leader_id: ''
  });

  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    event_date: '',
    location: '',
    is_recurring: false,
    recurrence_pattern: ''
  });
  
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);

  const [isGroupFormOpen, setIsGroupFormOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);

  const [isEventFormOpen, setIsEventFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);


  const getRoleLabel = (role: string) => {
    const labels = {
      pastor: 'Pastor',
      missionario: 'Missionário',
      lider: 'Líder',
      admin: 'Administrador',
      membro: 'Discípulo'
    };
    return labels[role as keyof typeof labels] || role;
  };

  const getRoleVariant = (role: string) => {
    const variants = {
      pastor: 'default',
      missionario: 'secondary',
      lider: 'outline',
      admin: 'destructive',
      membro: 'secondary'
    };
    return variants[role as keyof typeof variants] || 'outline';
  };
  
  const weekDays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];


  // Fetch all data
  useEffect(() => {
    if (profile?.church_id) {
      fetchUsers();
      fetchGroups();
      fetchEvents();
      fetchLeaders();
    }
  }, [profile?.church_id]);
  
  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Buscar perfis
      const { data: profilesData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('church_id', profile?.church_id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;

      // Buscar roles de todos os usuários
      const userIds = profilesData?.map(p => p.user_id) || [];
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);

      // Combinar profiles com roles
      const usersWithRoles = profilesData?.map(profile => ({
        ...profile,
        role: rolesData?.find(r => r.user_id === profile.user_id)?.role || 'membro'
      })) || [];

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast.error('Erro ao carregar lista de usuários.');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('house_groups')
        .select(`*, leader:profiles!house_groups_leader_id_fkey(full_name)`)
        .eq('church_id', profile?.church_id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setGroups(data || []);
    } catch (error) {
      console.error('Erro ao carregar grupos:', error);
      toast.error('Erro ao carregar lista de grupos.');
    }
  };
  
  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('church_id', profile?.church_id)
        .order('event_date', { ascending: true });
        
      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Erro ao carregar eventos:', error);
      toast.error('Erro ao carregar lista de eventos.');
    }
  };
  
  const fetchLeaders = async () => {
    if (!profile?.church_id) return;
    
    // Buscar líderes a partir de user_roles  
    const { data: leaderRoles } = await supabase
      .from('user_roles')
      .select('user_id, role')
      .in('role', ['admin', 'pastor', 'missionario', 'lider']);
    
    const leaderUserIds = leaderRoles?.map(r => r.user_id) || [];
    
    const { data } = await supabase
      .from('profiles')
      .select('id, user_id, full_name')
      .eq('church_id', profile.church_id)
      .in('user_id', leaderUserIds);
      
    setLeaders(data || []);
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!profile?.church_id) {
        toast.error('Usuário não associado a uma igreja. Contate o suporte.');
        return;
      }

      if(editingUser) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            full_name: userForm.full_name,
            email: userForm.email,
            phone: userForm.phone,
            address: userForm.address,
            emergency_contact: userForm.emergency_contact,
            emergency_phone: userForm.emergency_phone,
            birth_date: userForm.birth_date || null,
            baptism_date: userForm.baptism_date || null,
            conversion_date: userForm.conversion_date || null,
          })
          .eq('id', editingUser.id);
        
        if (profileError) throw profileError;

        // Update role in user_roles table
        // First delete existing role
        await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', editingUser.user_id);

        // Then insert new role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: editingUser.user_id,
            role: userForm.role as any,
          } as any);

        if (roleError) throw roleError;

        toast.success('Usuário atualizado com sucesso!');
        setEditingUser(null);
      } else {
        // Call edge function to create user
        const { data, error } = await supabase.functions.invoke('create-user', {
          body: {
            email: userForm.email,
            full_name: userForm.full_name,
            phone: userForm.phone,
            role: userForm.role,
            church_id: profile.church_id,
            address: userForm.address,
            emergency_contact: userForm.emergency_contact,
            emergency_phone: userForm.emergency_phone,
            birth_date: userForm.birth_date || null,
            baptism_date: userForm.baptism_date || null,
            conversion_date: userForm.conversion_date || null,
          }
        });

        if (error) throw error;
        if (!data?.success) throw new Error(data?.error || 'Erro desconhecido');

        toast.success('Usuário criado com sucesso! Uma senha temporária foi enviada para o e-mail.');
      }

      setUserForm({
        full_name: '',
        email: '',
        phone: '',
        role: 'membro',
        supervisor_id: '',
        birth_date: '',
        address: '',
        emergency_contact: '',
        emergency_phone: '',
        baptism_date: '',
        conversion_date: ''
      });
      setIsUserFormOpen(false);
      fetchUsers();
    } catch (error: any) {
      toast.error('Erro ao cadastrar usuário: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: Profile) => {
    setEditingUser(user);
    setUserForm({
      full_name: user.full_name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      supervisor_id: '', // Supervisor logic to be added
      birth_date: user.birth_date || '',
      address: user.address || '',
      emergency_contact: user.emergency_contact || '',
      emergency_phone: user.emergency_phone || '',
      baptism_date: user.baptism_date || '',
      conversion_date: user.conversion_date || '',
    });
    setIsUserFormOpen(true);
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este usuário?')) return;
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error) throw error;
      toast.success('Usuário excluído com sucesso!');
      fetchUsers();
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      toast.error('Erro ao excluir usuário: ' + (error as Error).message);
    }
  };
  
  const handleGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!profile?.church_id) {
        throw new Error('Igreja não encontrada. Verifique sua configuração.');
      }

      if (!groupForm.leader_id) {
        throw new Error('Por favor, selecione um líder para o grupo.');
      }

      if(editingGroup) {
        const { error } = await supabase
          .from('house_groups')
          .update({
            name: groupForm.name,
            address: groupForm.address,
            description: groupForm.description,
            meeting_day: parseInt(groupForm.meeting_day),
            meeting_time: groupForm.meeting_time,
            leader_id: groupForm.leader_id,
          })
          .eq('id', editingGroup.id);
          
        if (error) throw error;

        toast.success('Grupo familiar atualizado com sucesso!');
        setEditingGroup(null);
      } else {
        const { error } = await supabase
          .from('house_groups')
          .insert({
            name: groupForm.name,
            address: groupForm.address,
            description: groupForm.description,
            meeting_day: parseInt(groupForm.meeting_day),
            meeting_time: groupForm.meeting_time,
            leader_id: groupForm.leader_id,
            church_id: profile.church_id
          });
        
        if (error) throw error;
        toast.success('Grupo familiar cadastrado com sucesso!');
      }

      setGroupForm({
        name: '',
        address: '',
        description: '',
        meeting_day: '1',
        meeting_time: '',
        leader_id: ''
      });
      setIsGroupFormOpen(false);
      fetchGroups();
    } catch (error: any) {
      toast.error('Erro ao cadastrar grupo: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleEditGroup = (group: Group) => {
    setEditingGroup(group);
    setGroupForm({
      name: group.name,
      address: group.address,
      description: group.description || '',
      meeting_day: group.meeting_day.toString(),
      meeting_time: group.meeting_time,
      leader_id: group.leader_id,
    });
    setIsGroupFormOpen(true);
  };

  const handleDeleteGroup = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este grupo familiar?')) return;
    try {
      const { error } = await supabase.from('house_groups').delete().eq('id', id);
      if (error) throw error;
      toast.success('Grupo familiar excluído com sucesso!');
      fetchGroups();
    } catch (error) {
      console.error('Erro ao excluir grupo:', error);
      toast.error('Erro ao excluir grupo: ' + (error as Error).message);
    }
  };
  
  const handleEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!profile?.church_id) {
        throw new Error('Igreja não encontrada. Verifique sua configuração.');
      }

      if(editingEvent) {
        const { error } = await supabase
          .from('events')
          .update(eventForm)
          .eq('id', editingEvent.id);
          
        if (error) throw error;
        toast.success('Evento atualizado com sucesso!');
        setEditingEvent(null);
      } else {
        const { error } = await supabase
          .from('events')
          .insert({
            title: eventForm.title,
            description: eventForm.description,
            event_date: eventForm.event_date,
            location: eventForm.location,
            is_recurring: eventForm.is_recurring,
            recurrence_pattern: eventForm.recurrence_pattern,
            church_id: profile.church_id,
            created_by: profile.id
          });
        
        if (error) throw error;
        toast.success('Evento cadastrado com sucesso!');
      }

      setEventForm({
        title: '',
        description: '',
        event_date: '',
        location: '',
        is_recurring: false,
        recurrence_pattern: ''
      });
      setIsEventFormOpen(false);
      fetchEvents();
    } catch (error: any) {
      toast.error('Erro ao cadastrar evento: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setEventForm({
      title: event.title,
      description: event.description || '',
      event_date: event.event_date,
      location: event.location || '',
      is_recurring: event.is_recurring,
      recurrence_pattern: event.recurrence_pattern || '',
    });
    setIsEventFormOpen(true);
  };

  const handleDeleteEvent = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este evento?')) return;
    try {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) throw error;
      toast.success('Evento excluído com sucesso!');
      fetchEvents();
    } catch (error) {
      console.error('Erro ao excluir evento:', error);
      toast.error('Erro ao excluir evento: ' + (error as Error).message);
    }
  };

  const filteredUsers = users.filter(user => filterRole === 'all' || user.role === filterRole);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <Navbar />
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Cadastros
          </h1>
          <p className="text-muted-foreground mt-2">
            Gerencie pessoas e grupos familiares da igreja
          </p>
        </div>

        <Tabs defaultValue="pessoas" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pessoas" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Pessoas
            </TabsTrigger>
            <TabsTrigger value="grupos" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Grupos
            </TabsTrigger>
            <TabsTrigger value="eventos" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Eventos
            </TabsTrigger>
            <TabsTrigger value="integracao" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Integração
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pessoas">
            <Dialog open={isUserFormOpen} onOpenChange={setIsUserFormOpen}>
                <DialogTrigger asChild>
                    <Button onClick={() => {
                        setEditingUser(null);
                        setUserForm({
                            full_name: '',
                            email: '',
                            phone: '',
                            role: 'membro',
                            supervisor_id: '',
                            birth_date: '',
                            address: '',
                            emergency_contact: '',
                            emergency_phone: '',
                            baptism_date: '',
                            conversion_date: ''
                        });
                    }}>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Novo Usuário
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingUser ? 'Editar Usuário' : 'Cadastrar Nova Pessoa'}</DialogTitle>
                        <DialogDescription>
                            {editingUser ? 'Atualize as informações do usuário.' : 'Adicione pastores, missionários, líderes ou discípulos à igreja.'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUserSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="full_name">Nome Completo *</Label>
                                <Input
                                    id="full_name"
                                    value={userForm.full_name}
                                    onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="email">E-mail *</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={userForm.email}
                                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="phone">Telefone</Label>
                                <Input
                                    id="phone"
                                    value={userForm.phone}
                                    onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label htmlFor="role">Função na Igreja *</Label>
                                <Select value={userForm.role} onValueChange={(value) => setUserForm({ ...userForm, role: value as any })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pastor">Pastor</SelectItem>
                                        <SelectItem value="missionario">Missionário</SelectItem>
                                        <SelectItem value="lider">Líder</SelectItem>
                                        <SelectItem value="membro">Discípulo</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="birth_date">Data de Nascimento</Label>
                                <Input
                                    id="birth_date"
                                    type="date"
                                    value={userForm.birth_date}
                                    onChange={(e) => setUserForm({ ...userForm, birth_date: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label htmlFor="conversion_date">Data de Conversão</Label>
                                <Input
                                    id="conversion_date"
                                    type="date"
                                    value={userForm.conversion_date}
                                    onChange={(e) => setUserForm({ ...userForm, conversion_date: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label htmlFor="baptism_date">Data do Batismo</Label>
                                <Input
                                    id="baptism_date"
                                    type="date"
                                    value={userForm.baptism_date}
                                    onChange={(e) => setUserForm({ ...userForm, baptism_date: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label htmlFor="emergency_contact">Contato de Emergência</Label>
                                <Input
                                    id="emergency_contact"
                                    value={userForm.emergency_contact}
                                    onChange={(e) => setUserForm({ ...userForm, emergency_contact: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label htmlFor="emergency_phone">Telefone de Emergência</Label>
                                <Input
                                    id="emergency_phone"
                                    value={userForm.emergency_phone}
                                    onChange={(e) => setUserForm({ ...userForm, emergency_phone: e.target.value })}
                                />
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="address">Endereço Completo</Label>
                            <Textarea
                                id="address"
                                value={userForm.address}
                                onChange={(e) => setUserForm({ ...userForm, address: e.target.value })}
                                rows={3}
                            />
                        </div>
                        <Button type="submit" disabled={loading} className="w-full">
                            {loading ? 'Processando...' : editingUser ? 'Atualizar Usuário' : 'Cadastrar Pessoa'}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            <Card className="mt-6">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle>Lista de Usuários</CardTitle>
                    <div className="flex items-center gap-2">
                        <Label htmlFor="role-filter">Filtrar por Função:</Label>
                        <Select value={filterRole} onValueChange={setFilterRole}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Todas as funções" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas</SelectItem>
                                <SelectItem value="admin">Administrador</SelectItem>
                                <SelectItem value="pastor">Pastor</SelectItem>
                                <SelectItem value="missionario">Missionário</SelectItem>
                                <SelectItem value="lider">Líder</SelectItem>
                                <SelectItem value="membro">Discípulo</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8">Carregando usuários...</div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="text-center py-8">Nenhum usuário cadastrado.</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nome</TableHead>
                                    <TableHead>E-mail</TableHead>
                                    <TableHead>Telefone</TableHead>
                                    <TableHead>Função</TableHead>
                                    <TableHead>Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredUsers.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">{user.full_name}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>{user.phone || '-'}</TableCell>
                                        <TableCell>
                                            <Badge variant={getRoleVariant(user.role) as any}>{getRoleLabel(user.role)}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Button variant="outline" size="sm" onClick={() => handleEditUser(user)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="outline" size="sm" className="text-destructive" onClick={() => handleDeleteUser(user.id)}>
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
          </TabsContent>

          <TabsContent value="grupos">
            <Dialog open={isGroupFormOpen} onOpenChange={setIsGroupFormOpen}>
                <DialogTrigger asChild>
                    <Button onClick={() => {
                        setEditingGroup(null);
                        setGroupForm({
                            name: '',
                            address: '',
                            description: '',
                            meeting_day: '1',
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
                        <DialogTitle>{editingGroup ? 'Editar Grupo Familiar' : 'Cadastrar Grupo Familiar'}</DialogTitle>
                        <DialogDescription>{editingGroup ? 'Atualize as informações do grupo.' : 'Crie um novo grupo familiar (igreja no lar).'}</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleGroupSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="group_name">Nome do Grupo *</Label>
                                <Input
                                    id="group_name"
                                    value={groupForm.name}
                                    onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="meeting_day">Dia da Reunião *</Label>
                                <Select value={groupForm.meeting_day} onValueChange={(value) => setGroupForm({ ...groupForm, meeting_day: value })}>
                                    <SelectTrigger>
                                        <SelectValue />
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
                                <Label htmlFor="meeting_time">Horário da Reunião *</Label>
                                <Input
                                    id="meeting_time"
                                    type="time"
                                    value={groupForm.meeting_time}
                                    onChange={(e) => setGroupForm({ ...groupForm, meeting_time: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="leader_id">Líder Responsável *</Label>
                                <Select value={groupForm.leader_id} onValueChange={(value) => setGroupForm({ ...groupForm, leader_id: value })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione um líder" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {leaders.map((leader) => (
                                            <SelectItem key={leader.id} value={leader.id}>
                                                {leader.full_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="group_address">Endereço das Reuniões *</Label>
                            <Textarea
                                id="group_address"
                                value={groupForm.address}
                                onChange={(e) => setGroupForm({ ...groupForm, address: e.target.value })}
                                rows={3}
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="group_description">Descrição do Grupo</Label>
                            <Textarea
                                id="group_description"
                                value={groupForm.description}
                                onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                                rows={3}
                            />
                        </div>
                        <Button type="submit" disabled={loading} className="w-full">
                            {loading ? 'Processando...' : editingGroup ? 'Atualizar Grupo' : 'Cadastrar Grupo'}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
            
            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>Lista de Grupos Familiares</CardTitle>
                    <CardDescription>
                        Visualize e edite os grupos familiares da igreja
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead>Líder</TableHead>
                                <TableHead>Dia</TableHead>
                                <TableHead>Horário</TableHead>
                                <TableHead>Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {groups.map((group) => (
                                <TableRow key={group.id}>
                                    <TableCell className="font-medium">{group.name}</TableCell>
                                    <TableCell>{group.leader?.full_name || 'N/A'}</TableCell>
                                    <TableCell>{weekDays[group.meeting_day]}</TableCell>
                                    <TableCell>{group.meeting_time}</TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" onClick={() => handleEditGroup(group)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="outline" size="sm" className="text-destructive" onClick={() => handleDeleteGroup(group.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="eventos">
            <Dialog open={isEventFormOpen} onOpenChange={setIsEventFormOpen}>
                <DialogTrigger asChild>
                    <Button onClick={() => {
                        setEditingEvent(null);
                        setEventForm({
                            title: '',
                            description: '',
                            event_date: '',
                            location: '',
                            is_recurring: false,
                            recurrence_pattern: ''
                        });
                    }}>
                        <Plus className="mr-2 h-4 w-4" />
                        Novo Evento
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{editingEvent ? 'Editar Evento' : 'Cadastrar Evento'}</DialogTitle>
                        <DialogDescription>{editingEvent ? 'Atualize as informações do evento.' : 'Eventos especiais, cultos e reuniões.'}</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEventSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="event_title">Título do Evento *</Label>
                                <Input
                                    id="event_title"
                                    placeholder="Ex: Culto de Domingo"
                                    value={eventForm.title}
                                    onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="event_date">Data e Hora *</Label>
                                <Input
                                    id="event_date"
                                    type="datetime-local"
                                    value={eventForm.event_date}
                                    onChange={(e) => setEventForm({ ...eventForm, event_date: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="event_location">Local</Label>
                                <Input
                                    id="event_location"
                                    placeholder="Ex: Igreja Central"
                                    value={eventForm.location}
                                    onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label htmlFor="event_recurring">Evento Recorrente</Label>
                                <Select 
                                    value={eventForm.is_recurring ? eventForm.recurrence_pattern : 'none'} 
                                    onValueChange={(value) => {
                                        if (value === 'none') {
                                            setEventForm({ ...eventForm, is_recurring: false, recurrence_pattern: '' });
                                        } else {
                                            setEventForm({ ...eventForm, is_recurring: true, recurrence_pattern: value });
                                        }
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Não</SelectItem>
                                        <SelectItem value="weekly">Semanal</SelectItem>
                                        <SelectItem value="monthly">Mensal</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="event_description">Descrição</Label>
                            <Textarea
                                id="event_description"
                                placeholder="Detalhes sobre o evento..."
                                value={eventForm.description}
                                onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                                rows={3}
                            />
                        </div>
                        <Button type="submit" disabled={loading} className="w-full">
                            {loading ? 'Processando...' : editingEvent ? 'Atualizar Evento' : 'Cadastrar Evento'}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>Lista de Eventos</CardTitle>
                    <CardDescription>
                        Visualize e gerencie os eventos da igreja
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Título</TableHead>
                                <TableHead>Data</TableHead>
                                <TableHead>Local</TableHead>
                                <TableHead>Recorrência</TableHead>
                                <TableHead>Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {events.map((event) => (
                                <TableRow key={event.id}>
                                    <TableCell className="font-medium">{event.title}</TableCell>
                                    <TableCell>{new Date(event.event_date).toLocaleDateString('pt-BR')}</TableCell>
                                    <TableCell>{event.location}</TableCell>
                                    <TableCell>
                                        <Badge variant={event.is_recurring ? 'default' : 'secondary'}>
                                            {event.is_recurring ? getRoleLabel(event.recurrence_pattern) : 'Não'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" onClick={() => handleEditEvent(event)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="outline" size="sm" className="text-destructive" onClick={() => handleDeleteEvent(event.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integracao">
            <Card>
              <CardHeader>
                <CardTitle>Integrações</CardTitle>
                <CardDescription>
                  Configure a sincronização com serviços externos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-semibold">Google Calendar</h4>
                        <p className="text-sm text-muted-foreground">
                          Status: Não conectado
                        </p>
                      </div>
                      <Button>
                        Conectar
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-muted rounded-full"></div>
                        <span className="text-sm">Sincronização de reuniões de grupos</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-muted rounded-full"></div>
                        <span className="text-sm">Notificações automáticas</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-muted rounded-full"></div>
                        <span className="text-sm">Lembretes personalizados</span>
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-semibold">WhatsApp Business</h4>
                        <p className="text-sm text-muted-foreground">
                          Status: Não configurado
                        </p>
                      </div>
                      <Button variant="outline">
                        Configurar
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-muted rounded-full"></div>
                        <span className="text-sm">Lembretes de reuniões</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-muted rounded-full"></div>
                        <span className="text-sm">Acompanhamento de visitantes</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-muted rounded-full"></div>
                        <span className="text-sm">Alertas automáticos</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CadastrosPage;
