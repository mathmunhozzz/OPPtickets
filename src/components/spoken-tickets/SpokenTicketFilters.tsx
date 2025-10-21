import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, User, Users, Calendar, LayoutGrid, List, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SpokenTicketFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedAttendant: string;
  onAttendantChange: (value: string) => void;
  selectedClient: string;
  onClientChange: (value: string) => void;
  selectedStatus: string;
  onStatusChange: (value: string) => void;
  viewMode: 'cards' | 'list' | 'timeline';
  onViewModeChange: (mode: 'cards' | 'list' | 'timeline') => void;
  attendants: Array<{ id: string; name: string }>;
  clients: Array<{ id: string; name: string }>;
}

export function SpokenTicketFilters({
  searchTerm,
  onSearchChange,
  selectedAttendant,
  onAttendantChange,
  selectedClient,
  onClientChange,
  selectedStatus,
  onStatusChange,
  viewMode,
  onViewModeChange,
  attendants,
  clients,
}: SpokenTicketFiltersProps) {
  return (
    <div className="space-y-4 p-4 rounded-lg border border-purple-200/50 bg-white/50 backdrop-blur-sm">
      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-400" />
        <Input
          placeholder="Buscar por ID Spoken, cliente ou descrição..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 border-purple-200 focus:border-purple-400 focus:ring-purple-400"
        />
      </div>

      {/* Filtros em linha */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Atendente */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-purple-700 flex items-center gap-2">
            <User className="h-4 w-4" />
            Atendente
          </label>
          <Select value={selectedAttendant} onValueChange={onAttendantChange}>
            <SelectTrigger className="border-purple-200">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {attendants.map((att) => (
                <SelectItem key={att.id} value={att.id}>
                  {att.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Cliente */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-purple-700 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Cliente
          </label>
          <Select value={selectedClient} onValueChange={onClientChange}>
            <SelectTrigger className="border-purple-200">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-purple-700 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Status
          </label>
          <Select value={selectedStatus} onValueChange={onStatusChange}>
            <SelectTrigger className="border-purple-200">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="em_analise">Em Análise</SelectItem>
              <SelectItem value="em_andamento">Em Andamento</SelectItem>
              <SelectItem value="aguardando_resposta">Aguardando Resposta</SelectItem>
              <SelectItem value="resolvido">Resolvido</SelectItem>
              <SelectItem value="fechado">Fechado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Modo de Visualização */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-purple-700">Visualização</label>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'cards' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onViewModeChange('cards')}
              className="flex-1"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onViewModeChange('list')}
              className="flex-1"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'timeline' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onViewModeChange('timeline')}
              className="flex-1"
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
