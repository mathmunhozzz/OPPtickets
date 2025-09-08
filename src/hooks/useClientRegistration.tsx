import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

interface ClientRegistrationData {
  name: string;
  email: string;
  password: string;
  city: string;
  position: string;
  client_id: string;
  phone?: string;
}

export const useClientRegistration = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ClientRegistrationData) => {
      const { data: result, error } = await supabase.functions.invoke('register-client-contact', {
        body: data
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Erro ao processar cadastro');
      }

      if (result?.error) {
        throw new Error(result.error);
      }

      return result;
    },
    onSuccess: () => {
      toast({
        title: "Cadastro realizado com sucesso!",
        description: "Seu cadastro está aguardando aprovação. Você receberá uma confirmação por email.",
      });
      queryClient.invalidateQueries({ queryKey: ['client-contacts'] });
    },
    onError: (error: any) => {
      console.error('Erro no cadastro:', error);
      toast({
        title: "Erro no cadastro",
        description: error.message || "Ocorreu um erro ao realizar o cadastro. Tente novamente.",
        variant: "destructive",
      });
    },
  });
};