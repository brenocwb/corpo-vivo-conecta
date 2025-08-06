import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Activity, Heart, Users, BookOpen, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ActivityItem {
  id: string;
  type: 'prayer' | 'meeting' | 'discipleship' | 'resource';
  title: string;
  description: string;
  date: string;
  link?: string;
}

const RecentActivity = () => {
  const { profile } = useAuth();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) {
      fetchRecentActivity();
    }
  }, [profile?.id]);

  const fetchRecentActivity = async () => {
    try {
      const activities: ActivityItem[] = [];

      // Buscar pedidos de oração recentes
      const { data: prayers } = await supabase
        .from('prayer_requests')
        .select('*')
        .eq('church_id', profile?.church_id)
        .order('created_at', { ascending: false })
        .limit(3);

      if (prayers) {
        prayers.forEach(prayer => {
          activities.push({
            id: prayer.id,
            type: 'prayer',
            title: 'Novo pedido de oração',
            description: prayer.title,
            date: prayer.created_at,
            link: '/centro-oracao'
          });
        });
      }

      // Buscar encontros recentes (para líderes)
      if (profile?.role === 'lider' || profile?.role === 'admin') {
        const { data: meetings } = await supabase
          .from('encontros')
          .select('*, discipulados(*)')
          .order('meeting_date', { ascending: false })
          .limit(3);

        if (meetings) {
          meetings.forEach(meeting => {
            activities.push({
              id: meeting.id,
              type: 'discipleship',
              title: 'Encontro de discipulado',
              description: meeting.topic || 'Encontro realizado',
              date: meeting.meeting_date,
              link: '/lider/discipulados'
            });
          });
        }
      }

      // Buscar recursos recentes
      const { data: resources } = await supabase
        .from('resources')
        .select('*')
        .or(`is_public.eq.true,church_id.eq.${profile?.church_id}`)
        .order('created_at', { ascending: false })
        .limit(2);

      if (resources) {
        resources.forEach(resource => {
          activities.push({
            id: resource.id,
            type: 'resource',
            title: 'Novo recurso disponível',
            description: resource.title,
            date: resource.created_at,
            link: '/biblioteca-recursos'
          });
        });
      }

      // Ordenar por data e limitar
      activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setActivities(activities.slice(0, 6));

    } catch (error) {
      console.error('Erro ao buscar atividades:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'prayer':
        return <Heart className="h-4 w-4 text-red-500" />;
      case 'meeting':
        return <Calendar className="h-4 w-4 text-blue-500" />;
      case 'discipleship':
        return <Users className="h-4 w-4 text-green-500" />;
      case 'resource':
        return <BookOpen className="h-4 w-4 text-purple-500" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getActivityBadge = (type: string) => {
    switch (type) {
      case 'prayer':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Oração</Badge>;
      case 'meeting':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Reunião</Badge>;
      case 'discipleship':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Discipulado</Badge>;
      case 'resource':
        return <Badge variant="secondary" className="bg-purple-100 text-purple-800">Recurso</Badge>;
      default:
        return <Badge variant="secondary">Atividade</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Atividades Recentes
        </CardTitle>
        <CardDescription>
          Últimas movimentações na sua igreja
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Carregando atividades...
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma atividade recente
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                {getActivityIcon(activity.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium truncate">
                      {activity.link ? (
                        <Link 
                          to={activity.link} 
                          className="hover:text-primary transition-colors"
                        >
                          {activity.title}
                        </Link>
                      ) : (
                        activity.title
                      )}
                    </p>
                    {getActivityBadge(activity.type)}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {activity.description}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(activity.date).toLocaleDateString('pt-BR')} às {' '}
                    {new Date(activity.date).toLocaleTimeString('pt-BR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentActivity;