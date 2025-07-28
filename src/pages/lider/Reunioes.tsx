import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/hooks/useAuth';
import { Calendar, MapPin, Users, Plus, CheckCircle, UserPlus, Clock } from 'lucide-react';

const LiderReunioes = () => {
  const { profile } = useAuth();
  const [selectedGroup, setSelectedGroup] = useState<string>('');

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <div className="container mx-auto p-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Reuniões dos Grupos
            </h1>
            <p className="text-muted-foreground mt-2">
              Gerencie as reuniões dos grupos familiares
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nova Reunião
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-card/50 backdrop-blur border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Esta Semana
                  </p>
                  <p className="text-3xl font-bold text-primary">3</p>
                </div>
                <Calendar className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Presença Média
                  </p>
                  <p className="text-3xl font-bold text-primary">85%</p>
                </div>
                <Users className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Visitantes
                  </p>
                  <p className="text-3xl font-bold text-primary">7</p>
                </div>
                <UserPlus className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Decisões
                  </p>
                  <p className="text-3xl font-bold text-primary">2</p>
                </div>
                <CheckCircle className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Próximas Reuniões</CardTitle>
              <CardDescription>
                Agenda da semana dos grupos familiares
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Grupo Família Abençoada</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        Hoje às 19:30
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        Rua das Flores, 123
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Badge variant="outline">Confirmada</Badge>
                    <Button size="sm">
                      Gerenciar
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <p className="font-medium">Grupo Luz do Mundo</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        Amanhã às 20:00
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        Av. Central, 456
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Badge>Agendada</Badge>
                    <Button size="sm" variant="outline">
                      Preparar
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Última Reunião</CardTitle>
              <CardDescription>
                Registro da reunião mais recente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold">Grupo Família Abençoada</h4>
                    <Badge variant="secondary">Finalizada</Badge>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Data:</span>
                      <span className="text-sm">Domingo, 21/01/2024</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Tema:</span>
                      <span className="text-sm">A Importância da Oração</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Presentes:</span>
                      <span className="text-sm">12 de 15 membros</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Visitantes:</span>
                      <span className="text-sm">3 novos</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Decisões:</span>
                      <span className="text-sm">1 batismo</span>
                    </div>
                  </div>

                  <Button size="sm" variant="outline" className="w-full mt-4">
                    Ver Detalhes Completos
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Registrar Lista de Presença</CardTitle>
              <CardDescription>
                Marque a presença dos membros na reunião
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="grupo">Grupo Familiar</Label>
                    <Input
                      id="grupo"
                      placeholder="Selecione o grupo"
                    />
                  </div>
                  <div>
                    <Label htmlFor="meeting_date">Data da Reunião</Label>
                    <Input
                      id="meeting_date"
                      type="date"
                    />
                  </div>
                  <div>
                    <Label htmlFor="theme">Tema da Reunião</Label>
                    <Input
                      id="theme"
                      placeholder="Ex: Oração e Jejum"
                    />
                  </div>
                </div>

                <div>
                  <Label>Lista de Presença</Label>
                  <div className="border rounded-lg p-4 space-y-3 mt-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="member1" />
                      <Label htmlFor="member1" className="font-normal">
                        Maria Silva Santos
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="member2" />
                      <Label htmlFor="member2" className="font-normal">
                        João Pedro Oliveira
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="member3" />
                      <Label htmlFor="member3" className="font-normal">
                        Ana Carolina Souza
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="member4" />
                      <Label htmlFor="member4" className="font-normal">
                        Carlos Eduardo Lima
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="visitors_count">Número de Visitantes</Label>
                    <Input
                      id="visitors_count"
                      type="number"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="decisions_count">Decisões/Batismos</Label>
                    <Input
                      id="decisions_count"
                      type="number"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Observações da Reunião</Label>
                  <Textarea
                    id="notes"
                    placeholder="Anotações sobre a reunião, pedidos de oração, testemunhos..."
                    rows={3}
                  />
                </div>

                <Button type="submit" className="w-full">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Salvar Lista de Presença
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LiderReunioes;