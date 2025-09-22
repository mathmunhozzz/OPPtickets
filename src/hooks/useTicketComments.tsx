import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface TicketComment {
  id: string;
  ticket_id: string;
  author_user_id: string;
  message: string;
  created_at: string;
  author_name?: string;
}

export const useTicketComments = (ticketId: string) => {
  const queryClient = useQueryClient();

  // Fetch comments
  const { data: comments = [], isLoading, error } = useQuery<TicketComment[]>({
    queryKey: ['ticket-comments', ticketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ticket_comments')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      if (!data?.length) return [];

      // Get author names
      const userIds = [...new Set(data.map(comment => comment.author_user_id))];
      
      // Try employees first
      const { data: employees } = await supabase
        .from('employees')
        .select('auth_user_id, name')
        .in('auth_user_id', userIds);

      // Then profiles as fallback
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name')
        .in('user_id', userIds);

      const employeeMap = new Map(employees?.map(emp => [emp.auth_user_id, emp.name]) || []);
      const profileMap = new Map(profiles?.map(profile => [profile.user_id, profile.name]) || []);

      return data.map(comment => ({
        ...comment,
        author_name: employeeMap.get(comment.author_user_id) || profileMap.get(comment.author_user_id) || 'Usuário'
      }));
    },
    enabled: !!ticketId
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (message: string) => {
      const { data, error } = await supabase
        .from('ticket_comments')
        .insert({
          ticket_id: ticketId,
          author_user_id: (await supabase.auth.getUser()).data.user?.id,
          message: message.trim()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-comments', ticketId] });
      toast.success('Comentário adicionado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao adicionar comentário:', error);
      toast.error('Erro ao adicionar comentário');
    }
  });

  return {
    comments,
    isLoading,
    error,
    addComment: addCommentMutation.mutate,
    isAddingComment: addCommentMutation.isPending
  };
};