import { useState, useMemo } from 'react';
import { useSpokenTickets } from '@/hooks/useSpokenTickets';
import { SpokenTicketFilters } from './SpokenTicketFilters';
import { SpokenTicketCard } from './SpokenTicketCard';
import { TicketDialog } from '@/components/tickets/TicketDialog';
import { TicketSkeleton } from '@/components/tickets/TicketSkeleton';
import { Radio } from 'lucide-react';

export function SpokenTicketBoard() {
  const { data: tickets, isLoading } = useSpokenTickets();
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAttendant, setSelectedAttendant] = useState('all');
  const [selectedClient, setSelectedClient] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [viewMode, setViewMode] = useState<'cards' | 'list' | 'timeline'>('cards');

  // Extrair atendentes únicos
  const attendants = useMemo(() => {
    if (!tickets) return [];
    const uniqueAttendants = new Map();
    tickets.forEach((ticket) => {
      if (ticket.employees) {
        uniqueAttendants.set(ticket.employees.id, {
          id: ticket.employees.id,
          name: ticket.employees.name,
        });
      }
    });
    return Array.from(uniqueAttendants.values());
  }, [tickets]);

  // Extrair clientes únicos
  const clients = useMemo(() => {
    if (!tickets) return [];
    const uniqueClients = new Map();
    tickets.forEach((ticket) => {
      if (ticket.funcionarios_clientes) {
        uniqueClients.set(ticket.funcionarios_clientes.id, {
          id: ticket.funcionarios_clientes.id,
          name: ticket.funcionarios_clientes.name,
        });
      }
    });
    return Array.from(uniqueClients.values());
  }, [tickets]);

  // Filtrar tickets
  const filteredTickets = useMemo(() => {
    if (!tickets) return [];

    return tickets.filter((ticket) => {
      // Filtro de busca
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
          ticket.title?.toLowerCase().includes(searchLower) ||
          ticket.description?.toLowerCase().includes(searchLower) ||
          ticket.request_number?.toLowerCase().includes(searchLower) ||
          ticket.funcionarios_clientes?.name?.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
      }

      // Filtro de atendente
      if (selectedAttendant !== 'all' && ticket.employees?.id !== selectedAttendant) {
        return false;
      }

      // Filtro de cliente
      if (selectedClient !== 'all' && ticket.funcionarios_clientes?.id !== selectedClient) {
        return false;
      }

      // Filtro de status
      if (selectedStatus !== 'all' && ticket.status !== selectedStatus) {
        return false;
      }

      return true;
    });
  }, [tickets, searchTerm, selectedAttendant, selectedClient, selectedStatus]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Radio className="h-8 w-8 text-purple-600" />
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Chamados Spoken
            </h1>
            <p className="text-gray-600">Tickets importados via API Spoken</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <TicketSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
            <Radio className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Chamados Spoken
            </h1>
            <p className="text-gray-600">
              {filteredTickets.length} {filteredTickets.length === 1 ? 'ticket importado' : 'tickets importados'}
            </p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <SpokenTicketFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedAttendant={selectedAttendant}
        onAttendantChange={setSelectedAttendant}
        selectedClient={selectedClient}
        onClientChange={setSelectedClient}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        attendants={attendants}
        clients={clients}
      />

      {/* Grid de Cards */}
      {filteredTickets.length === 0 ? (
        <div className="text-center py-12">
          <Radio className="h-16 w-16 text-purple-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Nenhum chamado encontrado
          </h3>
          <p className="text-gray-500">
            {searchTerm || selectedAttendant !== 'all' || selectedClient !== 'all' || selectedStatus !== 'all'
              ? 'Tente ajustar os filtros para ver mais resultados'
              : 'Os tickets importados via API Spoken aparecerão aqui'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTickets.map((ticket) => (
            <SpokenTicketCard
              key={ticket.id}
              ticket={ticket}
              onClick={() => setSelectedTicket(ticket)}
            />
          ))}
        </div>
      )}

      {/* Dialog de detalhes */}
      {selectedTicket && (
        <TicketDialog
          ticket={selectedTicket}
          open={!!selectedTicket}
          onOpenChange={(open) => !open && setSelectedTicket(null)}
          onRefetch={() => {}}
        />
      )}
    </div>
  );
}
