import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Plus, Users, Home, Calendar } from 'lucide-react';

const CadastrosPage = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);

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

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // First create auth user
      const tempPassword = Math.random().toString(36).slice(-8);
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userForm.email,
        password: tempPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: userForm.full_name,
          }
        }
      });

      if (authError) throw authError;

      // Then create profile with additional data
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            full_name: userForm.full_name,
            phone: userForm.phone,
            role: userForm.role as any,
            supervisor_id: userForm.supervisor_id || null,
            birth_date: userForm.birth_date || null,
            address: userForm.address,
            emergency_contact: userForm.emergency_contact,
            emergency_phone: userForm.emergency_phone,
            baptism_date: userForm.baptism_date || null,
            conversion_date: userForm.conversion_date || null,
            church_id: profile?.church_id
          })
          .eq('user_id', authData.user.id);

        if (profileError) throw profileError;
      }

      toast.success('Usuário cadastrado com sucesso!');
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
      const { error } = await supabase
        .from('house_groups')
        .insert({
          name: groupForm.name,
          address: groupForm.address,
          description: groupForm.description,
          meeting_day: parseInt(groupForm.meeting_day),
          meeting_time: groupForm.meeting_time,
          leader_id: groupForm.leader_id,
          church_id: profile?.church_id
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
    } catch (error: any) {
      toast.error('Erro ao cadastrar grupo: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10">
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
                      <Label htmlFor="leader_id">Líder Responsável</Label>
                      <Input
                        id="leader_id"
                        placeholder="ID do líder"
                        value={groupForm.leader_id}
                        onChange={(e) => setGroupForm({ ...groupForm, leader_id: e.target.value })}
                      />
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
          </TabsContent>

          <TabsContent value="eventos">
            <Card>
              <CardHeader>
                <CardTitle>Gerenciar Eventos</CardTitle>
                <CardDescription>
                  Eventos especiais, cultos e reuniões
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Em desenvolvimento</h3>
                  <p className="text-muted-foreground">
                    Sistema de eventos será implementado em breve
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integracao">
            <Card>
              <CardHeader>
                <CardTitle>Integração com Google Calendar</CardTitle>
                <CardDescription>
                  Configure a sincronização automática com o Google Agenda
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Plus className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Google Calendar</h3>
                  <p className="text-muted-foreground mb-4">
                    Sincronize reuniões dos grupos familiares com o Google Agenda
                  </p>
                  <Button variant="outline" disabled>
                    Conectar Google Calendar
                  </Button>
                  <p className="text-sm text-muted-foreground mt-2">
                    Funcionalidade será implementada em breve
                  </p>
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