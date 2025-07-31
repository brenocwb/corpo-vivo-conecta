import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Users, Home, BookOpen, Loader2 } from 'lucide-react';
import LandingNavbar from '@/components/navigation/LandingNavbar';

const Index = () => {
  const { user, profile, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('Index useEffect:', { loading, user: !!user, profile });
    
    if (!loading && user && profile) {
      // Only redirect if we have complete user data
      console.log('Redirecting user with role:', profile.role);
      
      // Add a small delay to prevent flashing
      const timer = setTimeout(() => {
        switch (profile.role) {
          case 'admin':
          case 'pastor':
            navigate('/admin/dashboard', { replace: true });
            break;
          case 'lider':
            navigate('/lider/grupos', { replace: true });
            break;
          case 'membro':
          case 'missionario':
            navigate('/meu-perfil', { replace: true });
            break;
          default:
            console.warn('Unknown role:', profile.role);
            navigate('/meu-perfil', { replace: true });
            break;
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [user, profile, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <LandingNavbar />
        {/* Hero Section */}
        <section className="relative py-32 px-6 overflow-hidden pt-40">
          <div className="absolute inset-0 bg-gradient-hero opacity-10"></div>
          <div className="relative max-w-6xl mx-auto text-center">
            <div className="flex items-center justify-center mb-8 animate-fade-in">
              <div className="relative">
                <Heart className="h-16 w-16 text-primary mr-4 animate-float" />
                <div className="absolute inset-0 h-16 w-16 mr-4 bg-primary/20 rounded-full blur-xl"></div>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Corpo Vivo Conecta
              </h1>
            </div>
            <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed animate-fade-in">
              Plataforma completa para <span className="text-primary font-semibold">discipulado cristão</span> que conecta cada pessoa, 
              fortalece relacionamentos e <span className="text-primary font-semibold">multiplica líderes</span> de forma natural.
            </p>
            
            {/* Feature highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto animate-fade-in">
              <div className="bg-card/50 backdrop-blur-sm p-4 rounded-lg border">
                <Users className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-sm font-medium">Gestão de Grupos</p>
              </div>
              <div className="bg-card/50 backdrop-blur-sm p-4 rounded-lg border">
                <BookOpen className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-sm font-medium">Discipulado Personalizado</p>
              </div>
              <div className="bg-card/50 backdrop-blur-sm p-4 rounded-lg border">
                <Home className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-sm font-medium">Igreja no Lar</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center animate-fade-in">
              <Button 
                size="lg" 
                className="bg-gradient-primary hover:shadow-glow transition-all duration-300 text-lg px-8 py-6"
                onClick={() => navigate('/auth')}
              >
                Comece Gratuitamente
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-primary text-primary hover:bg-primary/10 transition-all duration-300 text-lg px-8 py-6"
                onClick={() => navigate('/auth')}
              >
                Fazer Login
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="recursos" className="py-24 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Para Igrejas que <span className="bg-gradient-primary bg-clip-text text-transparent">Cuidam de Pessoas</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Ferramentas poderosas para fortalecer relacionamentos e promover crescimento espiritual
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="group hover:shadow-elegant transition-all duration-300 border-0 bg-card/50 backdrop-blur-sm">
                <CardHeader className="pb-6">
                  <div className="relative mb-6">
                    <Users className="h-12 w-12 text-primary group-hover:scale-110 transition-transform duration-300" />
                    <div className="absolute inset-0 h-12 w-12 bg-primary/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                  </div>
                  <CardTitle className="text-xl mb-3">Discipulado Relacional</CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    Conecte líderes e discípulos, permitindo acompanhamento pessoal 
                    e crescimento espiritual contínuo com ferramentas intuitivas.
                  </CardDescription>
                </CardHeader>
              </Card>
              
              <Card className="group hover:shadow-elegant transition-all duration-300 border-0 bg-card/50 backdrop-blur-sm">
                <CardHeader className="pb-6">
                  <div className="relative mb-6">
                    <Home className="h-12 w-12 text-primary group-hover:scale-110 transition-transform duration-300" />
                    <div className="absolute inset-0 h-12 w-12 bg-primary/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                  </div>
                  <CardTitle className="text-xl mb-3">Igreja no Lar</CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    Gerencie grupos familiares com agenda inteligente, controle de presença, 
                    estudos personalizados e acompanhamento de visitantes.
                  </CardDescription>
                </CardHeader>
              </Card>
              
              <Card className="group hover:shadow-elegant transition-all duration-300 border-0 bg-card/50 backdrop-blur-sm">
                <CardHeader className="pb-6">
                  <div className="relative mb-6">
                    <BookOpen className="h-12 w-12 text-primary group-hover:scale-110 transition-transform duration-300" />
                    <div className="absolute inset-0 h-12 w-12 bg-primary/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                  </div>
                  <CardTitle className="text-xl mb-3">Crescimento Organizado</CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    Alertas automáticos, relatórios detalhados e ferramentas para uma 
                    liderança descentralizada, saudável e eficiente.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* System Features Section */}
        <section id="funcionalidades" className="py-24 px-6 bg-muted/30">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Recursos Completos do Sistema
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Tudo que você precisa para gerenciar sua igreja de forma eficiente
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-card/60 backdrop-blur-sm p-6 rounded-lg border hover:border-primary/50 transition-colors">
                <Users className="h-8 w-8 text-primary mb-4" />
                <h3 className="font-semibold mb-2">Gestão de Membros</h3>
                <p className="text-sm text-muted-foreground">Cadastro completo, perfis detalhados e organização hierárquica</p>
              </div>
              
              <div className="bg-card/60 backdrop-blur-sm p-6 rounded-lg border hover:border-primary/50 transition-colors">
                <Home className="h-8 w-8 text-primary mb-4" />
                <h3 className="font-semibold mb-2">Grupos Familiares</h3>
                <p className="text-sm text-muted-foreground">Criação, agendamento e controle de presença</p>
              </div>
              
              <div className="bg-card/60 backdrop-blur-sm p-6 rounded-lg border hover:border-primary/50 transition-colors">
                <BookOpen className="h-8 w-8 text-primary mb-4" />
                <h3 className="font-semibold mb-2">Estudos Bíblicos</h3>
                <p className="text-sm text-muted-foreground">Biblioteca de estudos personalizáveis e categorizados</p>
              </div>
              
              <div className="bg-card/60 backdrop-blur-sm p-6 rounded-lg border hover:border-primary/50 transition-colors">
                <Heart className="h-8 w-8 text-primary mb-4" />
                <h3 className="font-semibold mb-2">Discipulado</h3>
                <p className="text-sm text-muted-foreground">Acompanhamento pessoal e encontros programados</p>
              </div>
            </div>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-card/60 backdrop-blur-sm p-6 rounded-lg border hover:border-primary/50 transition-colors">
                <div className="h-8 w-8 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                  <div className="h-4 w-4 bg-primary rounded-full"></div>
                </div>
                <h3 className="font-semibold mb-2">Eventos & Reuniões</h3>
                <p className="text-sm text-muted-foreground">Calendário inteligente e organização de eventos</p>
              </div>
              
              <div className="bg-card/60 backdrop-blur-sm p-6 rounded-lg border hover:border-primary/50 transition-colors">
                <div className="h-8 w-8 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                  <div className="h-4 w-4 bg-primary rounded-full"></div>
                </div>
                <h3 className="font-semibold mb-2">Relatórios</h3>
                <p className="text-sm text-muted-foreground">Dashboards e métricas para tomada de decisão</p>
              </div>
              
              <div className="bg-card/60 backdrop-blur-sm p-6 rounded-lg border hover:border-primary/50 transition-colors">
                <div className="h-8 w-8 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                  <div className="h-4 w-4 bg-primary rounded-full"></div>
                </div>
                <h3 className="font-semibold mb-2">Alertas</h3>
                <p className="text-sm text-muted-foreground">Notificações automáticas e lembretes importantes</p>
              </div>
              
              <div className="bg-card/60 backdrop-blur-sm p-6 rounded-lg border hover:border-primary/50 transition-colors">
                <div className="h-8 w-8 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                  <div className="h-4 w-4 bg-primary rounded-full"></div>
                </div>
                <h3 className="font-semibold mb-2">Integrações</h3>
                <p className="text-sm text-muted-foreground">WhatsApp e Google Calendar para melhor comunicação</p>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section id="beneficios" className="py-24 px-6 bg-accent/30">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <h3 className="text-3xl md:text-4xl font-bold mb-6">
                  Transforme a forma como sua igreja se conecta
                </h3>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
                      <div className="h-2 w-2 bg-primary-foreground rounded-full"></div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Relacionamentos Mais Profundos</h4>
                      <p className="text-muted-foreground">Facilite conexões autênticas entre membros da igreja através de grupos pequenos e discipulado.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
                      <div className="h-2 w-2 bg-primary-foreground rounded-full"></div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Liderança Multiplicada</h4>
                      <p className="text-muted-foreground">Equipe e capacite líderes com ferramentas que facilitam o cuidado pastoral descentralizado.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
                      <div className="h-2 w-2 bg-primary-foreground rounded-full"></div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Crescimento Sustentável</h4>
                      <p className="text-muted-foreground">Acompanhe métricas importantes e tome decisões baseadas em dados para um crescimento saudável.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-primary rounded-3xl blur-3xl opacity-20"></div>
                <Card className="relative border-0 bg-card/80 backdrop-blur-sm p-8 shadow-elegant">
                  <CardHeader className="p-0 pb-6">
                    <CardTitle className="text-2xl">Comece hoje mesmo</CardTitle>
                    <CardDescription className="text-base">
                      Configure sua igreja em poucos minutos e comece a fortalecer relacionamentos.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ul className="space-y-3 text-sm">
                      <li className="flex items-center gap-3">
                        <Heart className="h-4 w-4 text-primary" />
                        Setup rápido e intuitivo
                      </li>
                      <li className="flex items-center gap-3">
                        <Users className="h-4 w-4 text-primary" />
                        Suporte completo para sua equipe
                      </li>
                      <li className="flex items-center gap-3">
                        <BookOpen className="h-4 w-4 text-primary" />
                        Recursos de discipulado prontos
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32 px-6 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-hero opacity-5"></div>
          <div className="relative max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-primary bg-clip-text text-transparent">Cada casa é uma igreja</span>
            </h2>
            <p className="text-xl md:text-2xl text-muted-foreground mb-12 leading-relaxed">
              Cada líder é um discipulador. Cada pessoa é cuidada.<br />
              <span className="text-lg">Junte-se a centenas de igrejas que já transformaram sua forma de cuidar.</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Button 
                size="lg" 
                className="bg-gradient-primary hover:shadow-glow transition-all duration-300 text-lg px-12 py-6"
                onClick={() => navigate('/auth')}
              >
                Comece Agora - É Grátis
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="border-primary text-primary hover:bg-primary-light transition-all duration-300 text-lg px-12 py-6"
                onClick={() => navigate('/auth')}
              >
                Saiba Mais
              </Button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (user && profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Bem-vindo, {profile.full_name}!</CardTitle>
            <CardDescription>
              Função: {profile.role}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                Redirecionando para sua área...
              </p>
              <Button onClick={signOut} variant="outline">
                Sair
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (user && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Perfil Incompleto</CardTitle>
            <CardDescription>
              Seu perfil não foi encontrado no sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                Entre em contato com o administrador da sua igreja para completar seu cadastro.
              </p>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Email: {user.email}
                </p>
                <Button onClick={signOut} variant="outline" className="w-full">
                  Sair e Tentar Novamente
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
};

export default Index;
