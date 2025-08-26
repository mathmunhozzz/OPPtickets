import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Filter, Bookmark, User, Users, Building2, Eye, EyeOff, RotateCcw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface TicketQuickFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  priorityFilter: string;
  setPriorityFilter: (value: string) => void;
  assigneeFilter: string;
  setAssigneeFilter: (value: string) => void;
  clientContactFilter: string;
  setClientContactFilter: (value: string) => void;
  sortOrder: 'newest' | 'oldest' | 'priority' | 'updated';
  setSortOrder: (value: 'newest' | 'oldest' | 'priority' | 'updated') => void;
  groupBy: 'none' | 'priority' | 'assignee' | 'client';
  setGroupBy: (value: 'none' | 'priority' | 'assignee' | 'client') => void;
  compactMode: boolean;
  setCompactMode: (value: boolean) => void;
  hideEmptyColumns: boolean;
  setHideEmptyColumns: (value: boolean) => void;
  showMyTickets: boolean;
  setShowMyTickets: (value: boolean) => void;
  onClearAll: () => void;
  currentUserId?: string;
}

export const TicketQuickFilters = ({
  searchTerm,
  setSearchTerm,
  priorityFilter,
  setPriorityFilter,
  assigneeFilter,
  setAssigneeFilter,
  clientContactFilter,
  setClientContactFilter,
  sortOrder,
  setSortOrder,
  groupBy,
  setGroupBy,
  compactMode,
  setCompactMode,
  hideEmptyColumns,
  setHideEmptyColumns,
  showMyTickets,
  setShowMyTickets,
  onClearAll,
  currentUserId
}: TicketQuickFiltersProps) => {
  const [savedViews, setSavedViews] = useState<Record<string, any>>({});

  // Buscar funcionários para filtro de responsável
  const { data: employees } = useQuery({
    queryKey: ['employees-for-filter'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Buscar funcionários de clientes para filtro
  const { data: clientContacts } = useQuery({
    queryKey: ['client-contacts-for-filter'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('funcionarios_clientes')
        .select(`
          id,
          name,
          clients:client_id (name)
        `)
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Carregar views salvas do localStorage
  useEffect(() => {
    const saved = localStorage.getItem('ticket-saved-views');
    if (saved) {
      setSavedViews(JSON.parse(saved));
    }
  }, []);

  // Salvar view atual
  const saveCurrentView = (name: string) => {
    const currentView = {
      searchTerm,
      priorityFilter,
      assigneeFilter,
      clientContactFilter,
      sortOrder,
      groupBy,
      compactMode,
      hideEmptyColumns,
      showMyTickets
    };
    
    const newViews = { ...savedViews, [name]: currentView };
    setSavedViews(newViews);
    localStorage.setItem('ticket-saved-views', JSON.stringify(newViews));
  };

  // Carregar view salva
  const loadView = (viewData: any) => {
    setSearchTerm(viewData.searchTerm || '');
    setPriorityFilter(viewData.priorityFilter || 'all');
    setAssigneeFilter(viewData.assigneeFilter || 'all');
    setClientContactFilter(viewData.clientContactFilter || 'all');
    setSortOrder(viewData.sortOrder || 'newest');
    setGroupBy(viewData.groupBy || 'none');
    setCompactMode(viewData.compactMode || false);
    setHideEmptyColumns(viewData.hideEmptyColumns || false);
    setShowMyTickets(viewData.showMyTickets || false);
  };

  // Presets padrão
  const defaultViews = {
    'Minha Fila': {
      showMyTickets: true,
      sortOrder: 'updated',
      groupBy: 'priority'
    },
    'Alta Prioridade': {
      priorityFilter: 'alta',
      sortOrder: 'newest',
      groupBy: 'none'
    },
    'Recentes': {
      sortOrder: 'updated',
      groupBy: 'none'
    }
  };

  const activeFiltersCount = [
    searchTerm,
    priorityFilter !== 'all' ? priorityFilter : '',
    assigneeFilter !== 'all' ? assigneeFilter : '',
    clientContactFilter !== 'all' ? clientContactFilter : '',
    showMyTickets ? 'my' : '',
    groupBy !== 'none' ? groupBy : '',
    hideEmptyColumns ? 'hide-empty' : ''
  ].filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Search and Quick Toggles */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Buscar tickets, cliente, responsável..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-white/70 backdrop-blur-sm border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:bg-white/90"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1 h-6 w-6 p-0"
              onClick={() => setSearchTerm('')}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        <Button
          variant={showMyTickets ? "default" : "outline"}
          size="sm"
          onClick={() => setShowMyTickets(!showMyTickets)}
          className="bg-white/50 backdrop-blur-sm border-white/30"
        >
          <User className="h-4 w-4 mr-1" />
          Meus Tickets
        </Button>

        <Button
          variant={hideEmptyColumns ? "default" : "outline"}
          size="sm"
          onClick={() => setHideEmptyColumns(!hideEmptyColumns)}
          className="bg-white/50 backdrop-blur-sm border-white/30"
        >
          {hideEmptyColumns ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
          {hideEmptyColumns ? 'Mostrar Vazias' : 'Ocultar Vazias'}
        </Button>

        <Button
          variant={compactMode ? "default" : "outline"}
          size="sm"
          onClick={() => setCompactMode(!compactMode)}
          className="bg-white/50 backdrop-blur-sm border-white/30"
        >
          {compactMode ? 'Expandir' : 'Compacto'}
        </Button>
      </div>

      {/* Filters Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="bg-white/50 backdrop-blur-sm border-white/30">
            <SelectValue placeholder="Prioridade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas prioridades</SelectItem>
            <SelectItem value="alta">Alta</SelectItem>
            <SelectItem value="media">Média</SelectItem>
            <SelectItem value="baixa">Baixa</SelectItem>
          </SelectContent>
        </Select>

        <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
          <SelectTrigger className="bg-white/50 backdrop-blur-sm border-white/30">
            <SelectValue placeholder="Responsável" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos responsáveis</SelectItem>
            <SelectItem value="unassigned">Não atribuído</SelectItem>
            {employees?.map((employee) => (
              <SelectItem key={employee.id} value={employee.id}>
                {employee.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={clientContactFilter} onValueChange={setClientContactFilter}>
          <SelectTrigger className="bg-white/50 backdrop-blur-sm border-white/30">
            <SelectValue placeholder="Funcionário Cliente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos funcionários</SelectItem>
            {clientContacts?.map((contact) => (
              <SelectItem key={contact.id} value={contact.id}>
                {contact.name} {contact.clients?.name && `(${contact.clients.name})`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortOrder} onValueChange={setSortOrder}>
          <SelectTrigger className="bg-white/50 backdrop-blur-sm border-white/30">
            <SelectValue placeholder="Ordenar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Mais recente</SelectItem>
            <SelectItem value="oldest">Mais antigo</SelectItem>
            <SelectItem value="updated">Atualizados</SelectItem>
            <SelectItem value="priority">Prioridade</SelectItem>
          </SelectContent>
        </Select>

        <Select value={groupBy} onValueChange={setGroupBy}>
          <SelectTrigger className="bg-white/50 backdrop-blur-sm border-white/30">
            <SelectValue placeholder="Agrupar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sem agrupamento</SelectItem>
            <SelectItem value="priority">Por prioridade</SelectItem>
            <SelectItem value="assignee">Por responsável</SelectItem>
            <SelectItem value="client">Por cliente</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={onClearAll}
            className="bg-white/50 backdrop-blur-sm border-white/30 flex-1"
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Limpar
          </Button>
        </div>
      </div>

      {/* Saved Views */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
          <Bookmark className="h-3 w-3" />
          Views Rápidas:
        </span>
        
        {Object.entries(defaultViews).map(([name, view]) => (
          <Button
            key={name}
            variant="ghost"
            size="sm"
            onClick={() => loadView(view)}
            className="h-6 text-xs bg-white/30 hover:bg-white/50"
          >
            {name}
          </Button>
        ))}

        {Object.entries(savedViews).map(([name, view]) => (
          <Badge
            key={name}
            variant="secondary"
            className="cursor-pointer hover:bg-secondary/80"
            onClick={() => loadView(view)}
          >
            {name}
          </Badge>
        ))}

        {activeFiltersCount > 0 && (
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
            <Filter className="h-3 w-3 mr-1" />
            {activeFiltersCount} filtros ativos
          </Badge>
        )}
      </div>
    </div>
  );
};