
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Sector {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export const useSectors = () => {
  return useQuery({
    queryKey: ['sectors'],
    queryFn: async () => {
      console.log('Buscando setores...');
      
      const { data, error } = await supabase
        .from('sectors')
        .select('*')
        .order('name');

      if (error) {
        console.error('Erro ao buscar setores:', error);
        throw error;
      }

      return data as Sector[];
    },
  });
};
