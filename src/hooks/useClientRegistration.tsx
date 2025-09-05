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
      // First, create the auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            name: data.name,
            is_client: true
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Usuário não foi criado');

      // Then create the client contact record
      const { error: contactError } = await supabase
        .from('funcionarios_clientes')
        .insert({
          auth_user_id: authData.user.id,
          name: data.name,
          email: data.email,
          city: data.city,
          position: data.position,
          client_id: data.client_id,
          phone: data.phone,
          approval_status: 'pending',
          is_active: false
        });

      if (contactError) throw contactError;

      return authData;
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