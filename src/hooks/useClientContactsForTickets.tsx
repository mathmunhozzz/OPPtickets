import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useClientContactsForTickets = () => {
  return useQuery({
    queryKey: ['client-contacts-for-tickets'],
    queryFn: async () => {
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
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};