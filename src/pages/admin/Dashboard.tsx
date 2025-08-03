import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Users, Home, BookOpen, Activity, UserPlus, BarChart3, Loader2 } from 'lucide-react';
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
    weekMeetings: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!profile?.church_id) {
        setLoading(false);
        return;
      }
      
      try {
        const today = new Date();
        const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
        const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));

        const [
          { count: totalMembers },
          { count: totalGroups },
          { count: totalDiscipleships },
          { count: weekMeetings }
        ] = await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('church_id', profile.church_id),
          supabase.from('house_groups').select('id', { count: 'exact', head: true }).eq('church_id', profile.church_id),
          supabase.from('discipulados').select('id', { count: 'exact', head: true }).eq('active', true),
          supabase.from('encontros').select('id', { count: 'exact', head: true })
            .gte('meeting_date', startOfWeek.toISOString().split('T')[0])
            .lte('meeting_date', endOfWeek.toISOString().split('T')[0])
        ]);

        setStats({
          totalMembers: totalMembers || 0,
          totalGroups: totalGroups || 0,
          totalDiscipleships: totalDiscipleships || 0,
          weekMeetings: weekMeetings || 0
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
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : stats.totalMembers}
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
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : stats.totalGroups}
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
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : stats.totalDiscipleships}
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
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : stats.weekMeetings}
              </div>
              <p className="text-xs text-muted-foreground">
                Encontros registrados
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
