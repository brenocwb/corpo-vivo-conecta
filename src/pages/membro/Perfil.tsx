import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { User, Calendar, BookOpen, Target, Mail, Phone, MapPin, Heart, Users, Save, Loader2 } from 'lucide-react';
import Navbar from '@/components/navigation/Navbar';
import { toast } from 'sonner';

interface ProfileData {
  full_name: string;
  email: string;
  phone: string;
  address: string;
  birth_date: string;
  baptism_date: string;
  conversion_date: string;
  emergency_contact: string;
  emergency_phone: string;
  prayer_requests: string;
  spiritual_challenges: string;
  growth_milestones: string;
}

const MembroPerfil = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [profileData, setProfileData] = useState<ProfileData>({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    birth_date: '',
    baptism_date: '',
    conversion_date: '',
    emergency_contact: '',
    emergency_phone: '',
    prayer_requests: '',
    spiritual_challenges: '',
    growth_milestones: '',
  });

  useEffect(() => {
    if (profile) {
      setProfileData({
        full_name: profile.full_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        address: profile.address || '',
        birth_date: profile.birth_date || '',
        baptism_date: profile.baptism_date || '',
        conversion_date: profile.conversion_date || '',
        emergency_contact: profile.emergency_contact || '',
        emergency_phone: profile.emergency_phone || '',
        prayer_requests: '',
        spiritual_challenges: '',
        growth_milestones: '',
      });
    }
  }, [profile]);

  const handleSave = async () => {
    if (!profile?.id) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profileData.full_name,
          phone: profileData.phone,
          address: profileData.address,
          birth_date: profileData.birth_date || null,
          baptism_date: profileData.baptism_date || null,
          conversion_date: profileData.conversion_date || null,
          emergency_contact: profileData.emergency_contact,
          emergency_phone: profileData.emergency_phone,
          prayer_requests: profileData.prayer_requests,
          spiritual_challenges: profileData.spiritual_challenges,
          growth_milestones: profileData.growth_milestones,
        })
        .eq('id', profile.id);

      if (error) throw error;
      
      toast.success('Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      toast.error('Erro ao atualizar perfil');
    } finally {
      setSaving(false);
    }
  };

  const getRoleLabel = (role: string) => {
    const labels = {
      pastor: 'Pastor',
      missionario: 'Missionário',
      lider: 'Líder',
      admin: 'Administrador',
      membro: 'Discípulo'
    };
    return labels[role as keyof typeof labels] || role;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <Navbar />
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Meu Perfil
          </h1>
          <p className="text-muted-foreground mt-2">
            Gerencie suas informações pessoais e acompanhe seu crescimento espiritual
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <Card className="lg:col-span-1">
            <CardHeader className="text-center">
              <Avatar className="w-24 h-24 mx-auto mb-4">
                <AvatarImage src="" />
                <AvatarFallback className="text-2xl">
                  {profile?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <CardTitle>{profile?.full_name}</CardTitle>
              <CardDescription className="flex items-center justify-center gap-2">
                <Badge variant="secondary">
                  {getRoleLabel(profile?.role || 'membro')}
                </Badge>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{profile?.email}</span>
              </div>
              {profileData.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{profileData.phone}</span>
                </div>
              )}
              {profileData.address && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{profileData.address}</span>
                </div>
              )}
              {profileData.conversion_date && (
                <div className="flex items-center gap-2 text-sm">
                  <Heart className="h-4 w-4 text-muted-foreground" />
                  <span>Convertido em {new Date(profileData.conversion_date).toLocaleDateString('pt-BR')}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Profile Form */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
              <CardDescription>
                Mantenha seus dados atualizados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="full_name">Nome Completo</Label>
                  <Input
                    id="full_name"
                    value={profileData.full_name}
                    onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div>
                  <Label htmlFor="birth_date">Data de Nascimento</Label>
                  <Input
                    id="birth_date"
                    type="date"
                    value={profileData.birth_date}
                    onChange={(e) => setProfileData({ ...profileData, birth_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="baptism_date">Data do Batismo</Label>
                  <Input
                    id="baptism_date"
                    type="date"
                    value={profileData.baptism_date}
                    onChange={(e) => setProfileData({ ...profileData, baptism_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="conversion_date">Data da Conversão</Label>
                  <Input
                    id="conversion_date"
                    type="date"
                    value={profileData.conversion_date}
                    onChange={(e) => setProfileData({ ...profileData, conversion_date: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  value={profileData.address}
                  onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                  placeholder="Rua, número, bairro, cidade"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="emergency_contact">Contato de Emergência</Label>
                  <Input
                    id="emergency_contact"
                    value={profileData.emergency_contact}
                    onChange={(e) => setProfileData({ ...profileData, emergency_contact: e.target.value })}
                    placeholder="Nome do contato"
                  />
                </div>
                <div>
                  <Label htmlFor="emergency_phone">Telefone de Emergência</Label>
                  <Input
                    id="emergency_phone"
                    value={profileData.emergency_phone}
                    onChange={(e) => setProfileData({ ...profileData, emergency_phone: e.target.value })}
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="prayer_requests">Pedidos de Oração</Label>
                <Textarea
                  id="prayer_requests"
                  value={profileData.prayer_requests}
                  onChange={(e) => setProfileData({ ...profileData, prayer_requests: e.target.value })}
                  placeholder="Compartilhe seus pedidos de oração..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="spiritual_challenges">Desafios Espirituais</Label>
                <Textarea
                  id="spiritual_challenges"
                  value={profileData.spiritual_challenges}
                  onChange={(e) => setProfileData({ ...profileData, spiritual_challenges: e.target.value })}
                  placeholder="Áreas em que gostaria de crescer..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="growth_milestones">Marcos de Crescimento</Label>
                <Textarea
                  id="growth_milestones"
                  value={profileData.growth_milestones}
                  onChange={(e) => setProfileData({ ...profileData, growth_milestones: e.target.value })}
                  placeholder="Conquistas e marcos em sua jornada de fé..."
                  rows={3}
                />
              </div>

              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Alterações
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Spiritual Journey Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Jornada Espiritual
            </CardTitle>
            <CardDescription>
              Acompanhe seu crescimento e desenvolvimento na fé
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Planos de Discipulado</p>
              <p>Nenhum plano em andamento no momento.</p>
              <p className="text-sm mt-2">
                Entre em contato com seu líder para iniciar sua jornada de crescimento espiritual.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MembroPerfil;