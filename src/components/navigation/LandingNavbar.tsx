import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LandingNavbar = () => {
  const navigate = useNavigate();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Heart className="h-8 w-8 text-primary" />
              <div className="absolute inset-0 h-8 w-8 bg-primary/20 rounded-full blur-lg"></div>
            </div>
            <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Corpo Vivo Conecta
            </h1>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#recursos" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Recursos
            </a>
            <a href="#beneficios" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Benefícios
            </a>
            <a href="#funcionalidades" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Funcionalidades
            </a>
          </div>
          
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/auth')}
              className="text-sm"
            >
              Entrar
            </Button>
            <Button 
              size="sm" 
              onClick={() => navigate('/auth')}
              className="bg-gradient-primary hover:shadow-glow transition-all duration-300"
            >
              Começar Grátis
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default LandingNavbar;