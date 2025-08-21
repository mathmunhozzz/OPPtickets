
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ClientContact {
  id: string;
  client_id: string;
  name: string;
  email?: string;
  phone?: string;
  position?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  clients?: {
    id: string;
    name: string;
  };
}

export const useClientContacts = (clientId?: string) => {
  return useQuery({
    queryKey: ['client-contacts', clientId],
    queryFn: async () => {
      console.log('Buscando funcionários dos clientes...');
      
      let query = supabase
        .from('funcionarios_clientes')
        .select(`
          *,
          clients!funcionarios_clientes_client_id_fkey (
            id,
            name
          )
        `)
        .eq('is_active', true)
        .order('name');

      if (clientId) {
        query = query.eq('client_id', clientId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar funcionários dos clientes:', error);
        throw error;
      }

      return data as ClientContact[];
    },
    enabled: true,
  });
};

export const useCreateClientContact = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contact: Omit<ClientContact, 'id' | 'created_at' | 'updated_at' | 'clients'>) => {
      const { data, error } = await supabase
        .from('funcionarios_clientes')
        .insert(contact)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-contacts'] });
      toast.success('Funcionário do cliente criado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao criar funcionário do cliente:', error);
      toast.error('Erro ao criar funcionário do cliente');
    },
  });
};

export const useUpdateClientContact = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ClientContact> & { id: string }) => {
      const { data, error } = await supabase
        .from('funcionarios_clientes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-contacts'] });
      toast.success('Funcionário do cliente atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar funcionário do cliente:', error);
      toast.error('Erro ao atualizar funcionário do cliente');
    },
  });
};

export const useDeleteClientContact = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('funcionarios_clientes')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-contacts'] });
      toast.success('Funcionário do cliente removido com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao remover funcionário do cliente:', error);
      toast.error('Erro ao remover funcionário do cliente');
    },
  });
};
