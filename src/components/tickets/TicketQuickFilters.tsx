import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search, Filter, X, Eye, EyeOff, User, Users, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface TicketQuickFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  priorityFilter: string;
  onPriorityChange: (value: string) => void;
  assigneeFilter: string;
  onAssigneeChange: (value: string) => void;
  clientContactFilter: string;
  onClientContactChange: (value: string) => void;
  sortOrder: string;
  onSortChange: (value: 'newest' | 'oldest' | 'priority' | 'updated') => void;
  groupBy: string;
  onGroupByChange: (value: 'status' | 'priority' | 'assignee' | 'client') => void;
  compactMode: boolean;
  onCompactModeChange: (value: boolean) => void;
  hideEmptyColumns: boolean;
  onHideEmptyChange: (value: boolean) => void;
  showMyTickets: boolean;
  onShowMyTicketsChange: (value: boolean) => void;
  onClearFilters: () => void;
  activeFiltersCount: number;
}

export const TicketQuickFilters = ({
  searchTerm,
  onSearchChange,
  priorityFilter,
  onPriorityChange,
  assigneeFilter,
  onAssigneeChange,
  clientContactFilter,
  onClientContactChange,
  sortOrder,
  onSortChange,
  groupBy,
  onGroupByChange,
  compactMode,
  onCompactModeChange,
  hideEmptyColumns,
  onHideEmptyChange,
  showMyTickets,
  onShowMyTicketsChange,
  onClearFilters,
  activeFiltersCount
}: TicketQuickFiltersProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Buscar funcionários para filtro de responsável
  const { data: employees } = useQuery({
    queryKey: ['employees-filter'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Buscar contatos de clientes para filtro
  const { data: clientContacts } = useQuery({
    queryKey: ['client-contacts-filter'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('funcionarios_clientes')
        .select(`
          id,
          name,
          clients:client_id (
            id,
            name
          )
        `)
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return (
    <div className="space-y-4">
      {/* Search Bar and Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar por título, descrição..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-white/60 backdrop-blur-sm border-white/40 focus:bg-white/80"
          />
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={showMyTickets ? "default" : "outline"}
            size="sm"
            onClick={() => onShowMyTicketsChange(!showMyTickets)}
            className="bg-white/60 backdrop-blur-sm border-white/40"
          >
            <User className="h-4 w-4 mr-2" />
            Meus Tickets
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="bg-white/60 backdrop-blur-sm border-white/40"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtros
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 p-4 bg-white/40 backdrop-blur-sm rounded-lg border border-white/30">
          <Select value={priorityFilter} onValueChange={onPriorityChange}>
            <SelectTrigger className="bg-white/60">
              <SelectValue placeholder="Prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas prioridades</SelectItem>
              <SelectItem value="alta">Alta</SelectItem>
              <SelectItem value="media">Média</SelectItem>
              <SelectItem value="baixa">Baixa</SelectItem>
            </SelectContent>
          </Select>

          <Select value={assigneeFilter} onValueChange={onAssigneeChange}>
            <SelectTrigger className="bg-white/60">
              <SelectValue placeholder="Responsável" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos responsáveis</SelectItem>
              <SelectItem value="unassigned">Sem responsável</SelectItem>
              {employees?.map((employee) => (
                <SelectItem key={employee.id} value={employee.id}>
                  {employee.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={clientContactFilter} onValueChange={onClientContactChange}>
            <SelectTrigger className="bg-white/60">
              <SelectValue placeholder="Cliente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos clientes</SelectItem>
              {clientContacts?.map((contact) => (
                <SelectItem key={contact.id} value={contact.id}>
                  {contact.name} {contact.clients?.name && `(${contact.clients.name})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortOrder} onValueChange={(value) => onSortChange(value as 'newest' | 'oldest' | 'priority' | 'updated')}>
            <SelectTrigger className="bg-white/60">
              <SelectValue placeholder="Ordenar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Mais recente</SelectItem>
              <SelectItem value="oldest">Mais antigo</SelectItem>
              <SelectItem value="priority">Prioridade</SelectItem>
              <SelectItem value="updated">Atualizado recentemente</SelectItem>
            </SelectContent>
          </Select>

          <Select value={groupBy} onValueChange={(value) => onGroupByChange(value as 'status' | 'priority' | 'assignee' | 'client')}>
            <SelectTrigger className="bg-white/60">
              <SelectValue placeholder="Agrupar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="status">Status (padrão)</SelectItem>
              <SelectItem value="priority">Prioridade</SelectItem>
              <SelectItem value="assignee">Responsável</SelectItem>
              <SelectItem value="client">Cliente</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Quick Toggles */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onCompactModeChange(!compactMode)}
          className="bg-white/60 backdrop-blur-sm border-white/40"
        >
          {compactMode ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
          {compactMode ? 'Expandir' : 'Compacto'}
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onHideEmptyChange(!hideEmptyColumns)}
          className="bg-white/60 backdrop-blur-sm border-white/40"
        >
          {hideEmptyColumns ? 'Mostrar vazias' : 'Ocultar vazias'}
        </Button>
        
        {activeFiltersCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearFilters}
            className="bg-white/60 backdrop-blur-sm border-white/40 text-destructive hover:text-destructive"
          >
            <X className="h-4 w-4 mr-2" />
            Limpar Filtros
          </Button>
        )}
      </div>
    </div>
  );
};