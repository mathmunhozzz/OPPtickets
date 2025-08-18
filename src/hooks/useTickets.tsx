
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

      // 2. Extrair IDs únicos dos criadores
      const creatorIds = [...new Set(tickets.map(t => t.created_by))];
      
      // 3. Buscar employees por auth_user_id
      const { data: employees } = await supabase
        .from('employees')
        .select('auth_user_id, id, name, email')
        .in('auth_user_id', creatorIds);

      // 4. Buscar profiles como fallback
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name')
        .in('user_id', creatorIds);

      // 5. Criar mapas para lookup rápido
      const employeeMap = new Map(
        employees?.map(emp => [emp.auth_user_id, emp]) || []
      );
      const profileMap = new Map(
        profiles?.map(profile => [profile.user_id, profile]) || []
      );

      // 6. Enriquecer tickets com nomes dos criadores
      const enrichedTickets: EnrichedTicket[] = tickets.map(ticket => {
        const employee = employeeMap.get(ticket.created_by);
        const profile = profileMap.get(ticket.created_by);
        
        const creator_name = employee?.name || profile?.name || 'Usuário';
        
        return {
          ...ticket,
          creator_name,
          creator_employee: employee || null
        };
      });

      return enrichedTickets;
    },
    refetchInterval: 30000, // Refetch a cada 30 segundos
    staleTime: 10000, // Considerar dados como "stale" após 10 segundos
  });
};
