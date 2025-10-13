import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import { AlertTriangle, Bell, Phone, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScheduleAlertDialog } from './ScheduleAlertDialog';

interface Alert {
  id: string;
  type: string;
  title: string;
  message: string;
  created_at: string;
  read: boolean;
  priority: 'baixa' | 'media' | 'alta' | 'urgente';
  related_member_id?: string;
  member?: {
    full_name: string;
    phone?: string;
  };
}

export const PastoralAlertsCard = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const alertsPerPage = 5;

  useEffect(() => {
    const fetchAlerts = async () => {
      if (!profile?.id) return;

      try {
        const from = page * alertsPerPage;
        const to = from + alertsPerPage;

        const { data, error, count } = await supabase
          .from('alerts')
          .select(`
            *,
            member:profiles!alerts_related_member_id_fkey(full_name, phone)
          `, { count: 'exact' })
          .eq('target_user_id', profile.id)
          .eq('read', false)
          .order('created_at', { ascending: false })
          .range(from, to - 1);

        if (error) throw error;
        
        setAlerts(data || []);
        setHasMore((count || 0) > to);
      } catch (error) {
        console.error('Erro ao buscar alertas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, [profile?.id, page]);

  const markAsRead = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('alerts')
        .update({ read: true })
        .eq('id', alertId);

      if (error) throw error;

      setAlerts(alerts.filter(alert => alert.id !== alertId));
      toast({
        title: "Alerta marcado como lido",
        description: "O alerta foi removido da sua lista.",
      });
    } catch (error) {
      console.error('Erro ao marcar alerta como lido:', error);
      toast({
        title: "Erro",
        description: "Não foi possível marcar o alerta como lido.",
        variant: "destructive",
      });
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'discipulo_ausente':
        return <AlertTriangle className="h-4 w-4" />;
      case 'novo_convertido':
        return <Bell className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getAlertVariant = (type: string) => {
    switch (type) {
      case 'discipulo_ausente':
        return 'destructive' as const;
      case 'novo_convertido':
        return 'default' as const;
      default:
        return 'secondary' as const;
    }
  };

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case 'urgente':
        return 'destructive' as const;
      case 'alta':
        return 'destructive' as const;
      case 'media':
        return 'default' as const;
      case 'baixa':
        return 'secondary' as const;
      default:
        return 'secondary' as const;
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgente':
      case 'alta':
        return <AlertCircle className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const handleScheduleClick = (alertId: string) => {
    setSelectedAlertId(alertId);
    setScheduleDialogOpen(true);
  };

  const handleScheduled = () => {
    toast({
      title: "Agendamento criado",
      description: "O follow-up foi agendado com sucesso.",
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Alertas Pastorais</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">Carregando alertas...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Bell className="mr-2 h-5 w-5" />
          Alertas Pastorais
        </CardTitle>
        <CardDescription>
          Situações que precisam da sua atenção
        </CardDescription>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            Nenhum alerta pendente
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="border rounded-lg p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    {getAlertIcon(alert.type)}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium">{alert.title}</h4>
                        <Badge variant={getPriorityVariant(alert.priority)} className="text-xs flex items-center gap-1">
                          {getPriorityIcon(alert.priority)}
                          {alert.priority}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {alert.message}
                      </p>
                    </div>
                  </div>
                  <Badge variant={getAlertVariant(alert.type)} className="text-xs">
                    {alert.type.replace('_', ' ')}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {new Date(alert.created_at).toLocaleDateString('pt-BR')}
                  </p>
                  
                  <div className="flex space-x-2">
                    {alert.member?.phone && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          window.open(`tel:${alert.member?.phone}`, '_self');
                        }}
                      >
                        <Phone className="mr-1 h-3 w-3" />
                        Ligar
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleScheduleClick(alert.id)}
                    >
                      <Calendar className="mr-1 h-3 w-3" />
                      Agendar
                    </Button>
                    
                    <Button
                      size="sm"
                      onClick={() => markAsRead(alert.id)}
                    >
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Concluído
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            {(page > 0 || hasMore) && (
              <div className="flex justify-between items-center pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  Anterior
                </Button>
                <span className="text-sm text-muted-foreground">
                  Página {page + 1}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => p + 1)}
                  disabled={!hasMore}
                >
                  Próxima
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
      
      {selectedAlertId && (
        <ScheduleAlertDialog
          alertId={selectedAlertId}
          open={scheduleDialogOpen}
          onOpenChange={setScheduleDialogOpen}
          onScheduled={handleScheduled}
        />
      )}
    </Card>
  );
};