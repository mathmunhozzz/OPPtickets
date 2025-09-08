
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Client {
  id: string;
  name: string;
  municipality?: string;
  contact?: string;
}

export const useClients = () => {
  return useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      console.log('Buscando clientes...');
      
      const { data, error } = await supabase
        .rpc('get_clients_public');

      if (error) {
        console.error('Erro ao buscar clientes:', error);
        throw error;
      }

      return data as Client[];
    },
  });
};
