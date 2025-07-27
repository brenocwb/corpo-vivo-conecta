import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, TrendingUp, Calendar, MapPin, Download } from 'lucide-react';

const RelatoriosPage = () => {
  const [stats, setStats] = useState({
    totalMembers: 0,
    totalGroups: 0,
    totalMeetings: 0,
    activeDiscipulados: 0
  });

  const [groups, setGroups] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch stats
      const [
        { count: totalMembers },
        { count: totalGroups },
        { count: totalMeetings },
        { count: activeDiscipulados }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('house_groups').select('*', { count: 'exact', head: true }),
        supabase.from('group_meetings').select('*', { count: 'exact', head: true }),
        supabase.from('discipulados').select('*', { count: 'exact', head: true }).eq('active', true)
      ]);

      setStats({
        totalMembers: totalMembers || 0,
        totalGroups: totalGroups || 0,
        totalMeetings: totalMeetings || 0,
        activeDiscipulados: activeDiscipulados || 0
      });

      // Fetch groups with leader info
      const { data: groupsData } = await supabase
        .from('house_groups')
        .select(`
          *,
          leader:profiles!house_groups_leader_id_fkey(full_name)
        `);

      setGroups(groupsData || []);

      // Fetch members
      const { data: membersData } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      setMembers(membersData || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const roleColors = {
    pastor: '#8B5CF6',
    missionario: '#3B82F6',
    lider: '#10B981',
    admin: '#F59E0B',
    membro: '#6B7280'
  };

  const roleData = members.reduce((acc, member) => {
    const role = member.role;
    acc[role] = (acc[role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(roleData).map(([role, count]) => ({
    name: role.charAt(0).toUpperCase() + role.slice(1),
    value: count,
    color: roleColors[role as keyof typeof roleColors]
  }));

  const weekDays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const groupsByDay = groups.reduce((acc, group) => {
    const day = weekDays[group.meeting_day];
    acc[day] = (acc[day] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const barData = weekDays.map(day => ({
    day,
    groups: groupsByDay[day] || 0
  }));

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
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="frequencia">
            <Card>
              <CardHeader>
                <CardTitle>Relatório de Frequência</CardTitle>
                <CardDescription>
                  Análise de presença nas reuniões dos grupos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Em desenvolvimento</h3>
                  <p className="text-muted-foreground">
                    Relatórios de frequência serão implementados em breve
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

export default RelatoriosPage;