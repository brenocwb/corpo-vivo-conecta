import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import { AlertTriangle, Bell, Phone, Calendar, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Alert {
  id: string;
  type: string;
  title: string;
  message: string;
  created_at: string;
  read: boolean;
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

  useEffect(() => {
    const fetchAlerts = async () => {
      if (!profile?.id) return;

      try {
        const { data, error } = await supabase
          .from('alerts')
          .select(`
            *,
            member:profiles!alerts_related_member_id_fkey(full_name, phone)
          `)
          .eq('target_user_id', profile.id)
          .eq('read', false)
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) throw error;
        setAlerts(data || []);
      } catch (error) {
        console.error('Erro ao buscar alertas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, [profile?.id]);

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
                      <h4 className="text-sm font-medium">{alert.title}</h4>
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
                      onClick={() => {
                        // TODO: Implementar agendamento
                        toast({
                          title: "Funcionalidade em desenvolvimento",
                          description: "O agendamento será implementado em breve.",
                        });
                      }}
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
          </div>
        )}
      </CardContent>
    </Card>
  );
};