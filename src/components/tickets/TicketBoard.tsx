
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { TicketColumn } from './TicketColumn';
import { CreateTicketDialog } from './CreateTicketDialog';
import { Badge } from '@/components/ui/badge';

const statusConfig = {
  pendente: { label: 'Pendente', color: 'bg-blue-500' },
  em_analise: { label: 'Em Análise', color: 'bg-yellow-500' },
  corrigido: { label: 'Corrigido', color: 'bg-green-500' },
  negado: { label: 'Negado', color: 'bg-red-500' }
};

export const TicketBoard = () => {
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Buscar setores do usuário
  const { data: userSectors } = useQuery({
    queryKey: ['user-sectors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employee_sectors')
        .select(`
          sector_id,
          sectors:sector_id (
            id,
            name
          )
        `)
        .eq('employee_id', (await supabase
          .from('employees')
          .select('id')
          .eq('auth_user_id', (await supabase.auth.getUser()).data.user?.id)
          .single()
        ).data?.id);

      if (error) throw error;
      return data?.map(es => es.sectors).filter(Boolean) || [];
    }
  });

  // Buscar tickets
  const { data: tickets, refetch } = useQuery({
    queryKey: ['tickets', selectedSector],
    queryFn: async () => {
      let query = supabase
        .from('tickets')
        .select(`
          *,
          sectors:sector_id (name),
          employees:assigned_to (name),
          profiles:created_by (name)
        `)
        .order('created_at', { ascending: false });

      if (selectedSector !== 'all') {
        query = query.eq('sector_id', selectedSector);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }
  });

  // Realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('tickets-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tickets'
      }, () => {
        refetch();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  const ticketsByStatus = tickets?.reduce((acc, ticket) => {
    const status = ticket.status || 'pendente';
    if (!acc[status]) acc[status] = [];
    acc[status].push(ticket);
    return acc;
  }, {} as Record<string, any[]>) || {};

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Tickets</h1>
          <p className="text-muted-foreground">Gerencie tickets de ordem e serviço</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Ticket
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <Select value={selectedSector} onValueChange={setSelectedSector}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por setor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os setores</SelectItem>
            {userSectors?.map((sector) => (
              <SelectItem key={sector.id} value={sector.id}>
                {sector.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          {Object.entries(statusConfig).map(([status, config]) => (
            <Badge key={status} variant="outline" className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${config.color}`} />
              {config.label} ({ticketsByStatus[status]?.length || 0})
            </Badge>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(statusConfig).map(([status, config]) => (
          <TicketColumn
            key={status}
            status={status}
            title={config.label}
            tickets={ticketsByStatus[status] || []}
            color={config.color}
            onRefetch={refetch}
          />
        ))}
      </div>

      <CreateTicketDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        userSectors={userSectors || []}
        onSuccess={() => {
          refetch();
          setCreateDialogOpen(false);
        }}
      />
    </div>
  );
};
