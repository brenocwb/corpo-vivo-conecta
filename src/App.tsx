import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminUsuarios from "./pages/admin/Usuarios";
import AdminComunicados from "./pages/admin/Comunicados";
import AdminCadastros from "./pages/admin/Cadastros";
import AdminRelatorios from "./pages/admin/Relatorios";
import AdminGrupos from "./pages/admin/Grupos";
import AdminEstudos from "./pages/admin/Estudos";
import AdminPlanos from "./pages/admin/Planos";
import LiderGrupos from "./pages/lider/Grupos";
import LiderDiscipulados from "./pages/lider/Discipulados";
import LiderReunioes from "./pages/lider/Reunioes";
import MembroPerfil from "./pages/membro/Perfil";
import MembroPlanoDetalhe from "./pages/membro/PlanoDetalhe";
import CentroOracao from "./pages/CentroOracao";
import BibliotecaRecursos from "./pages/BibliotecaRecursos";
import CrescimentoEspiritual from "./pages/CrescimentoEspiritual";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/usuarios" element={<AdminUsuarios />} />
            <Route path="/admin/comunicados" element={<AdminComunicados />} />
            <Route path="/admin/cadastros" element={<AdminCadastros />} />
            <Route path="/admin/relatorios" element={<AdminRelatorios />} />
            <Route path="/admin/grupos" element={<AdminGrupos />} />
            <Route path="/admin/estudos" element={<AdminEstudos />} />
            <Route path="/admin/planos" element={<AdminPlanos />} />
            <Route path="/lider/grupos" element={<LiderGrupos />} />
            <Route path="/lider/discipulados" element={<LiderDiscipulados />} />
            <Route path="/lider/reunioes" element={<LiderReunioes />} />
            <Route path="/centro-oracao" element={<CentroOracao />} />
            <Route path="/biblioteca-recursos" element={<BibliotecaRecursos />} />
            <Route path="/crescimento-espiritual" element={<CrescimentoEspiritual />} />
            <Route path="/meu-perfil" element={<MembroPerfil />} />
            <Route path="/plano/:planId" element={<MembroPlanoDetalhe />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
