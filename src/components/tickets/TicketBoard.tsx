
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Plus, Ticket as TicketIcon } from 'lucide-react';
import { TicketColumn } from './TicketColumn';
import { CreateTicketDialog } from './CreateTicketDialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { TicketCard } from './TicketCard';
import { toast } from 'sonner';

const statusConfig = {
  pendente: { label: 'Pendente', color: 'from-blue-500 to-blue-600', bgColor: 'from-blue-50 to-blue-100' },
  em_analise: { label: 'Em Análise', color: 'from-yellow-500 to-yellow-600', bgColor: 'from-yellow-50 to-yellow-100' },
  corrigido: { label: 'Corrigido', color: 'from-green-500 to-green-600', bgColor: 'from-green-50 to-green-100' },
  negado: { label: 'Negado', color: 'from-red-500 to-red-600', bgColor: 'from-red-50 to-red-100' }
};

export const TicketBoard = () => {
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [activeTicket, setActiveTicket] = useState<any>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

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

  // Buscar tickets simples primeiro
  const { data: allTickets, refetch } = useQuery({
    queryKey: ['visible-tickets'],
    queryFn: async () => {
      // Primeiro, buscar todos os tickets
      const { data: ticketsData, error } = await supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      if (!ticketsData?.length) return [];

      // Buscar dados dos criadores (profiles)
      const creatorIds = [...new Set(ticketsData.map(t => t.created_by))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name')
        .in('user_id', creatorIds);

      // Buscar dados dos setores
      const sectorIds = [...new Set(ticketsData.map(t => t.sector_id).filter(Boolean))];
      const { data: sectors } = await supabase
        .from('sectors')
        .select('id, name')
        .in('id', sectorIds);

      // Buscar dados dos responsáveis
      const employeeIds = [...new Set(ticketsData.map(t => t.assigned_to).filter(Boolean))];
      const { data: employees } = await supabase
        .from('employees')
        .select('id, name')
        .in('id', employeeIds);

      // Combinar os dados
      const processedTickets = ticketsData.map(ticket => ({
        ...ticket,
        creator_name: profiles?.find(p => p.user_id === ticket.created_by)?.name || 'Usuário',
        sectors: sectors?.find(s => s.id === ticket.sector_id) || null,
        employees: employees?.find(e => e.id === ticket.assigned_to) || null
      }));
      
      return processedTickets;
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

  const handleDragStart = (event: DragStartEvent) => {
    const ticket = tickets?.find(t => t.id === event.active.id);
    setActiveTicket(ticket);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTicket(null);

    if (!over || !active) return;

    const ticketId = active.id as string;
    const newStatus = over.id as string;
    
    // Verificar se é um status válido
    if (!statusConfig[newStatus as keyof typeof statusConfig]) return;

    const ticket = tickets?.find(t => t.id === ticketId);
    if (!ticket || ticket.status === newStatus) return;

    try {
      const { error } = await supabase
        .from('tickets')
        .update({ status: newStatus as 'pendente' | 'em_analise' | 'corrigido' | 'negado' })
        .eq('id', ticketId);

      if (error) throw error;
      
      toast.success(`Ticket movido para ${statusConfig[newStatus as keyof typeof statusConfig].label}`);
      refetch();
    } catch (error) {
      console.error('Erro ao mover ticket:', error);
      toast.error('Erro ao mover ticket');
    }
  };

  return (
    <DndContext 
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
          <div className="backdrop-blur-sm bg-white/30 border-b border-white/20 p-4 sm:p-6">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 backdrop-blur-sm">
                    <TicketIcon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                      Tickets
                    </h1>
                    <p className="text-muted-foreground text-responsive">Gerencie tickets de ordem e serviço</p>
                  </div>
                </div>
                <Button 
                  onClick={() => setCreateDialogOpen(true)}
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
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
                    <div className="grid-responsive grid gap-4 md:gap-6">
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

        <DragOverlay>
          {activeTicket ? (
            <div className="rotate-6 opacity-80">
              <TicketCard ticket={activeTicket} onRefetch={refetch} />
            </div>
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
};
