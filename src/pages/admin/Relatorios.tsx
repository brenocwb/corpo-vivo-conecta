import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, TrendingUp, Calendar, MapPin, Download } from 'lucide-react';
import Navbar from '@/components/navigation/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const RelatoriosPage = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    totalMembers: 0,
    totalGroups: 0,
    totalMeetings: 0,
    activeDiscipulados: 0
  });

  const [groups, setGroups] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [meetingData, setMeetingData] = useState<any[]>([]);
  const [allMeetings, setAllMeetings] = useState<any[]>([]);
  const [pieData, setPieData] = useState<any[]>([]);
  const [barData, setBarData] = useState<any[]>([]);

  const roleColors = {
    pastor: '#8B5CF6',
    missionario: '#3B82F6',
    lider: '#10B981',
    admin: '#F59E0B',
    membro: '#6B7280'
  };
  
  const weekDays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

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
  
  const fetchStats = async (churchId: string) => {
    const [
      { count: totalMembers },
      { count: totalGroups },
      { count: totalMeetings },
      { count: activeDiscipulados }
    ] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('church_id', churchId),
      supabase.from('house_groups').select('id', { count: 'exact', head: true }).eq('church_id', churchId),
      supabase.from('encontros').select('id', { count: 'exact', head: true }),
      supabase.from('discipulados').select('id', { count: 'exact', head: true }).eq('active', true)
    ]);
    
    setStats({
      totalMembers: totalMembers || 0,
      totalGroups: totalGroups || 0,
      totalMeetings: totalMeetings || 0,
      activeDiscipulados: activeDiscipulados || 0
    });
  };
  
  const fetchGroups = async (churchId: string) => {
    const { data: groupsData, error } = await supabase
      .from('house_groups')
      .select(`
        *,
        leader:profiles!house_groups_leader_id_fkey(full_name)
      `)
      .eq('church_id', churchId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    setGroups(groupsData || []);

    const groupsByDay = (groupsData || []).reduce((acc, group) => {
      const day = weekDays[group.meeting_day];
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const newBarData = weekDays.map(day => ({
      day,
      groups: groupsByDay[day] || 0
    }));
    setBarData(newBarData);
  };
  
  const fetchMembers = async (churchId: string) => {
    const { data: membersData, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('church_id', churchId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    setMembers(membersData || []);

    const roleData = (membersData || []).reduce((acc, member) => {
      const role = member.role;
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const newPieData = Object.entries(roleData).map(([role, count]) => ({
      name: getRoleLabel(role),
      value: count,
      color: roleColors[role as keyof typeof roleColors]
    }));
    setPieData(newPieData);
  };
  
  const fetchMeetings = async () => {
    const { data: meetingsData, error: meetingsError } = await supabase
      .from('encontros')
      .select(`
        id,
        meeting_date,
        topic,
        discipulado:discipulados(id, disciple:profiles(full_name))
      `)
      .order('meeting_date', { ascending: false });
    
    if (meetingsError) throw meetingsError;
    setAllMeetings(meetingsData || []);

    const monthlyMeetings = (meetingsData || []).reduce((acc, meeting) => {
      const date = new Date(meeting.meeting_date);
      const month = date.toLocaleString('pt-BR', { month: 'short' });
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {});

    const monthOrder = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    const formattedMeetingData = monthOrder.map(month => ({
      name: month,
      meetings: monthlyMeetings[month] || 0
    }));
    setMeetingData(formattedMeetingData);
  };
  
  const fetchData = async () => {
    if (!profile?.church_id) {
        setLoading(false);
        return;
    }
    
    setLoading(true);
    try {
      await Promise.all([
        fetchStats(profile.church_id),
        fetchGroups(profile.church_id),
        fetchMembers(profile.church_id),
        fetchMeetings(),
      ]);
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        toast.error('Erro ao carregar dados dos relatórios.');
    } finally {
        setLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando relatórios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <Navbar />
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Relatórios
            </h1>
            <p className="text-muted-foreground mt-2">
              Visualize estatísticas e dados da igreja
            </p>
          </div>
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Membros</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalMembers}</div>
              <p className="text-xs text-muted-foreground">
                Pessoas cadastradas na igreja
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-secondary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Grupos Familiares</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalGroups}</div>
              <p className="text-xs text-muted-foreground">
                Igrejas no lar ativas
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-accent">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reuniões Realizadas</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalMeetings}</div>
              <p className="text-xs text-muted-foreground">
                Encontros registrados
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-primary-glow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Discipulados Ativos</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeDiscipulados}</div>
              <p className="text-xs text-muted-foreground">
                Acompanhamentos em andamento
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="grupos">Grupos</TabsTrigger>
            <TabsTrigger value="membros">Membros</TabsTrigger>
            <TabsTrigger value="frequencia">Frequência</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Distribuição por Função</CardTitle>
                  <CardDescription>
                    Quantidade de pessoas por função na igreja
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Grupos por Dia da Semana</CardTitle>
                  <CardDescription>
                    Distribuição das reuniões dos grupos familiares
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="groups" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="grupos">
            <Card>
              <CardHeader>
                <CardTitle>Lista de Grupos Familiares</CardTitle>
                <CardDescription>
                  Todos os grupos familiares cadastrados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome do Grupo</TableHead>
                      <TableHead>Líder</TableHead>
                      <TableHead>Dia da Reunião</TableHead>
                      <TableHead>Horário</TableHead>
                      <TableHead>Endereço</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groups.map((group) => (
                      <TableRow key={group.id}>
                        <TableCell className="font-medium">{group.name}</TableCell>
                        <TableCell>{group.leader?.full_name || 'Não definido'}</TableCell>
                        <TableCell>{weekDays[group.meeting_day]}</TableCell>
                        <TableCell>{group.meeting_time}</TableCell>
                        <TableCell className="max-w-xs truncate">{group.address}</TableCell>
                        <TableCell>
                          <Badge variant={group.active ? 'default' : 'secondary'}>
                            {group.active ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="membros">
            <Card>
              <CardHeader>
                <CardTitle>Lista de Membros</CardTitle>
                <CardDescription>
                  Todas as pessoas cadastradas na igreja
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>E-mail</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Função</TableHead>
                      <TableHead>Data de Cadastro</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">{member.full_name}</TableCell>
                        <TableCell>{member.email}</TableCell>
                        <TableCell>{member.phone || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={getRoleVariant(member.role) as any}>
                            {getRoleLabel(member.role)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(member.created_at).toLocaleDateString('pt-BR')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </CardContent>
              </Card>
            </Card>
          </TabsContent>

          <TabsContent value="frequencia">
            <Card>
              <CardHeader>
                <CardTitle>Reuniões por Mês</CardTitle>
                <CardDescription>
                  Número de encontros registrados por mês
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={meetingData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="meetings" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Histórico de Reuniões</CardTitle>
                  <CardDescription>
                    Lista de todos os encontros registrados
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Discípulo</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Tópico</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allMeetings.map((meeting) => (
                        <TableRow key={meeting.id}>
                          <TableCell>{meeting.discipulado?.disciple?.full_name}</TableCell>
                          <TableCell>{new Date(meeting.meeting_date).toLocaleDateString('pt-BR')}</TableCell>
                          <TableCell>{meeting.topic}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default RelatoriosPage;
