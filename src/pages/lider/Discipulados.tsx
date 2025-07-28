import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { Users, Calendar, Target, Plus, CheckCircle } from 'lucide-react';

const LiderDiscipulados = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <div className="container mx-auto p-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Discipulados
            </h1>
            <p className="text-muted-foreground mt-2">
              Acompanhe o crescimento espiritual dos seus discípulos
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Discipulado
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="bg-card/50 backdrop-blur border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Discípulos Ativos
                  </p>
                  <p className="text-3xl font-bold text-primary">12</p>
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
                    Encontros Este Mês
                  </p>
                  <p className="text-3xl font-bold text-primary">8</p>
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
                    Metas Concluídas
                  </p>
                  <p className="text-3xl font-bold text-primary">15</p>
                </div>
                <Target className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Discípulos Ativos</CardTitle>
              <CardDescription>
                Lista dos seus discípulos em acompanhamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Maria Silva</p>
                      <p className="text-sm text-muted-foreground">
                        Discipulado iniciado em Jan/2024
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      Ver Progresso
                    </Button>
                    <Button size="sm">
                      Novo Encontro
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">João Santos</p>
                      <p className="text-sm text-muted-foreground">
                        Discipulado iniciado em Fev/2024
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      Ver Progresso
                    </Button>
                    <Button size="sm">
                      Novo Encontro
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Próximos Encontros</CardTitle>
              <CardDescription>
                Reuniões de discipulado agendadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <p className="font-medium">Maria Silva</p>
                      <p className="text-sm text-muted-foreground">
                        Hoje às 19:00 - Oração e Jejum
                      </p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    Detalhes
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <p className="font-medium">João Santos</p>
                      <p className="text-sm text-muted-foreground">
                        Amanhã às 18:30 - Estudo Bíblico
                      </p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    Detalhes
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Registrar Novo Encontro</CardTitle>
              <CardDescription>
                Documente o encontro de discipulado realizado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="disciple">Discípulo</Label>
                    <Input
                      id="disciple"
                      placeholder="Selecione o discípulo"
                    />
                  </div>
                  <div>
                    <Label htmlFor="meeting_date">Data do Encontro</Label>
                    <Input
                      id="meeting_date"
                      type="datetime-local"
                    />
                  </div>
                  <div>
                    <Label htmlFor="topic">Tema do Encontro</Label>
                    <Input
                      id="topic"
                      placeholder="Ex: Oração, Estudo Bíblico, Aconselhamento"
                    />
                  </div>
                  <div>
                    <Label htmlFor="duration">Duração (minutos)</Label>
                    <Input
                      id="duration"
                      type="number"
                      placeholder="60"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="notes">Anotações do Encontro</Label>
                  <Textarea
                    id="notes"
                    placeholder="Resumo do que foi conversado, orações realizadas, versículos estudados..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="next_goals">Próximas Metas</Label>
                  <Textarea
                    id="next_goals"
                    placeholder="Objetivos para o próximo encontro..."
                    rows={2}
                  />
                </div>
                <Button type="submit" className="w-full">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Registrar Encontro
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LiderDiscipulados;