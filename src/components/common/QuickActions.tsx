import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';
import { 
  Heart, 
  BookOpen, 
  Users, 
  Calendar, 
  UserPlus, 
  BarChart3,
  TrendingUp
} from 'lucide-react';

const QuickActions = () => {
  const { profile } = useAuth();

  const getQuickActions = () => {
    const commonActions = [
      {
        href: '/centro-oracao',
        label: 'Centro de Oração',
        description: 'Compartilhar e acompanhar pedidos',
        icon: Heart,
        color: 'text-red-500'
      },
      {
        href: '/biblioteca-recursos',
        label: 'Biblioteca',
        description: 'Acessar estudos e materiais',
        icon: BookOpen,
        color: 'text-blue-500'
      },
      {
        href: '/crescimento-espiritual',
        label: 'Crescimento',
        description: 'Acompanhar desenvolvimento',
        icon: TrendingUp,
        color: 'text-green-500'
      }
    ];

    switch (profile?.role) {
      case 'admin':
      case 'pastor':
        return [
          {
            href: '/admin/cadastros',
            label: 'Cadastros',
            description: 'Gerenciar membros e líderes',
            icon: UserPlus,
            color: 'text-purple-500'
          },
          {
            href: '/admin/grupos',
            label: 'Grupos',
            description: 'Administrar grupos familiares',
            icon: Users,
            color: 'text-orange-500'
          },
          {
            href: '/admin/relatorios',
            label: 'Relatórios',
            description: 'Métricas e análises',
            icon: BarChart3,
            color: 'text-indigo-500'
          },
          ...commonActions
        ];
      
      case 'lider':
        return [
          {
            href: '/lider/grupos',
            label: 'Meu Grupo',
            description: 'Gerenciar grupo familiar',
            icon: Users,
            color: 'text-orange-500'
          },
          {
            href: '/lider/discipulados',
            label: 'Discipulados',
            description: 'Acompanhar discípulos',
            icon: BookOpen,
            color: 'text-blue-500'
          },
          {
            href: '/lider/reunioes',
            label: 'Reuniões',
            description: 'Organizar encontros',
            icon: Calendar,
            color: 'text-green-500'
          },
          ...commonActions
        ];
      
      default:
        return [
          {
            href: '/meu-perfil',
            label: 'Meu Perfil',
            description: 'Gerenciar informações pessoais',
            icon: UserPlus,
            color: 'text-purple-500'
          },
          ...commonActions
        ];
    }
  };

  const actions = getQuickActions();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ações Rápidas</CardTitle>
        <CardDescription>
          Acesso rápido às principais funcionalidades
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.href} to={action.href}>
                <Button 
                  variant="outline" 
                  className="w-full h-auto p-4 justify-start hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <Icon className={`h-5 w-5 mt-1 ${action.color}`} />
                    <div className="text-left">
                      <div className="font-medium text-sm">{action.label}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {action.description}
                      </div>
                    </div>
                  </div>
                </Button>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActions;