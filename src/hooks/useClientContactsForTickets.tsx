import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useClientContactsForTickets = (sectorId?: string) => {
  return useQuery({
    queryKey: ['client-contacts-for-tickets', sectorId],
    queryFn: async () => {
      console.log('Buscando funcionários de clientes por setor...', { sectorId });
      
      if (!sectorId) {
        return [];
      }
      
      // Buscar funcionários de clientes filtrados pelo setor especificado
      const { data, error } = await supabase
        .from('funcionarios_clientes')
        .select(`
          id,
          name,
          email,
          position,
          client_id,
          sector_id,
          clients:client_id (
            id,
            name
          )
        `)
        .eq('is_active', true)
        .eq('sector_id', sectorId)
        .order('name');
      
      if (error) {
        console.error('Erro ao buscar funcionários de clientes:', error);
        throw error;
      }
      
      console.log('Funcionários encontrados:', data?.length || 0);
      return data || [];
    },
    enabled: !!sectorId,
    staleTime: 5 * 60 * 1000,
  });
};