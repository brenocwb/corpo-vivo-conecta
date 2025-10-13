import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUnreadAlerts } from '@/hooks/useUnreadAlerts';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  Heart,
  Home,
  Users,
  BookOpen,
  BarChart3,
  UserPlus,
  Calendar,
  Settings,
  LogOut,
  Menu,
  User,
  Library,
  TrendingUp,
  Megaphone,
  UserCheck,
  Bell
} from 'lucide-react';

const Navbar = () => {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = useUnreadAlerts();

  if (!profile) return null;

  const getNavItems = () => {
    const commonItems = [
      { href: '/centro-oracao', label: 'Centro de Oração', icon: Heart },
      { href: '/biblioteca-recursos', label: 'Biblioteca', icon: Library },
      { href: '/crescimento-espiritual', label: 'Crescimento', icon: TrendingUp },
    ];

    // Role agora vem de user_roles via useAuth
    switch (profile.role) {
      case 'admin':
      case 'pastor':
        return [
          { href: '/admin/dashboard', label: 'Dashboard', icon: BarChart3 },
          { href: '/admin/usuarios', label: 'Usuários', icon: UserCheck },
          { href: '/admin/comunicados', label: 'Comunicados', icon: Megaphone },
          { href: '/admin/cadastros', label: 'Cadastros', icon: UserPlus },
          { href: '/admin/grupos', label: 'Grupos', icon: Home },
          { href: '/admin/estudos', label: 'Estudos', icon: BookOpen },
          { href: '/admin/planos', label: 'Planos', icon: BookOpen },
          { href: '/admin/relatorios', label: 'Relatórios', icon: BarChart3 },
          ...commonItems,
        ];
      case 'lider':
        return [
          { href: '/lider/grupos', label: 'Grupos', icon: Home },
          { href: '/lider/discipulados', label: 'Discipulados', icon: BookOpen },
          { href: '/lider/reunioes', label: 'Reuniões', icon: Calendar },
          ...commonItems,
        ];
      default:
        return [
          ...commonItems,
          { href: '/meu-perfil', label: 'Meu Perfil', icon: User },
        ];
    }
  };

  const navItems = getNavItems();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const NavContent = () => (
    <>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.href;
        
        return (
          <Link
            key={item.href}
            to={item.href}
            className={`flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors text-sm whitespace-nowrap ${
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            }`}
            onClick={() => setIsOpen(false)}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </>
  );

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            <Link to="/" className="flex items-center gap-2">
              <Heart className="h-7 w-7 text-primary" />
              <span className="font-bold text-lg hidden lg:block">Corpo Vivo Conecta</span>
              <span className="font-bold text-lg lg:hidden">CVC</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2 flex-1 mx-4 overflow-x-auto scrollbar-hide">
            <div className="flex items-center gap-1 px-2">
              <NavContent />
            </div>
          </div>

          {/* User Menu - Desktop */}
          <div className="hidden md:flex items-center gap-2 flex-shrink-0">
            {/* Notifications Badge */}
            {(profile.role === 'admin' || profile.role === 'pastor' || profile.role === 'lider') && (
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => navigate('/admin/dashboard')}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
              </Button>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getInitials(profile.full_name)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {profile.full_name}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {profile.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/meu-perfil" className="flex items-center cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Perfil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.open('/MANUAL_SISTEMA.md', '_blank')}>
                  <BookOpen className="mr-2 h-4 w-4" />
                  Manual do Sistema
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Configurações
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden flex items-center">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Abrir menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <div className="flex items-center gap-2 mb-6">
                  <Heart className="h-6 w-6 text-primary" />
                  <span className="font-bold">Corpo Vivo Conecta</span>
                </div>
                
                <div className="flex flex-col space-y-2 mb-6">
                  <NavContent />
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials(profile.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{profile.full_name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {profile.email}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Link
                      to="/meu-perfil"
                      className="flex items-center gap-3 px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
                      onClick={() => setIsOpen(false)}
                    >
                      <User className="h-4 w-4" />
                      Perfil
                    </Link>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={handleSignOut}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sair
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
