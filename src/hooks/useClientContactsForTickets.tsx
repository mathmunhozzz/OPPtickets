import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useClientContactsForTickets = () => {
  return useQuery({
    queryKey: ['client-contacts-for-tickets'],
    queryFn: async () => {
      console.log('Buscando funcionários de clientes...');
      const { data, error } = await supabase
        .from('funcionarios_clientes')
        .select(`
          id,
          name,
          email,
          position,
          clients:client_id (
            id,
            name
          )
        `)
        .eq('is_active', true)
        .order('name');
      
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