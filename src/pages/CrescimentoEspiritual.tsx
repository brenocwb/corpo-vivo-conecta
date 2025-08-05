import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Target, TrendingUp, User, Edit } from 'lucide-react';
import Navbar from '@/components/navigation/Navbar';
import { toast } from 'sonner';

interface SpiritualGrowth {
  id: string;
  user_id: string;
  maturity_level: string;
  spiritual_gifts: string[];
  growth_goals: string[];
  areas_improvement: string[];
  last_assessment: string;
  created_at: string;
}

const CrescimentoEspiritual = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [spiritualGrowth, setSpiritualGrowth] = useState<SpiritualGrowth | null>(null);
  const [isAssessmentDialogOpen, setIsAssessmentDialogOpen] = useState(false);
  const [isGoalsDialogOpen, setIsGoalsDialogOpen] = useState(false);
  
  const [assessmentForm, setAssessmentForm] = useState({
    maturity_level: 'iniciante',
    spiritual_gifts: [] as string[],
    areas_improvement: [] as string[],
  });

  const [goalsForm, setGoalsForm] = useState({
    growth_goals: [] as string[],
  });

  const [newGoal, setNewGoal] = useState('');
  const [newGift, setNewGift] = useState('');
  const [newImprovement, setNewImprovement] = useState('');

  useEffect(() => {
    if (profile?.id) {
      fetchSpiritualGrowth();
    }
  }, [profile?.id]);

  const fetchSpiritualGrowth = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('spiritual_growth')
        .select('*')
        .eq('user_id', profile?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setSpiritualGrowth(data);
        setAssessmentForm({
          maturity_level: data.maturity_level,
          spiritual_gifts: data.spiritual_gifts || [],
          areas_improvement: data.areas_improvement || [],
        });
        setGoalsForm({
          growth_goals: data.growth_goals || [],
        });
      }
    } catch (error) {
      console.error('Erro ao carregar crescimento espiritual:', error);
      toast.error('Erro ao carregar dados de crescimento espiritual.');
    } finally {
      setLoading(false);
    }
  };

  const handleAssessmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSave = {
        user_id: profile?.id,
        maturity_level: assessmentForm.maturity_level,
        spiritual_gifts: assessmentForm.spiritual_gifts,
        areas_improvement: assessmentForm.areas_improvement,
        growth_goals: spiritualGrowth?.growth_goals || [],
        last_assessment: new Date().toISOString(),
      };

      if (spiritualGrowth) {
        const { error } = await supabase
          .from('spiritual_growth')
          .update(dataToSave)
          .eq('id', spiritualGrowth.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('spiritual_growth')
          .insert([dataToSave]);
        
        if (error) throw error;
      }
      
      toast.success('Avaliação espiritual atualizada com sucesso!');
      setIsAssessmentDialogOpen(false);
      fetchSpiritualGrowth();
    } catch (error) {
      console.error('Erro ao salvar avaliação:', error);
      toast.error('Erro ao salvar avaliação espiritual.');
    }
  };

  const handleGoalsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToUpdate = {
        growth_goals: goalsForm.growth_goals,
      };

      if (spiritualGrowth) {
        const { error } = await supabase
          .from('spiritual_growth')
          .update(dataToUpdate)
          .eq('id', spiritualGrowth.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('spiritual_growth')
          .insert([{
            user_id: profile?.id,
            maturity_level: 'iniciante',
            spiritual_gifts: [],
            areas_improvement: [],
            ...dataToUpdate,
          }]);
        
        if (error) throw error;
      }
      
      toast.success('Metas de crescimento atualizadas com sucesso!');
      setIsGoalsDialogOpen(false);
      fetchSpiritualGrowth();
    } catch (error) {
      console.error('Erro ao salvar metas:', error);
      toast.error('Erro ao salvar metas de crescimento.');
    }
  };

  const addToList = (value: string, list: string[], setter: (list: string[]) => void) => {
    if (value.trim() && !list.includes(value.trim())) {
      setter([...list, value.trim()]);
    }
  };

  const removeFromList = (index: number, list: string[], setter: (list: string[]) => void) => {
    const newList = list.filter((_, i) => i !== index);
    setter(newList);
  };

  const getMaturityProgress = (level: string) => {
    switch (level) {
      case 'iniciante':
        return 25;
      case 'intermediario':
        return 50;
      case 'avancado':
        return 75;
      case 'multiplicador':
        return 100;
      default:
        return 0;
    }
  };

  const getMaturityColor = (level: string) => {
    switch (level) {
      case 'iniciante':
        return 'text-green-600';
      case 'intermediario':
        return 'text-yellow-600';
      case 'avancado':
        return 'text-orange-600';
      case 'multiplicador':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <Navbar />
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Crescimento Espiritual
          </h1>
          <p className="text-muted-foreground mt-2">
            Acompanhe sua jornada de crescimento na fé
          </p>
        </div>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Carregando dados de crescimento...
          </div>
        ) : (
          <div className="grid gap-6">
            {/* Nível de Maturidade */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Nível de Maturidade Espiritual
                    </CardTitle>
                    <CardDescription>
                      Avalie e acompanhe seu desenvolvimento espiritual
                    </CardDescription>
                  </div>
                  <Dialog open={isAssessmentDialogOpen} onOpenChange={setIsAssessmentDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Edit className="mr-2 h-4 w-4" />
                        {spiritualGrowth ? 'Atualizar' : 'Fazer'} Avaliação
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Avaliação Espiritual</DialogTitle>
                        <DialogDescription>
                          Reflita sobre seu crescimento espiritual atual.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleAssessmentSubmit} className="space-y-4">
                        <div>
                          <Label htmlFor="maturity_level">Nível de Maturidade</Label>
                          <Select
                            value={assessmentForm.maturity_level}
                            onValueChange={(value) => setAssessmentForm({ ...assessmentForm, maturity_level: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="iniciante">Iniciante - Novo na fé</SelectItem>
                              <SelectItem value="intermediario">Intermediário - Crescendo na fé</SelectItem>
                              <SelectItem value="avancado">Avançado - Maduro na fé</SelectItem>
                              <SelectItem value="multiplicador">Multiplicador - Formando discípulos</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label>Dons Espirituais Identificados</Label>
                          <div className="flex gap-2 mt-2">
                            <Input
                              placeholder="Ex: Ensino, Liderança, Hospitalidade..."
                              value={newGift}
                              onChange={(e) => setNewGift(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  addToList(newGift, assessmentForm.spiritual_gifts, (list) => 
                                    setAssessmentForm({ ...assessmentForm, spiritual_gifts: list })
                                  );
                                  setNewGift('');
                                }
                              }}
                            />
                            <Button
                              type="button"
                              onClick={() => {
                                addToList(newGift, assessmentForm.spiritual_gifts, (list) => 
                                  setAssessmentForm({ ...assessmentForm, spiritual_gifts: list })
                                );
                                setNewGift('');
                              }}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {assessmentForm.spiritual_gifts.map((gift, index) => (
                              <Badge key={index} variant="secondary" className="cursor-pointer"
                                onClick={() => removeFromList(index, assessmentForm.spiritual_gifts, (list) => 
                                  setAssessmentForm({ ...assessmentForm, spiritual_gifts: list })
                                )}
                              >
                                {gift} ×
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div>
                          <Label>Áreas para Melhoria</Label>
                          <div className="flex gap-2 mt-2">
                            <Input
                              placeholder="Ex: Vida de oração, Leitura bíblica..."
                              value={newImprovement}
                              onChange={(e) => setNewImprovement(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  addToList(newImprovement, assessmentForm.areas_improvement, (list) => 
                                    setAssessmentForm({ ...assessmentForm, areas_improvement: list })
                                  );
                                  setNewImprovement('');
                                }
                              }}
                            />
                            <Button
                              type="button"
                              onClick={() => {
                                addToList(newImprovement, assessmentForm.areas_improvement, (list) => 
                                  setAssessmentForm({ ...assessmentForm, areas_improvement: list })
                                );
                                setNewImprovement('');
                              }}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {assessmentForm.areas_improvement.map((area, index) => (
                              <Badge key={index} variant="outline" className="cursor-pointer"
                                onClick={() => removeFromList(index, assessmentForm.areas_improvement, (list) => 
                                  setAssessmentForm({ ...assessmentForm, areas_improvement: list })
                                )}
                              >
                                {area} ×
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <Button type="submit" className="w-full">
                          <TrendingUp className="mr-2 h-4 w-4" />
                          Salvar Avaliação
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {spiritualGrowth ? (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`font-semibold ${getMaturityColor(spiritualGrowth.maturity_level)}`}>
                          {spiritualGrowth.maturity_level.charAt(0).toUpperCase() + spiritualGrowth.maturity_level.slice(1)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {getMaturityProgress(spiritualGrowth.maturity_level)}%
                        </span>
                      </div>
                      <Progress value={getMaturityProgress(spiritualGrowth.maturity_level)} className="h-2" />
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      Última avaliação: {new Date(spiritualGrowth.last_assessment).toLocaleDateString('pt-BR')}
                    </div>

                    {spiritualGrowth.spiritual_gifts?.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Dons Espirituais:</h4>
                        <div className="flex flex-wrap gap-2">
                          {spiritualGrowth.spiritual_gifts.map((gift, index) => (
                            <Badge key={index} variant="secondary">{gift}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {spiritualGrowth.areas_improvement?.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Áreas para Melhoria:</h4>
                        <div className="flex flex-wrap gap-2">
                          {spiritualGrowth.areas_improvement.map((area, index) => (
                            <Badge key={index} variant="outline">{area}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <User className="mx-auto h-12 w-12 mb-4" />
                    <p>Faça sua primeira avaliação espiritual para começar a acompanhar seu crescimento.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Metas de Crescimento */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Metas de Crescimento
                    </CardTitle>
                    <CardDescription>
                      Defina objetivos específicos para seu desenvolvimento espiritual
                    </CardDescription>
                  </div>
                  <Dialog open={isGoalsDialogOpen} onOpenChange={setIsGoalsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Edit className="mr-2 h-4 w-4" />
                        Gerenciar Metas
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Metas de Crescimento</DialogTitle>
                        <DialogDescription>
                          Adicione ou remova suas metas espirituais.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleGoalsSubmit} className="space-y-4">
                        <div>
                          <Label>Suas Metas</Label>
                          <div className="flex gap-2 mt-2">
                            <Input
                              placeholder="Ex: Ler a Bíblia diariamente, Orar 30min/dia..."
                              value={newGoal}
                              onChange={(e) => setNewGoal(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  addToList(newGoal, goalsForm.growth_goals, (list) => 
                                    setGoalsForm({ growth_goals: list })
                                  );
                                  setNewGoal('');
                                }
                              }}
                            />
                            <Button
                              type="button"
                              onClick={() => {
                                addToList(newGoal, goalsForm.growth_goals, (list) => 
                                  setGoalsForm({ growth_goals: list })
                                );
                                setNewGoal('');
                              }}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="space-y-2 mt-2">
                            {goalsForm.growth_goals.map((goal, index) => (
                              <div key={index} className="flex items-center justify-between p-2 border rounded">
                                <span className="text-sm">{goal}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeFromList(index, goalsForm.growth_goals, (list) => 
                                    setGoalsForm({ growth_goals: list })
                                  )}
                                >
                                  ×
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>

                        <Button type="submit" className="w-full">
                          <Target className="mr-2 h-4 w-4" />
                          Salvar Metas
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {spiritualGrowth?.growth_goals?.length > 0 ? (
                  <div className="space-y-3">
                    {spiritualGrowth.growth_goals.map((goal, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                        <Target className="h-4 w-4 text-primary" />
                        <span>{goal}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Target className="mx-auto h-12 w-12 mb-4" />
                    <p>Defina suas metas de crescimento espiritual para acompanhar seu progresso.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default CrescimentoEspiritual;