
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type EnrichedTicket = any & {
  creator_name: string;
  creator_employee: any;
};

export const useTickets = () => {
  return useQuery<EnrichedTicket[]>({
    queryKey: ['tickets'],
    queryFn: async () => {
      console.log('Buscando tickets com informações completas...');
      
      // 1. Buscar tickets com relacionamentos básicos
      const { data: tickets, error } = await supabase
        .from('tickets')
        .select(`
          *,
          sectors!tickets_sector_id_fkey (
            id,
            name
          ),
          employees!tickets_assigned_to_fkey (
            id,
            name,
            email
          ),
          funcionarios_clientes!tickets_client_contact_id_fkey (
            id,
            name,
            email,
            position,
            clients:client_id (
              id,
              name
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar tickets:', error);
        throw error;
      }

      if (!tickets?.length) {
        return [];
      }

      console.log('Tickets encontrados:', tickets.length);

      // 2. Buscar nomes dos criadores usando função segura
      const ticketIds = tickets.map(t => t.id);
      const { data: creatorNames } = await supabase
        .rpc('get_ticket_creator_names', { ticket_ids: ticketIds });

      // 3. Criar mapa de nomes por ticket_id
      const creatorNameMap = new Map(
        creatorNames?.map(item => [item.ticket_id, item.creator_name]) || []
      );

      // 4. Enriquecer tickets com nomes dos criadores
      const enrichedTickets: EnrichedTicket[] = tickets.map(ticket => {
        const creator_name = creatorNameMap.get(ticket.id) || 'Usuário';
        
        return {
          ...ticket,
          creator_name,
          creator_employee: null // Será preenchido se necessário
        };
      });

      return enrichedTickets;
    },
    refetchInterval: 30000, // Refetch a cada 30 segundos
    staleTime: 10000, // Considerar dados como "stale" após 10 segundos
  });
};
