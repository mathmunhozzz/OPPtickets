import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useClientContactsForTickets = (sectorId?: string) => {
  return useQuery({
    queryKey: ['client-contacts-for-tickets', sectorId],
    queryFn: async () => {
      console.log('Buscando funcionários de clientes...', { sectorId });
      
      const { data, error } = await supabase
        .from('funcionarios_clientes')
        .select('id, name, email, position, client_id')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      
      let contacts = data || [];
      
      // Filtrar por setor se especificado
      if (sectorId && sectorId !== 'all') {
        const { data: sectorClients } = await supabase
          .from('clients')
          .select('id')
          .eq('sector_id', sectorId);
        
        if (sectorClients) {
          const sectorClientIds = new Set(sectorClients.map(c => c.id));
          contacts = contacts.filter(contact => 
            contact.client_id && sectorClientIds.has(contact.client_id)
          );
        }
      }
      
      // Buscar nomes dos clientes
      if (contacts.length > 0) {
        const clientIds = [...new Set(contacts.map(c => c.client_id).filter(Boolean))];
        
        if (clientIds.length > 0) {
          const { data: clients } = await supabase
            .from('clients')
            .select('id, name')
            .in('id', clientIds);
          
          const clientNames = new Map((clients || []).map(c => [c.id, c.name]));
          
          return contacts.map(contact => ({
            ...contact,
            clientName: clientNames.get(contact.client_id) || 'Cliente'
          }));
        }
      }
      
      return contacts;
    },
    staleTime: 5 * 60 * 1000,
  });
};