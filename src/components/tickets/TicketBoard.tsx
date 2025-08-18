
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Plus, Ticket as TicketIcon } from 'lucide-react';
import { TicketColumn } from './TicketColumn';
import { CreateTicketDialog } from './CreateTicketDialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const statusConfig = {
  pendente: { label: 'Pendente', color: 'from-blue-500 to-blue-600', bgColor: 'from-blue-50 to-blue-100' },
  em_analise: { label: 'Em Análise', color: 'from-yellow-500 to-yellow-600', bgColor: 'from-yellow-50 to-yellow-100' },
  corrigido: { label: 'Corrigido', color: 'from-green-500 to-green-600', bgColor: 'from-green-50 to-green-100' },
  negado: { label: 'Negado', color: 'from-red-500 to-red-600', bgColor: 'from-red-50 to-red-100' }
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

  // Buscar tickets usando query direta primeiro
  const { data: allTickets, refetch } = useQuery({
    queryKey: ['visible-tickets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  // Filtrar tickets por setor selecionado
  const tickets = selectedSector === 'all' 
    ? allTickets 
    : allTickets?.filter(ticket => ticket.sector_id === selectedSector);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="backdrop-blur-sm bg-white/30 border-b border-white/20 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 backdrop-blur-sm">
                <TicketIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  Tickets
                </h1>
                <p className="text-muted-foreground">Gerencie tickets de ordem e serviço</p>
              </div>
            </div>
            <Button 
              onClick={() => setCreateDialogOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Ticket
            </Button>
          </div>

          <Tabs value={selectedSector} onValueChange={setSelectedSector} className="w-full">
            <TabsList className="tab-scroll flex w-full items-center gap-1 bg-white/50 backdrop-blur-sm border border-white/20 overflow-x-auto whitespace-nowrap">
              <TabsTrigger value="all" className="data-[state=active]:bg-white/80 min-w-max">
                Todos os Setores
              </TabsTrigger>
              {userSectors?.map((sector) => (
                <TabsTrigger 
                  key={sector.id} 
                  value={sector.id}
                  className="data-[state=active]:bg-white/80 min-w-max"
                >
                  {sector.name}
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="mt-6">
              <div className="flex gap-2 mb-4 flex-wrap">
                {Object.entries(statusConfig).map(([status, config]) => (
                  <Badge 
                    key={status} 
                    variant="outline" 
                    className="flex items-center gap-1 bg-white/50 backdrop-blur-sm border-white/30"
                  >
                    <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${config.color}`} />
                    {config.label} ({ticketsByStatus[status]?.length || 0})
                  </Badge>
                ))}
              </div>

              <TabsContent value={selectedSector} className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {Object.entries(statusConfig).map(([status, config]) => (
                    <TicketColumn
                      key={status}
                      status={status}
                      title={config.label}
                      tickets={ticketsByStatus[status] || []}
                      color={config.color}
                      bgColor={config.bgColor}
                      onRefetch={refetch}
                    />
                  ))}
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
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
