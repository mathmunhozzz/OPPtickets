import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Clock, CheckCircle, Check, X } from 'lucide-react';
import { useClientContacts } from '@/hooks/useClientContacts';
import { ClientContactDialog } from './ClientContactDialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

export const ClientContactsContent = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<any>(null);
  const { data: contacts, isLoading } = useClientContacts();
  const queryClient = useQueryClient();

  const approveMutation = useMutation({
    mutationFn: async ({ id, sectorId }: { id: string; sectorId: string }) => {
      const { error } = await supabase
        .from('funcionarios_clientes')
        .update({
          approval_status: 'approved',
          is_active: true,
          sector_id: sectorId,
          approved_by: (await supabase.auth.getUser()).data.user?.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Cadastro aprovado com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ['client-contacts'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao aprovar cadastro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('funcionarios_clientes')
        .update({
          approval_status: 'rejected',
          approved_by: (await supabase.auth.getUser()).data.user?.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Cadastro rejeitado." });
      queryClient.invalidateQueries({ queryKey: ['client-contacts'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao rejeitar cadastro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddContact = () => {
    setEditingContact(null);
    setIsDialogOpen(true);
  };

  const handleEditContact = (contact: any) => {
    setEditingContact(contact);
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  const pendingContacts = contacts?.filter(c => c.approval_status === 'pending') || [];
  const approvedContacts = contacts?.filter(c => c.approval_status === 'approved' || !c.approval_status) || [];
  const rejectedContacts = contacts?.filter(c => c.approval_status === 'rejected') || [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Funcionários de Clientes</h1>
        <Button onClick={handleAddContact}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Funcionário
        </Button>
      </div>

      {/* Pending Approvals */}
      {pendingContacts.length > 0 && (
        <div className="bg-card rounded-lg border">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              Aguardando Aprovação ({pendingContacts.length})
            </h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingContacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell className="font-medium">{contact.name}</TableCell>
                  <TableCell>{contact.email}</TableCell>
                  <TableCell>{contact.clients?.name}</TableCell>
                  <TableCell>{contact.city}</TableCell>
                  <TableCell>{contact.position}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        size="sm"
                        onClick={() => {
                          // For now, just approve without sector - you can add sector selection later
                          approveMutation.mutate({ id: contact.id, sectorId: '' });
                        }}
                        disabled={approveMutation.isPending}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Aprovar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => rejectMutation.mutate(contact.id)}
                        disabled={rejectMutation.isPending}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Rejeitar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Approved Contacts */}
      <div className="bg-card rounded-lg border">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Funcionários Aprovados ({approvedContacts.length})
          </h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Setor</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {approvedContacts.map((contact) => (
              <TableRow key={contact.id}>
                <TableCell className="font-medium">{contact.name}</TableCell>
                <TableCell>{contact.email}</TableCell>
                <TableCell>{contact.clients?.name}</TableCell>
                <TableCell>{contact.sectors?.name || 'Não definido'}</TableCell>
                <TableCell>{contact.position}</TableCell>
                <TableCell>
                  <Badge variant={contact.is_active ? "default" : "secondary"}>
                    {contact.is_active ? "Ativo" : "Inativo"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditContact(contact)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ClientContactDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        contact={editingContact}
      />
    </div>
  );
};