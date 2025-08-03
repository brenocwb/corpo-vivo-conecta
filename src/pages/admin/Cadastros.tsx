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
import { UserPlus, User, Edit, Trash2, Mail } from 'lucide-react';
import Navbar from '@/components/navigation/Navbar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  role: 'admin' | 'pastor' | 'missionario' | 'lider' | 'membro';
  church_id: string;
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
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('church_id', profile?.church_id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setUsers(data || []);
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
      
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('church_id', profile.church_id)
      .in('role', ['admin', 'pastor', 'missionario', 'lider']);
      
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

      // First create auth user
      const tempPassword = Math.random().toString(36).slice(-8) + 'A1!';
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userForm.email,
        password: tempPassword,
        email_confirm: true,
      });

      if (authError) throw authError;

      // Add profile info to the database
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            user_id: authData.user.id,
            church_id: profile.church_id,
            full_name: userForm.full_name,
            email: userForm.email,
            phone: userForm.phone,
            role: userForm.role,
            supervisor_id: userForm.supervisor_id || null,
            birth_date: userForm.birth_date || null,
            address: userForm.address,
            emergency_contact: userForm.emergency_contact,
            emergency_phone: userForm.emergency_phone,
            baptism_date: userForm.baptism_date || null,
            conversion_date: userForm.conversion_date || null,
          },
        ]);

      if (profileError) throw profileError;

      toast.success('Usuário criado com sucesso! Uma senha temporária foi enviada para o e-mail.');
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
      fetchUsers();
    } catch (error: any) {
      toast.error('Erro ao cadastrar usuário: ' + error.message);
    } finally {
      setLoading(false);
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
      setGroupForm({
        name: '',
        address: '',
        description: '',
        meeting_day: '1',
        meeting_time: '',
        leader_id: ''
      });
      fetchGroups();
    } catch (error: any) {
      toast.error('Erro ao cadastrar grupo: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!profile?.church_id) {
        throw new Error('Igreja não encontrada. Verifique sua configuração.');
      }

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
      setEventForm({
        title: '',
        description: '',
        event_date: '',
        location: '',
        is_recurring: false,
        recurrence_pattern: ''
      });
      fetchEvents();
    } catch (error: any) {
      toast.error('Erro ao cadastrar evento: ' + error.message);
    } finally {
      setLoading(false);
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
              <Users className="h-4 w-4" />
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
            <Card>
              <CardHeader>
                <CardTitle>Cadastrar Nova Pessoa</CardTitle>
                <CardDescription>
                  Adicione pastores, missionários, líderes ou discípulos à igreja
                </CardDescription>
              </CardHeader>
              <CardContent>
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
                      <Select value={userForm.role} onValueChange={(value) => setUserForm({ ...userForm, role: value })}>
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
                    {loading ? 'Cadastrando...' : 'Cadastrar Pessoa'}
                  </Button>
                </form>
              </CardContent>
            </Card>
            
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
                                                <Button variant="outline" size="sm" onClick={() => {}}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="outline" size="sm" className="text-destructive" onClick={() => {}}>
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
            <Card>
              <CardHeader>
                <CardTitle>Cadastrar Grupo Familiar</CardTitle>
                <CardDescription>
                  Crie um novo grupo familiar (igreja no lar)
                </CardDescription>
              </CardHeader>
              <CardContent>
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
                          <SelectItem value="1">Segunda-feira</SelectItem>
                          <SelectItem value="2">Terça-feira</SelectItem>
                          <SelectItem value="3">Quarta-feira</SelectItem>
                          <SelectItem value="4">Quinta-feira</SelectItem>
                          <SelectItem value="5">Sexta-feira</SelectItem>
                          <SelectItem value="6">Sábado</SelectItem>
                          <SelectItem value="0">Domingo</SelectItem>
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
                    {loading ? 'Cadastrando...' : 'Cadastrar Grupo'}
                  </Button>
                </form>
              </CardContent>
            </Card>
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
                                            <Button variant="outline" size="sm" onClick={() => {}}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="outline" size="sm" className="text-destructive" onClick={() => {}}>
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
            <Card>
              <CardHeader>
                <CardTitle>Cadastrar Evento</CardTitle>
                <CardDescription>
                  Eventos especiais, cultos e reuniões
                </CardDescription>
              </CardHeader>
              <CardContent>
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
                    {loading ? 'Cadastrando...' : 'Cadastrar Evento'}
                  </Button>
                </form>
              </CardContent>
            </Card>
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
                                            <Button variant="outline" size="sm" onClick={() => {}}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="outline" size="sm" className="text-destructive" onClick={() => {}}>
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
