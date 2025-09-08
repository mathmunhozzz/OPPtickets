import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useCities = () => {
  return useQuery({
    queryKey: ['municipalities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_client_municipalities');

      if (error) {
        console.error('Erro ao buscar municípios:', error);
        throw error;
      }

      return data.map((item: { municipality: string }) => item.municipality).filter(Boolean);
    },
  });
};