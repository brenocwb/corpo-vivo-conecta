import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Users, Home, BookOpen, Loader2 } from 'lucide-react';

const Index = () => {
  const { user, profile, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user && profile) {
      // Redirect based on user role
      switch (profile.role) {
        case 'admin':
          navigate('/admin/dashboard');
          break;
        case 'lider':
          navigate('/lider/grupos');
          break;
        case 'membro':
          navigate('/meu-perfil');
          break;
        default:
          break;
      }
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
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center mb-6">
              <Heart className="h-12 w-12 text-primary mr-3" />
              <h1 className="text-4xl font-bold">Corpo Vivo Conecta</h1>
            </div>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Micro SaaS para igrejas que crescem de forma orgânica e relacional, 
              com discipulado vivo e cuidado intencional de pessoas.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => navigate('/auth')}>
                Entrar
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/auth')}>
                Criar Conta
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 px-6 bg-muted/50">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              Para Igrejas que Cuidam de Pessoas
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card>
                <CardHeader>
                  <Users className="h-10 w-10 text-primary mb-4" />
                  <CardTitle>Discipulado Relacional</CardTitle>
                  <CardDescription>
                    Conecte líderes e discípulos, permitindo acompanhamento pessoal 
                    e crescimento espiritual contínuo.
                  </CardDescription>
                </CardHeader>
              </Card>
              
              <Card>
                <CardHeader>
                  <Home className="h-10 w-10 text-primary mb-4" />
                  <CardTitle>Igreja no Lar</CardTitle>
                  <CardDescription>
                    Gerencie grupos familiares com agenda, presença, estudos 
                    e acompanhamento de visitantes.
                  </CardDescription>
                </CardHeader>
              </Card>
              
              <Card>
                <CardHeader>
                  <BookOpen className="h-10 w-10 text-primary mb-4" />
                  <CardTitle>Crescimento Organizado</CardTitle>
                  <CardDescription>
                    Alertas automáticos, relatórios e ferramentas para uma 
                    liderança descentralizada e saudável.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-6 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">
              Cada casa é uma igreja
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Cada líder é um discipulador. Cada pessoa é cuidada.
            </p>
            <Button size="lg" onClick={() => navigate('/auth')}>
              Comece Agora
            </Button>
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

  return null;
};

export default Index;
