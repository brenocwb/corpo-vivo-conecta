import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Calendar, MapPin, Users, Plus } from 'lucide-react';
import Navbar from '@/components/navigation/Navbar';

const LiderGrupos = () => {
  const { profile } = useAuth();

  const diasSemana = [
    'Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Meus Grupos Familiares</h1>
            <p className="text-muted-foreground">
              Gerencie seus grupos e acompanhe o crescimento espiritual
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Grupo
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Grupo Exemplo
                <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  Ativo
                </span>
              </CardTitle>
              <CardDescription>
                Grupo familiar de exemplo para demonstração
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center text-sm text-muted-foreground">
                <MapPin className="mr-2 h-4 w-4" />
                Rua Exemplo, 123 - Bairro Centro
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="mr-2 h-4 w-4" />
                Quartas-feiras às 19:30
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Users className="mr-2 h-4 w-4" />
                0 membros ativos
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="flex-1">
                  Ver Detalhes
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  Nova Reunião
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Próximas Reuniões</CardTitle>
            <CardDescription>
              Agenda da semana dos seus grupos familiares
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center text-muted-foreground py-8">
              Nenhuma reunião agendada para esta semana
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Discipulados</CardTitle>
            <CardDescription>
              Acompanhe o crescimento espiritual dos seus discípulos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center text-muted-foreground py-8">
              Nenhum discipulado cadastrado ainda
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LiderGrupos;