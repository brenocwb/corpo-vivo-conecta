import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { UserPlus, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AssignPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planId: string;
  planTitle: string;
}

interface Member {
  id: string;
  full_name: string;
  email: string;
}

export const AssignPlanDialog = ({ open, onOpenChange, planId, planTitle }: AssignPlanDialogProps) => {
  const { profile } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [assignedMembers, setAssignedMembers] = useState<Member[]>([]);

  useEffect(() => {
    if (open) {
      fetchMembers();
      fetchAssignedMembers();
    }
  }, [open, planId]);

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('church_id', profile?.church_id)
        .order('full_name');

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Erro ao buscar membros:', error);
    }
  };

  const fetchAssignedMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('plan_progress')
        .select(`
          user_id,
          profiles:user_id (
            id,
            full_name,
            email
          )
        `)
        .eq('plan_id', planId);

      if (error) throw error;
      
      const assigned = data?.map(item => ({
        id: item.profiles.id,
        full_name: item.profiles.full_name,
        email: item.profiles.email,
      })) || [];
      
      setAssignedMembers(assigned);
    } catch (error) {
      console.error('Erro ao buscar membros atribuídos:', error);
    }
  };

  const handleAssign = async () => {
    if (!selectedMember) {
      toast.error('Selecione um membro');
      return;
    }

    setLoading(true);
    try {
      // Check if already assigned
      const { data: existing } = await supabase
        .from('plan_progress')
        .select('id')
        .eq('plan_id', planId)
        .eq('user_id', selectedMember)
        .maybeSingle();

      if (existing) {
        toast.error('Este membro já possui este plano atribuído');
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from('plan_progress')
        .insert({
          plan_id: planId,
          user_id: selectedMember,
          status: 'nao_iniciado',
          current_step: 0,
        });

      if (error) throw error;

      toast.success('Plano atribuído com sucesso!');
      setSelectedMember('');
      fetchAssignedMembers();
    } catch (error: any) {
      console.error('Erro ao atribuir plano:', error);
      toast.error('Erro ao atribuir plano: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUnassign = async (userId: string) => {
    if (!window.confirm('Deseja remover este plano do membro?')) return;

    try {
      const { error } = await supabase
        .from('plan_progress')
        .delete()
        .eq('plan_id', planId)
        .eq('user_id', userId);

      if (error) throw error;

      toast.success('Plano removido do membro');
      fetchAssignedMembers();
    } catch (error: any) {
      toast.error('Erro ao remover plano: ' + error.message);
    }
  };

  const filteredMembers = members.filter(member => 
    member.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Atribuir Plano a Membros</DialogTitle>
          <DialogDescription>
            Plano: {planTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Assign new member */}
          <div className="space-y-3">
            <Label>Atribuir a um Novo Membro</Label>
            <div className="flex gap-2">
              <Select value={selectedMember} onValueChange={setSelectedMember}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Selecione um membro" />
                </SelectTrigger>
                <SelectContent>
                  <div className="p-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar membro..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <ScrollArea className="h-[200px]">
                    {filteredMembers.map(member => (
                      <SelectItem key={member.id} value={member.id}>
                        <div className="flex flex-col">
                          <span>{member.full_name}</span>
                          <span className="text-xs text-muted-foreground">{member.email}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </ScrollArea>
                </SelectContent>
              </Select>
              <Button onClick={handleAssign} disabled={loading || !selectedMember}>
                <UserPlus className="h-4 w-4 mr-2" />
                Atribuir
              </Button>
            </div>
          </div>

          {/* Currently assigned members */}
          <div className="space-y-3">
            <Label>Membros com este Plano ({assignedMembers.length})</Label>
            <ScrollArea className="h-[200px] border rounded-md p-4">
              {assignedMembers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum membro com este plano ainda
                </p>
              ) : (
                <div className="space-y-2">
                  {assignedMembers.map(member => (
                    <div key={member.id} className="flex items-center justify-between p-2 hover:bg-muted rounded">
                      <div>
                        <p className="font-medium">{member.full_name}</p>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleUnassign(member.id)}
                      >
                        Remover
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
