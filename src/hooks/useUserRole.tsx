
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useUserRole = () => {
  return useQuery({
    queryKey: ['user-role'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_user_role');
      if (error) throw error;
      return data as 'admin' | 'manager' | 'user';
    },
    enabled: true,
  });
};
