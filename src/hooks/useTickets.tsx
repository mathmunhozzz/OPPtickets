
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useTickets = () => {
  return useQuery({
    queryKey: ['tickets'],
    queryFn: async () => {
      console.log('Buscando tickets com informações completas...');
      
      // Query otimizada com JOINs para buscar todas as informações necessárias
      const { data, error } = await supabase
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
          creator_employee:employees!inner (
            name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar tickets:', error);
        throw error;
      }

      console.log('Tickets encontrados:', data?.length || 0);
      
      // Enriquecer dados com informações adicionais se necessário
      const enrichedTickets = data?.map(ticket => {
        // Garantir que o creator_name seja correto baseado no employee
        let creator_name = 'Usuário Desconhecido';
        
        if (ticket.creator_employee?.[0]?.name) {
          creator_name = ticket.creator_employee[0].name;
        }

        return {
          ...ticket,
          creator_name,
          creator_employee: ticket.creator_employee?.[0] || null
        };
      }) || [];

      return enrichedTickets;
    },
    refetchInterval: 30000, // Refetch a cada 30 segundos
    staleTime: 10000, // Considerar dados como "stale" após 10 segundos
  });
};
