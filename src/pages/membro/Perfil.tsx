import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { User, Home, BookOpen, Target, Calendar, Heart, MessageSquare, Trophy, Edit, CheckCircle } from 'lucide-react';
import Navbar from '@/components/navigation/Navbar';

// Tipos de dados para os planos e progresso
interface DiscipleshipPlan {
  id: string;
  title: string;
  description: string;
  plan_type: 'texto' | 'pdf' | 'video' | 'link';
  steps_count: number;
}

interface PlanProgress {
  id: string;
  user_id: string;
  plan_id: string;
  current_step: number;
  status: 'nao_iniciado' | 'em_progresso' | 'concluido' | 'arquivado' | 'removido';
  started_at: string;
  plan: DiscipleshipPlan;
}

const MembroPerfil = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [userPlans, setUserPlans] = useState<PlanProgress[]>([]);
  const [isEditing, setIsEditing] = useState({
    prayer_requests: false,
    spiritual_challenges: false,
    growth_milestones: false,
    personal_info: false,
  });
  const [spiritualData, setSpiritualData] = useState({
    prayer_requests: '',
    spiritual_challenges: '',
    growth_milestones: ''
  });

  useEffect(() => {
    if (profile?.id) {
      fetchUserPlans();
      setSpiritualData({
        prayer_requests: (profile as any).prayer_requests || '',
        spiritual_challenges: (profile as any).spiritual_challenges || '',
        growth_milestones: (profile as any).growth_milestones || ''
      });
    }
  }, [profile]);

  const fetchUserPlans = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('plan_progress')
        .select(`
          *,
          plan:plans(title, description, plan_type, steps_count)
        `)
        .eq('user_id', profile?.id)
        .order('started_at', { ascending: false });

      if (error) throw error;
      setUserPlans(data as PlanProgress[]);
    } catch (error) {
      console.error('Erro ao buscar planos do usuário:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSpiritualData = async (field: keyof typeof spiritualData) => {
    if (!profile?.id) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ [field]: spiritualData[field] })
        .eq('id', profile.id);

      if (error) throw error;

      toast({
        title: "Perfil atualizado",
        description: "Suas informações espirituais foram salvas com sucesso.",
      });
      setIsEditing({ ...isEditing, [field]: false });
    } catch (error) {
      console.error('Erro ao salvar dados espirituais:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as informações.",
        variant: "destructive",
      });
    }
  };

  const handleCancelSpiritualData = (field: keyof typeof spiritualData) => {
    setIsEditing({ ...isEditing, [field]: false });
    setSpiritualData({
      ...spiritualData,
      [field]: (profile as any)[field] || '',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Meu Perfil</h1>
            <p className="text-muted-foreground">
              Acompanhe sua jornada espiritual
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <User className="mr-2 h-5 w-5" />
                  Informações Pessoais
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditing({ ...isEditing, personal_info: !isEditing.personal_info })}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Nome</label>
                <p className="text-sm">{profile?.full_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">E-mail</label>
                <p className="text-sm">{profile?.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Função</label>
                <p className="text-sm capitalize">{profile?.role}</p>
              </div>
              <Button variant="outline" className="w-full">
                Editar Perfil
              </Button>
            </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Heart className="mr-2 h-5 w-5" />
                    Pedidos de Oração
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsEditing({ ...isEditing, prayer_requests: !isEditing.prayer_requests })}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </CardTitle>
                <CardDescription>
                  Suas necessidades de oração e intercessão
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isEditing.prayer_requests ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="prayer_requests">Pedidos de Oração</Label>
                      <Textarea
                        id="prayer_requests"
                        value={spiritualData.prayer_requests}
                        onChange={(e) => setSpiritualData({
                          ...spiritualData,
                          prayer_requests: e.target.value
                        })}
                        placeholder="Compartilhe seus pedidos de oração..."
                        className="mt-1"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button onClick={() => handleSaveSpiritualData('prayer_requests')} className="flex-1">
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Salvar
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleCancelSpiritualData('prayer_requests')}
                        className="flex-1"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {spiritualData.prayer_requests ? (
                      <p className="text-sm whitespace-pre-wrap">{spiritualData.prayer_requests}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">Nenhum pedido de oração cadastrado</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <MessageSquare className="mr-2 h-5 w-5" />
                    Desafios Espirituais
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsEditing({ ...isEditing, spiritual_challenges: !isEditing.spiritual_challenges })}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </CardTitle>
                <CardDescription>
                  Áreas em que você está crescendo
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isEditing.spiritual_challenges ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="spiritual_challenges">Desafios e Crescimento</Label>
                      <Textarea
                        id="spiritual_challenges"
                        value={spiritualData.spiritual_challenges}
                        onChange={(e) => setSpiritualData({
                          ...spiritualData,
                          spiritual_challenges: e.target.value
                        })}
                        placeholder="Quais são seus desafios espirituais atuais?"
                        className="mt-1"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button onClick={() => handleSaveSpiritualData('spiritual_challenges')} className="flex-1">
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Salvar
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleCancelSpiritualData('spiritual_challenges')}
                        className="flex-1"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {spiritualData.spiritual_challenges ? (
                      <p className="text-sm whitespace-pre-wrap">{spiritualData.spiritual_challenges}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">Nenhum desafio registrado</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Trophy className="mr-2 h-5 w-5" />
                    Marcos de Crescimento
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsEditing({ ...isEditing, growth_milestones: !isEditing.growth_milestones })}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </CardTitle>
                <CardDescription>
                  Testemunhos e conquistas espirituais
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isEditing.growth_milestones ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="growth_milestones">Marcos e Testemunhos</Label>
                      <Textarea
                        id="growth_milestones"
                        value={spiritualData.growth_milestones}
                        onChange={(e) => setSpiritualData({
                          ...spiritualData,
                          growth_milestones: e.target.value
                        })}
                        placeholder="Registre seus testemunhos e marcos de crescimento..."
                        className="mt-1"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button onClick={() => handleSaveSpiritualData('growth_milestones')} className="flex-1">
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Salvar
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleCancelSpiritualData('growth_milestones')}
                        className="flex-1"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {spiritualData.growth_milestones ? (
                      <p className="text-sm whitespace-pre-wrap">{spiritualData.growth_milestones}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">Nenhum marco registrado</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="mr-2 h-5 w-5" />
                  Planos de Discipulado
                </CardTitle>
                <CardDescription>
                  Sua jornada de crescimento espiritual
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center text-muted-foreground py-8">
                    Carregando planos...
                  </div>
                ) : userPlans.length > 0 ? (
                  <div className="space-y-4">
                    {userPlans.map((planProgress) => (
                      <div key={planProgress.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{planProgress.plan.title}</p>
                            <p className="text-sm text-muted-foreground">
                              Progresso: {planProgress.current_step} de {planProgress.plan.steps_count}
                            </p>
                          </div>
                          <Button size="sm" variant="outline">
                            Abrir Plano
                          </Button>
                        </div>
                        <Progress
                          value={(planProgress.current_step / planProgress.plan.steps_count) * 100}
                          className="mt-2"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    Nenhum plano de discipulado ativo no momento
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Home className="mr-2 h-5 w-5" />
                  Meu Grupo Familiar
                </CardTitle>
                <CardDescription>
                  Informações sobre seu grupo de casa
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center text-muted-foreground py-8">
                  Você ainda não está vinculado a um grupo familiar
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="mr-2 h-5 w-5" />
                  Minhas Atividades
                </CardTitle>
                <CardDescription>
                  Orações, metas e tarefas espirituais
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center text-muted-foreground py-4">
                    Nenhuma atividade cadastrada
                  </div>
                  <Button className="w-full">
                    <Target className="mr-2 h-4 w-4" />
                    Nova Atividade
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MembroPerfil;
