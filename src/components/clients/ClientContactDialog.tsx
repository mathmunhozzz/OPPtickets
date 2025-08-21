
import React from 'react';
import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useClients } from '@/hooks/useClients';
import { useCreateClientContact, useUpdateClientContact, type ClientContact } from '@/hooks/useClientContacts';

interface ClientContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact?: ClientContact | null;
  defaultClientId?: string;
}

interface FormData {
  client_id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  notes: string;
}

export const ClientContactDialog = ({ 
  open, 
  onOpenChange, 
  contact,
  defaultClientId 
}: ClientContactDialogProps) => {
  const { data: clients = [] } = useClients();
  const createMutation = useCreateClientContact();
  const updateMutation = useUpdateClientContact();

  const form = useForm<FormData>({
    defaultValues: {
      client_id: contact?.client_id || defaultClientId || '',
      name: contact?.name || '',
      email: contact?.email || '',
      phone: contact?.phone || '',
      position: contact?.position || '',
      notes: contact?.notes || '',
    },
  });

  React.useEffect(() => {
    if (contact) {
      form.reset({
        client_id: contact.client_id,
        name: contact.name,
        email: contact.email || '',
        phone: contact.phone || '',
        position: contact.position || '',
        notes: contact.notes || '',
      });
    } else {
      form.reset({
        client_id: defaultClientId || '',
        name: '',
        email: '',
        phone: '',
        position: '',
        notes: '',
      });
    }
  }, [contact, defaultClientId, form]);

  const onSubmit = (data: FormData) => {
    const contactData = {
      client_id: data.client_id,
      name: data.name,
      email: data.email || undefined,
      phone: data.phone || undefined,
      position: data.position || undefined,
      notes: data.notes || undefined,
      is_active: true,
    };

    if (contact) {
      updateMutation.mutate(
        { id: contact.id, ...contactData },
        {
          onSuccess: () => {
            onOpenChange(false);
            form.reset();
          },
        }
      );
    } else {
      createMutation.mutate(contactData, {
        onSuccess: () => {
          onOpenChange(false);
          form.reset();
        },
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {contact ? 'Editar Funcionário do Cliente' : 'Novo Funcionário do Cliente'}
          </DialogTitle>
          <DialogDescription>
            {contact ? 'Edite as informações do funcionário do cliente.' : 'Cadastre um novo funcionário para o cliente.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="client_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o cliente" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name} {client.municipality && `(${client.municipality})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Funcionário *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Virginia" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="funcionario@cliente.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input placeholder="(21) 99999-9999" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="position"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cargo/Função</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Secretária, Coordenador, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Observações adicionais sobre o funcionário..."
                      className="resize-none"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {contact ? 'Salvar' : 'Criar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
