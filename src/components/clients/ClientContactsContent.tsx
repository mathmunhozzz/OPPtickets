
import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useClientContacts, useDeleteClientContact } from '@/hooks/useClientContacts';
import { ClientContactDialog } from './ClientContactDialog';
import type { ClientContact } from '@/hooks/useClientContacts';

export const ClientContactsContent = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContact, setSelectedContact] = useState<ClientContact | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: contacts, isLoading } = useClientContacts();
  const deleteContactMutation = useDeleteClientContact();

  const filteredContacts = contacts?.filter(contact => {
    const searchLower = searchTerm.toLowerCase();
    return (
      contact.name?.toLowerCase().includes(searchLower) ||
      contact.clients?.name?.toLowerCase().includes(searchLower) ||
      contact.email?.toLowerCase().includes(searchLower) ||
      contact.position?.toLowerCase().includes(searchLower)
    );
  }) || [];

  const handleEditContact = (contact: ClientContact) => {
    setSelectedContact(contact);
    setIsDialogOpen(true);
  };

  const handleDeleteContact = async (contactId: string) => {
    if (confirm('Tem certeza que deseja remover este funcionário?')) {
      deleteContactMutation.mutate(contactId);
    }
  };

  const handleCreateNew = () => {
    setSelectedContact(null);
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Funcionários dos Clientes</h1>
          <p className="text-gray-600 mt-1">Gerencie os contatos e funcionários de cada cliente</p>
        </div>
        <Button onClick={handleCreateNew} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Novo Funcionário
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Pesquisar por nome, cliente, email ou cargo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredContacts.map((contact) => (
          <Card key={contact.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{contact.name}</CardTitle>
                  <CardDescription className="font-medium text-blue-600">
                    {contact.clients?.name}
                  </CardDescription>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditContact(contact)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteContact(contact.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {contact.position && (
                <Badge variant="secondary">{contact.position}</Badge>
              )}
              {contact.email && (
                <p className="text-sm text-gray-600">{contact.email}</p>
              )}
              {contact.phone && (
                <p className="text-sm text-gray-600">{contact.phone}</p>
              )}
              {contact.notes && (
                <p className="text-sm text-gray-500 italic">{contact.notes}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredContacts.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <p className="text-gray-500">Nenhum funcionário encontrado</p>
        </div>
      )}

      <ClientContactDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        contact={selectedContact}
      />
    </div>
  );
};
