
import { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Plus, Ticket as TicketIcon } from 'lucide-react';
import { MemoizedTicketColumn } from './MemoizedTicketColumn';
import { CreateTicketDialog } from './CreateTicketDialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { MemoizedTicketCard } from './MemoizedTicketCard';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/useDebounce';
import { TicketQuickFilters } from './TicketQuickFilters';
import { GroupHeader } from './GroupHeader';
import { useAuth } from '@/hooks/useAuth';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [clientContactFilter, setClientContactFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'priority' | 'updated'>('newest');
  const [groupBy, setGroupBy] = useState<'status' | 'priority' | 'assignee' | 'client'>('status');
  const [compactMode, setCompactMode] = useState(false);
  const [hideEmptyColumns, setHideEmptyColumns] = useState(false);
  const [showMyTickets, setShowMyTickets] = useState(false);
  const [visibleCount, setVisibleCount] = useState<Record<string, number>>({
    pendente: 10,
    em_analise: 10,
    corrigido: 10,
    negado: 10
  });
  const [savedViews, setSavedViews] = useState<Record<string, any>>({});
  
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
        delay: 100,
        tolerance: 5,
      },
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
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Buscar tickets com relações otimizadas
  const { data: allTickets, refetch } = useQuery({
    queryKey: ['visible-tickets'],
    queryFn: async () => {
      // Buscar tickets com relacionamentos em uma query
      const { data: ticketsData, error } = await supabase
        .from('tickets')
        .select(`
          *,
          sectors:sector_id (id, name),
          employees:assigned_to (id, name),
          funcionarios_clientes:client_contact_id (
            id,
            name,
            clients:client_id (
              id,
              name
            )
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      if (!ticketsData?.length) return [];

      // Buscar nomes dos criadores via função segura
      const ticketIds = ticketsData.map(t => t.id);
      const { data: creatorNames } = await supabase
        .rpc('get_ticket_creator_names', { ticket_ids: ticketIds });

      // Mapear nomes por ticket_id
      const creatorNameMap = new Map(
        creatorNames?.map((item: any) => [item.ticket_id, item.creator_name]) || []
      );

      // Combinar os dados
      const processedTickets = ticketsData.map(ticket => ({
        ...ticket,
        creator_name: creatorNameMap.get(ticket.id) || 'Usuário'
      }));
      
      return processedTickets;
    },
    staleTime: 30 * 1000, // 30 seconds
  });

  // Filtrar e ordenar tickets (memoizado)
  const tickets = useMemo(() => {
    let filtered = selectedSector === 'all' 
      ? allTickets 
      : allTickets?.filter(ticket => ticket.sector_id === selectedSector);
    
    if (!filtered) return [];

    // Filtro "Meus Tickets"
    if (showMyTickets && user) {
      filtered = filtered.filter(ticket => 
        ticket.created_by === user.id
        // Note: Para verificar se é responsável, precisaríamos de uma query adicional
        // ou incluir auth_user_id na query principal
      );
    }

    // Filtro de busca (incluindo cliente e responsável)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(ticket => 
        ticket.title?.toLowerCase().includes(searchLower) ||
        ticket.description?.toLowerCase().includes(searchLower) ||
        ticket.creator_name?.toLowerCase().includes(searchLower) ||
        ticket.employees?.name?.toLowerCase().includes(searchLower) ||
        ticket.funcionarios_clientes?.name?.toLowerCase().includes(searchLower) ||
        ticket.funcionarios_clientes?.clients?.name?.toLowerCase().includes(searchLower)
      );
    }

    // Filtro de prioridade
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.priority === priorityFilter);
    }

    // Filtro de responsável
    if (assigneeFilter !== 'all') {
      if (assigneeFilter === 'unassigned') {
        filtered = filtered.filter(ticket => !ticket.assigned_to);
      } else {
        filtered = filtered.filter(ticket => ticket.assigned_to === assigneeFilter);
      }
    }

    // Filtro de cliente
    if (clientContactFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.client_contact_id === clientContactFilter);
    }

    // Ordenação
    if (sortOrder === 'oldest') {
      filtered = [...filtered].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } else if (sortOrder === 'priority') {
      const priorityOrder = { alta: 3, media: 2, baixa: 1 };
      filtered = [...filtered].sort((a, b) => (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - (priorityOrder[a.priority as keyof typeof priorityOrder] || 0));
    } else if (sortOrder === 'updated') {
      filtered = [...filtered].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    } else { // newest
      filtered = [...filtered].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return filtered;
  }, [allTickets, selectedSector, searchTerm, priorityFilter, assigneeFilter, clientContactFilter, sortOrder, showMyTickets, user]);

  // Debounced refetch for performance
  const debouncedRefetch = useDebounce(refetch, 500);

  // Realtime updates optimizado
  useEffect(() => {
    const channel = supabase
      .channel('tickets-changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'tickets'
      }, debouncedRefetch)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'tickets'
      }, debouncedRefetch)
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'tickets'
      }, debouncedRefetch)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [debouncedRefetch]);

  // Memoizar groupBy para evitar recálculos
  const ticketsByGroup = useMemo(() => {
    if (!tickets) return {};

    if (groupBy === 'status') {
      return tickets.reduce((acc, ticket) => {
        const status = ticket.status || 'pendente';
        if (!acc[status]) acc[status] = [];
        acc[status].push(ticket);
        return acc;
      }, {} as Record<string, any[]>);
    } else if (groupBy === 'priority') {
      return tickets.reduce((acc, ticket) => {
        const priority = ticket.priority || 'media';
        if (!acc[priority]) acc[priority] = [];
        acc[priority].push(ticket);
        return acc;
      }, {} as Record<string, any[]>);
    } else if (groupBy === 'assignee') {
      return tickets.reduce((acc, ticket) => {
        const assignee = ticket.employees?.name || 'Sem responsável';
        if (!acc[assignee]) acc[assignee] = [];
        acc[assignee].push(ticket);
        return acc;
      }, {} as Record<string, any[]>);
    } else if (groupBy === 'client') {
      return tickets.reduce((acc, ticket) => {
        const client = ticket.funcionarios_clientes?.clients?.name || 'Sem cliente';
        if (!acc[client]) acc[client] = [];
        acc[client].push(ticket);
        return acc;
      }, {} as Record<string, any[]>);
    }

    return {};
  }, [tickets, groupBy]);

  // Configuração de grupos
  const getGroupConfig = (groupKey: string) => {
    if (groupBy === 'status') {
      return statusConfig[groupKey as keyof typeof statusConfig] || { 
        label: groupKey, 
        color: 'from-gray-500 to-gray-600', 
        bgColor: 'from-gray-50 to-gray-100' 
      };
    } else if (groupBy === 'priority') {
      const priorityConfig = {
        alta: { label: 'Alta Prioridade', color: 'from-red-500 to-red-600', bgColor: 'from-red-50 to-red-100' },
        media: { label: 'Média Prioridade', color: 'from-yellow-500 to-yellow-600', bgColor: 'from-yellow-50 to-yellow-100' },
        baixa: { label: 'Baixa Prioridade', color: 'from-green-500 to-green-600', bgColor: 'from-green-50 to-green-100' }
      };
      return priorityConfig[groupKey as keyof typeof priorityConfig] || { 
        label: groupKey, 
        color: 'from-gray-500 to-gray-600', 
        bgColor: 'from-gray-50 to-gray-100' 
      };
    } else {
      return { 
        label: groupKey, 
        color: 'from-blue-500 to-blue-600', 
        bgColor: 'from-blue-50 to-blue-100' 
      };
    }
  };

  // Função para carregar mais tickets em uma coluna
  const loadMoreTickets = (status: string) => {
    setVisibleCount(prev => ({
      ...prev,
      [status]: prev[status] + 10
    }));
  };

  // Função para resetar contadores ao filtrar
  const resetVisibleCounts = () => {
    setVisibleCount({
      pendente: 10,
      em_analise: 10,
      corrigido: 10,
      negado: 10
    });
  };

  // Reset contadores quando filtros mudam
  useEffect(() => {
    resetVisibleCounts();
  }, [searchTerm, priorityFilter, assigneeFilter, clientContactFilter, selectedSector, groupBy]);

  // Salvar e carregar preferências
  useEffect(() => {
    const saved = localStorage.getItem('ticket-board-preferences');
    if (saved) {
      try {
        const preferences = JSON.parse(saved);
        setCompactMode(preferences.compactMode || false);
        setHideEmptyColumns(preferences.hideEmptyColumns || false);
        setGroupBy(preferences.groupBy || 'status');
      } catch (error) {
        console.error('Error loading preferences:', error);
      }
    }
  }, []);

  useEffect(() => {
    const preferences = {
      compactMode,
      hideEmptyColumns,
      groupBy
    };
    localStorage.setItem('ticket-board-preferences', JSON.stringify(preferences));
  }, [compactMode, hideEmptyColumns, groupBy]);

  // Contar filtros ativos
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    if (priorityFilter !== 'all') count++;
    if (assigneeFilter !== 'all') count++;
    if (clientContactFilter !== 'all') count++;
    if (showMyTickets) count++;
    return count;
  }, [searchTerm, priorityFilter, assigneeFilter, clientContactFilter, showMyTickets]);

  // Função para limpar todos os filtros
  const clearAllFilters = () => {
    setSearchTerm('');
    setPriorityFilter('all');
    setAssigneeFilter('all');
    setClientContactFilter('all');
    setShowMyTickets(false);
    setSortOrder('newest');
    resetVisibleCounts();
  };

  const handleDragStart = (event: DragStartEvent) => {
    const ticket = tickets?.find(t => t.id === event.active.id);
    setActiveTicket(ticket);
  };

const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTicket(null);

    console.log('🔄 Drag End Event:', { active: active?.id, over: over?.id });

    if (!over || !active) {
      console.log('❌ No over or active element');
      return;
    }

    const ticketId = active.id as string;
    const newStatus = over.id as string;
    
    console.log('📊 Moving ticket:', { ticketId, newStatus });
    
    // Verificar se é um status válido
    if (!statusConfig[newStatus as keyof typeof statusConfig]) {
      console.log('❌ Invalid status:', newStatus);
      return;
    }

    const currentTickets = (queryClient.getQueryData<any[]>(['visible-tickets']) ?? []);
    const moving = currentTickets.find((t: any) => t.id === ticketId);
    
    console.log('🎯 Found ticket:', { moving: !!moving, currentStatus: moving?.status, newStatus });
    
    if (!moving || moving.status === newStatus) {
      console.log('❌ No ticket found or same status');
      return;
    }

    console.log('✅ Starting optimistic update...');
    
    // Otimismo: mover imediatamente no cache
    queryClient.setQueryData<any[]>(['visible-tickets'], (old) => {
      if (!old) return old as any;
      const updated = old.map((t: any) => (t.id === ticketId ? { ...t, status: newStatus } : t));
      console.log('🔄 Cache updated', { 
        oldTicket: old.find(t => t.id === ticketId)?.status, 
        newTicket: updated.find(t => t.id === ticketId)?.status 
      });
      return updated;
    });

    try {
      console.log('📡 Updating database...');
      const { data, error } = await supabase
        .from('tickets')
        .update({ status: newStatus as 'pendente' | 'em_analise' | 'corrigido' | 'negado' })
        .eq('id', ticketId)
        .select('id');

      if (error) throw error;
      
      // Check if any rows were actually updated (RLS might prevent updates)
      if (!data || data.length === 0) {
        throw new Error('Sem permissão para mover este ticket ou ticket não encontrado');
      }
      
      console.log('✅ Database updated successfully');
      toast.success(`Ticket movido para ${statusConfig[newStatus as keyof typeof statusConfig].label}`);
      // Garante dados frescos (ex.: updated_at)
      refetch();
    } catch (error) {
      console.log('❌ Database update failed, reverting...', error);
      // Reverter em caso de erro
      queryClient.setQueryData(['visible-tickets'], currentTickets);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao mover ticket. Tente novamente.';
      console.error('Erro ao mover ticket:', error);
      toast.error(errorMessage);
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
              
              {/* Filtros e controles */}
              <TicketQuickFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                priorityFilter={priorityFilter}
                onPriorityChange={setPriorityFilter}
                assigneeFilter={assigneeFilter}
                onAssigneeChange={setAssigneeFilter}
                clientContactFilter={clientContactFilter}
                onClientContactChange={setClientContactFilter}
                sortOrder={sortOrder}
                onSortChange={setSortOrder}
                groupBy={groupBy}
                onGroupByChange={setGroupBy}
                compactMode={compactMode}
                onCompactModeChange={setCompactMode}
                hideEmptyColumns={hideEmptyColumns}
                onHideEmptyChange={setHideEmptyColumns}
                showMyTickets={showMyTickets}
                onShowMyTicketsChange={setShowMyTickets}
                onClearFilters={clearAllFilters}
                activeFiltersCount={activeFiltersCount}
              />

              <Tabs value={selectedSector} onValueChange={setSelectedSector} className="w-full">
                <TabsList className="tab-scroll flex w-full items-center gap-1 bg-white/50 backdrop-blur-sm border border-white/20 overflow-x-auto whitespace-nowrap p-1">
                  <TabsTrigger value="all" className="data-[state=active]:bg-white/80 min-w-max px-3 py-2 text-sm">
                    Todos
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {allTickets?.length || 0}
                    </Badge>
                  </TabsTrigger>
                  {userSectors?.map((sector) => (
                    <TabsTrigger 
                      key={sector.id} 
                      value={sector.id}
                      className="data-[state=active]:bg-white/80 min-w-max px-3 py-2 text-sm"
                    >
                      {sector.name}
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {allTickets?.filter(ticket => ticket.sector_id === sector.id).length || 0}
                      </Badge>
                    </TabsTrigger>
                  ))}
                </TabsList>

                <div className="mt-6">
                  {/* Indicadores de grupos */}
                  <div className="flex gap-2 mb-4 flex-wrap justify-center sm:justify-start">
                    {Object.entries(ticketsByGroup)
                      .filter(([, tickets]) => !hideEmptyColumns || tickets.length > 0)
                      .map(([groupKey, tickets]) => {
                        const config = getGroupConfig(groupKey);
                        return (
                          <Badge 
                            key={groupKey} 
                            variant="outline" 
                            className="flex items-center gap-1 bg-white/50 backdrop-blur-sm border-white/30 px-2 py-1 text-xs sm:text-sm"
                          >
                            <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${config.color}`} />
                            <span className="hidden sm:inline">{config.label}</span>
                            <span className="sm:hidden">{config.label.slice(0, 3)}</span>
                            <span className="bg-white/60 px-1.5 py-0.5 rounded text-xs">
                              {tickets.length}
                            </span>
                          </Badge>
                        );
                      })}
                  </div>

                  <TabsContent value={selectedSector} className="mt-0">
                    {groupBy === 'status' ? (
                      // Layout tradicional em colunas para status
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 h-[calc(100vh-400px)]">
                        {Object.entries(statusConfig)
                          .filter(([status]) => !hideEmptyColumns || (ticketsByGroup[status]?.length || 0) > 0)
                          .map(([status, config]) => (
                            <MemoizedTicketColumn
                              key={status}
                              status={status}
                              title={config.label}
                              tickets={ticketsByGroup[status] || []}
                              visibleCount={visibleCount[status] || 10}
                              onLoadMore={() => loadMoreTickets(status)}
                              color={config.color}
                              bgColor={config.bgColor}
                              compactMode={compactMode}
                              onRefetch={refetch}
                            />
                          ))}
                      </div>
                    ) : (
                      // Layout em grupos para outros agrupamentos
                      <div className="space-y-4">
                        {Object.entries(ticketsByGroup)
                          .filter(([, tickets]) => !hideEmptyColumns || tickets.length > 0)
                          .map(([groupKey, groupTickets]) => {
                            const config = getGroupConfig(groupKey);
                            
                            // Para agrupamentos não-status, ainda mostramos subcolunas por status
                            const ticketsByStatus = groupTickets.reduce((acc, ticket) => {
                              const status = ticket.status || 'pendente';
                              if (!acc[status]) acc[status] = [];
                              acc[status].push(ticket);
                              return acc;
                            }, {} as Record<string, any[]>);

                            return (
                              <GroupHeader
                                key={groupKey}
                                title={config.label}
                                count={groupTickets.length}
                                color={config.color}
                                bgColor={config.bgColor}
                              >
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                  {Object.entries(statusConfig)
                                    .filter(([status]) => !hideEmptyColumns || (ticketsByStatus[status]?.length || 0) > 0)
                                    .map(([status, statusConfig]) => (
                                      <MemoizedTicketColumn
                                        key={`${groupKey}-${status}`}
                                        status={`${groupKey}-${status}`}
                                        title={statusConfig.label}
                                        tickets={ticketsByStatus[status] || []}
                                        visibleCount={visibleCount[status] || 10}
                                        onLoadMore={() => loadMoreTickets(status)}
                                        color={statusConfig.color}
                                        bgColor={statusConfig.bgColor}
                                        compactMode={compactMode}
                                        onRefetch={refetch}
                                      />
                                    ))}
                                </div>
                              </GroupHeader>
                            );
                          })}
                      </div>
                    )}
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
              <MemoizedTicketCard ticket={activeTicket} onRefetch={refetch} />
            </div>
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
};
