
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useClientContactsForTickets } from '@/hooks/useClientContactsForTickets';

interface CreateTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userSectors: any[];
  onSuccess: () => void;
}

export const CreateTicketDialog = ({ open, onOpenChange, userSectors, onSuccess }: CreateTicketDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    sector_id: '',
    client_contact_id: '',
    priority: 'media',
    tags: ''
  });

  // Buscar funcionários para atribuição
  const { data: employees } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('id, name, email')
        .order('name');
      
      if (error) throw error;
      return data || [];
    }
  });

  // Buscar funcionários dos clientes - filtrar por setor se selecionado
  const { data: clientContacts } = useClientContactsForTickets(formData.sector_id || undefined);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = await supabase.auth.getUser();
      
      const ticketData = {
        title: formData.title,
        description: formData.description || null,
        sector_id: formData.sector_id || null,
        client_contact_id: formData.client_contact_id || null,
        priority: formData.priority,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
        created_by: user.data.user?.id as string,
        status: 'pendente' as const
      };

      const { error } = await supabase
        .from('tickets')
        .insert(ticketData);

      if (error) throw error;

      toast.success('Ticket criado com sucesso!');
      setFormData({
        title: '',
        description: '',
        sector_id: '',
        client_contact_id: '',
        priority: 'media',
        tags: ''
      });
      onSuccess();
    } catch (error) {
      console.error('Erro ao criar ticket:', error);
      toast.error('Erro ao criar ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Ticket</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Título do ticket"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descreva o problema ou solicitação"
              rows={3}
            />
          </div>

           <div className="space-y-2">
            <Label>Setor</Label>
            <Select value={formData.sector_id} onValueChange={(value) => setFormData(prev => ({ 
              ...prev, 
              sector_id: value,
              // Limpar funcionário do cliente quando mudar setor
              client_contact_id: ''
            }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um setor" />
              </SelectTrigger>
              <SelectContent>
                {userSectors
                  .filter(sector => sector?.id && sector.id.trim() !== '')
                  .map((sector) => (
                    <SelectItem key={sector.id} value={sector.id}>
                      {sector.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

           <div className="space-y-2">
            <Label>Funcionário do Cliente</Label>
            <Select 
              value={formData.client_contact_id} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, client_contact_id: value }))}
              disabled={!formData.sector_id}
            >
              <SelectTrigger>
                <SelectValue placeholder={
                  !formData.sector_id 
                    ? "Selecione um setor primeiro" 
                    : clientContacts?.length === 0
                    ? "Nenhum funcionário encontrado para este setor"
                    : "Selecione um funcionário do cliente (opcional)"
                } />
              </SelectTrigger>
              <SelectContent>
                {clientContacts?.map((contact) => (
                  <SelectItem key={contact.id} value={contact.id}>
                    {contact.name} - {contact.clients?.name}
                    {contact.position && ` (${contact.position})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Prioridade</Label>
            <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="baixa">Baixa</SelectItem>
                <SelectItem value="media">Média</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
              placeholder="tag1, tag2, tag3"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Criando...' : 'Criar Ticket'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
