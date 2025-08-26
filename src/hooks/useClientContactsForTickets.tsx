import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useClientContactsForTickets = (sectorId?: string) => {
  return useQuery({
    queryKey: ['client-contacts-for-tickets', sectorId],
    queryFn: async () => {
      console.log('Buscando funcionários de clientes...');
      let query = supabase
        .from('funcionarios_clientes')
        .select(`
          id,
          name,
          email,
          position,
          sector_id,
          clients:client_id (
            id,
            name
          )
        `)
        .eq('is_active', true);

      // Se um setor foi selecionado, filtrar por ele
      if (sectorId) {
        query = query.eq('sector_id', sectorId);
      }
      
      const { data, error } = await query.order('name');
      
      if (error) {
        console.error('Erro ao buscar funcionários de clientes:', error);
        throw error;
      }
      
      console.log('Funcionários de clientes encontrados:', data);
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};