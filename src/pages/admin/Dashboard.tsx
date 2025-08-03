import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Users, Home, BookOpen, Activity, UserPlus, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/navigation/Navbar';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import { PastoralAlertsCard } from '@/components/alerts/PastoralAlertsCard';

const AdminDashboard = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    totalMembers: 0,
    totalGroups: 0,
    totalDiscipleships: 0,
    weekActivities: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!profile?.church_id) return;
      
      try {
        // Buscar total de membros
        const { data: members } = await supabase
          .from('profiles')
          .select('id')
          .eq('church_id', profile.church_id);

        // Buscar total de grupos ativos
        const { data: groups } = await supabase
          .from('house_groups')
          .select('id')
          .eq('church_id', profile.church_id)
          .eq('active', true);

        // Buscar discipulados ativos
        const { data: discipleships } = await supabase
          .from('discipulados')
          .select('id')
          .eq('active', true);

        // Buscar atividades desta semana
        const today = new Date();
        const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
        const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));
        
        const { data: activities } = await supabase
          .from('group_meetings')
          .select('id')
          .gte('meeting_date', startOfWeek.toISOString().split('T')[0])
          .lte('meeting_date', endOfWeek.toISOString().split('T')[0]);

        setStats({
          totalMembers: members?.length || 0,
          totalGroups: groups?.length || 0,
          totalDiscipleships: discipleships?.length || 0,
          weekActivities: activities?.length || 0
        });
      } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [profile?.church_id]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Painel Administrativo</h1>
            <p className="text-muted-foreground">
              Bem-vindo, {profile?.full_name}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Membros
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '...' : stats.totalMembers}
              </div>
              <p className="text-xs text-muted-foreground">
                Membros cadastrados na igreja
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Grupos Familiares
              </CardTitle>
              <Home className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '...' : stats.totalGroups}
              </div>
              <p className="text-xs text-muted-foreground">
                Grupos ativos na igreja
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Discipulados Ativos
              </CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '...' : stats.totalDiscipleships}
              </div>
              <p className="text-xs text-muted-foreground">
                Relações de discipulado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Atividades desta Semana
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '...' : stats.weekActivities}
              </div>
              <p className="text-xs text-muted-foreground">
                Reuniões e encontros
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
              <CardDescription>
                Gerencie os principais aspectos da sua igreja
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link to="/admin/cadastros" className="block">
                <Button className="w-full justify-start">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Cadastros
                </Button>
              </Link>
              <Link to="/admin/relatorios" className="block">
                <Button className="w-full justify-start" variant="outline">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Relatórios
                </Button>
              </Link>
              <Link to="/admin/grupos" className="block">
                <Button className="w-full justify-start" variant="outline">
                  <Home className="mr-2 h-4 w-4" />
                  Grupos Familiares
                </Button>
              </Link>
              <Link to="/admin/estudos" className="block">
                <Button className="w-full justify-start" variant="outline">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Material de Estudo
                </Button>
              </Link>
            </CardContent>
          </Card>

          <PastoralAlertsCard />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;