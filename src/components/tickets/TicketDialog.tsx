
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Calendar, User, Tag, Clock, History, Trash2, Save, Edit3, MessageSquare, Send } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { DeleteTicketDialog } from './DeleteTicketDialog';
import { useTicketComments } from '@/hooks/useTicketComments';

interface TicketDialogProps {
  ticket: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefetch: () => void;
}

const statusOptions = [
  { value: 'pendente', label: 'Pendente', color: 'bg-blue-500' },
  { value: 'em_analise', label: 'Em Análise', color: 'bg-yellow-500' },
  { value: 'corrigido', label: 'Corrigido', color: 'bg-green-500' },
  { value: 'negado', label: 'Negado', color: 'bg-red-500' }
] as const;

export const TicketDialog = ({ ticket, open, onOpenChange, onRefetch }: TicketDialogProps) => {
  const [updating, setUpdating] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [description, setDescription] = useState(ticket.description || '');
  const [editingRequestNumber, setEditingRequestNumber] = useState(false);
  const [requestNumber, setRequestNumber] = useState(ticket.request_number || '');
  const [newComment, setNewComment] = useState('');

  // Comments hook
  const { comments, isLoading: isLoadingComments, addComment, isAddingComment } = useTicketComments(ticket.id);

  // Buscar funcionários para atribuição
  const { data: employees } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('id, name, email')
        .order('name');
      
      if (error) throw error;
      return data || [];
    }
  });

  // Buscar logs de ações do ticket com nomes dos performers
  const { data: actionLogs } = useQuery({
    queryKey: ['ticket-logs', ticket.id],
    queryFn: async () => {
      // Buscar logs
      const { data: logs, error } = await supabase
        .from('ticket_action_logs')
        .select('*')
        .eq('ticket_id', ticket.id)
        .order('performed_at', { ascending: false });
      
      if (error) throw error;
      if (!logs?.length) return [];

      // Buscar dados dos employees que performaram as ações
      const userIds = [...new Set(logs.map(log => log.performed_by))];
      
      // Buscar employees
      const { data: employees } = await supabase
        .from('employees')
        .select('auth_user_id, name')
        .in('auth_user_id', userIds);

      // Buscar profiles como fallback
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name')
        .in('user_id', userIds);

      const employeeMap = new Map(employees?.map(emp => [emp.auth_user_id, emp.name]) || []);
      const profileMap = new Map(profiles?.map(profile => [profile.user_id, profile.name]) || []);

      // Combinar dados - priorizar nomes dos employees, fallback para profiles
      return logs.map(log => {
        const performer_name = employeeMap.get(log.performed_by) || profileMap.get(log.performed_by) || 'Sistema';
        return {
          ...log,
          performer_name
        };
      });
    },
    enabled: open
  });

  const handleStatusChange = async (newStatus: string) => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ status: newStatus as "pendente" | "em_analise" | "corrigido" | "negado" })
        .eq('id', ticket.id);

      if (error) throw error;
      
      toast.success('Status atualizado com sucesso!');
      onRefetch();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    } finally {
      setUpdating(false);
    }
  };

  const handleAssigneeChange = async (employeeId: string) => {
    setUpdating(true);
    try {
      const actualEmployeeId = employeeId === 'unassigned' ? null : employeeId;
      const { error } = await supabase
        .from('tickets')
        .update({ assigned_to: actualEmployeeId })
        .eq('id', ticket.id);

      if (error) throw error;
      
      toast.success('Responsável atualizado com sucesso!');
      onRefetch();
    } catch (error) {
      console.error('Erro ao atualizar responsável:', error);
      toast.error('Erro ao atualizar responsável');
    } finally {
      setUpdating(false);
    }
  };

  const handleDescriptionSave = async () => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ description })
        .eq('id', ticket.id);

      if (error) throw error;
      
      toast.success('Descrição atualizada com sucesso!');
      setEditingDescription(false);
      onRefetch();
    } catch (error) {
      console.error('Erro ao atualizar descrição:', error);
      toast.error('Erro ao atualizar descrição');
    } finally {
      setUpdating(false);
    }
  };

  const handleDescriptionCancel = () => {
    setDescription(ticket.description || '');
    setEditingDescription(false);
  };

  const handleRequestNumberSave = async () => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ request_number: requestNumber.trim() || null })
        .eq('id', ticket.id);

      if (error) throw error;
      
      toast.success('Número da solicitação atualizado com sucesso!');
      setEditingRequestNumber(false);
      onRefetch();
    } catch (error) {
      console.error('Erro ao atualizar número da solicitação:', error);
      toast.error('Erro ao atualizar número da solicitação');
    } finally {
      setUpdating(false);
    }
  };

  const handleRequestNumberCancel = () => {
    setRequestNumber(ticket.request_number || '');
    setEditingRequestNumber(false);
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    addComment(newComment);
    setNewComment('');
  };

  const handleCommentKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleAddComment();
    }
  };

  const getActionLabel = (actionType: string, oldValue?: string, newValue?: string) => {
    switch (actionType) {
      case 'created':
        return 'Ticket criado';
      case 'status_change':
        const statusLabels = {
          pendente: 'Pendente',
          em_analise: 'Em Análise', 
          corrigido: 'Corrigido',
          negado: 'Negado'
        };
        return `Status alterado de ${statusLabels[oldValue as keyof typeof statusLabels] || oldValue} para ${statusLabels[newValue as keyof typeof statusLabels] || newValue}`;
      case 'assignment_change':
        if (oldValue === 'unassigned' || !oldValue) {
          return `Ticket atribuído`;
        } else if (newValue === 'unassigned' || !newValue) {
          return `Atribuição removida`;
        } else {
          return `Responsável alterado`;
        }
      default:
        return `Ação: ${actionType}`;
    }
  };

  // Determinar o nome do criador
  const getCreatorName = () => {
    return ticket.creator_name || 'Usuário';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto" aria-describedby="ticket-dialog-description">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              {ticket.title}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </DialogTitle>
          <DialogDescription id="ticket-dialog-description" className="sr-only">
            Visualizar e gerenciar detalhes do ticket, incluindo status, responsável e histórico de ações
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Detalhes</TabsTrigger>
            <TabsTrigger value="comments" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Comentários ({comments?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Histórico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Informações básicas */}
              <Card>
                <CardContent className="p-4 space-y-4">
                  <h3 className="font-semibold text-lg">Informações</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Criado em:</span>
                      <span>{format(new Date(ticket.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Criado por:</span>
                      <span className="font-semibold text-blue-600">{getCreatorName()}</span>
                    </div>

                    {ticket.funcionarios_clientes && (
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Funcionário do Cliente:</span>
                        <span className="font-semibold text-orange-600">
                          {ticket.funcionarios_clientes.name}
                          {ticket.funcionarios_clientes.clients?.name && ` (${ticket.funcionarios_clientes.clients.name})`}
                        </span>
                      </div>
                    )}

                    {ticket.sectors?.name && (
                      <div className="flex items-center gap-2 text-sm">
                        <Tag className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Setor:</span>
                        <Badge variant="outline">{ticket.sectors.name}</Badge>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Prioridade:</span>
                      <Badge variant={ticket.priority === 'alta' ? 'destructive' : ticket.priority === 'media' ? 'default' : 'secondary'}>
                        {ticket.priority === 'baixa' ? 'Baixa' : ticket.priority === 'media' ? 'Média' : 'Alta'}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">Descrição:</span>
                      {!editingDescription && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => setEditingDescription(true)}
                        >
                          <Edit3 className="h-3 w-3 mr-1" />
                          Editar
                        </Button>
                      )}
                    </div>
                    
                    {editingDescription ? (
                      <div className="space-y-2">
                        <Textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Digite a descrição do ticket..."
                          className="min-h-[100px] resize-none"
                          disabled={updating}
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={handleDescriptionSave}
                            disabled={updating}
                          >
                            <Save className="h-3 w-3 mr-1" />
                            Salvar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDescriptionCancel}
                            disabled={updating}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-1 text-sm text-muted-foreground bg-slate-50 p-3 rounded-md whitespace-pre-wrap break-words min-h-[60px]">
                        {ticket.description || 'Nenhuma descrição fornecida'}
                      </p>
                     )}
                   </div>

                   {/* Número da Solicitação */}
                   <div>
                     <div className="flex items-center justify-between mb-2">
                       <span className="font-medium text-sm">Número da Solicitação:</span>
                       {!editingRequestNumber && (
                         <Button
                           variant="ghost"
                           size="sm"
                           className="h-6 px-2 text-xs"
                           onClick={() => setEditingRequestNumber(true)}
                         >
                           <Edit3 className="h-3 w-3 mr-1" />
                           Editar
                         </Button>
                       )}
                     </div>
                     
                     {editingRequestNumber ? (
                       <div className="space-y-2">
                         <Input
                           value={requestNumber}
                           onChange={(e) => setRequestNumber(e.target.value)}
                           placeholder="Digite o número da solicitação..."
                           disabled={updating}
                         />
                         <div className="flex gap-2">
                           <Button
                             size="sm"
                             onClick={handleRequestNumberSave}
                             disabled={updating}
                           >
                             <Save className="h-3 w-3 mr-1" />
                             Salvar
                           </Button>
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={handleRequestNumberCancel}
                             disabled={updating}
                           >
                             Cancelar
                           </Button>
                         </div>
                       </div>
                     ) : (
                       <p className="mt-1 text-sm text-muted-foreground bg-slate-50 p-3 rounded-md">
                         {ticket.request_number || 'Nenhum número de solicitação definido'}
                       </p>
                     )}
                   </div>

                   {ticket.tags && ticket.tags.length > 0 && (
                     <div>
                       <span className="font-medium text-sm">Tags:</span>
                       <div className="flex flex-wrap gap-1 mt-1">
                         {ticket.tags.map((tag: string, index: number) => (
                           <Badge key={index} variant="outline" className="text-xs">
                             {tag}
                           </Badge>
                         ))}
                       </div>
                     </div>
                   )}
                 </CardContent>
               </Card>

              {/* Controles de status e atribuição */}
              <Card>
                <CardContent className="p-4 space-y-4">
                  <h3 className="font-semibold text-lg">Gerenciamento</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Status</label>
                      <Select value={ticket.status} onValueChange={handleStatusChange} disabled={updating}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${status.color}`} />
                                {status.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Responsável</label>
                      <Select 
                        value={ticket.assigned_to || 'unassigned'} 
                        onValueChange={handleAssigneeChange}
                        disabled={updating}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Não atribuído" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">Não atribuído</SelectItem>
                          {employees?.map((employee) => (
                            <SelectItem key={employee.id} value={employee.id}>
                              {employee.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {ticket.employees?.name && (
                      <div className="p-3 bg-purple-50 rounded-md border border-purple-200">
                        <div className="flex items-center gap-2 text-sm text-purple-800">
                          <User className="h-4 w-4" />
                          <span className="font-medium">Responsável atual: {ticket.employees.name}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="comments" className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg mb-4">Comentários</h3>
                
                {/* Add new comment */}
                <div className="space-y-3 mb-6">
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Adicione um comentário... (Ctrl+Enter para enviar)"
                    className="min-h-[80px] resize-none"
                    onKeyPress={handleCommentKeyPress}
                  />
                  <div className="flex justify-end">
                    <Button 
                      onClick={handleAddComment}
                      disabled={!newComment.trim() || isAddingComment}
                      size="sm"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {isAddingComment ? 'Enviando...' : 'Enviar Comentário'}
                    </Button>
                  </div>
                </div>

                {/* Comments list */}
                {isLoadingComments ? (
                  <div className="text-center py-4 text-muted-foreground">
                    Carregando comentários...
                  </div>
                ) : comments && comments.length > 0 ? (
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div key={comment.id} className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="p-2 rounded-full bg-blue-100">
                          <MessageSquare className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm text-slate-800 whitespace-pre-wrap break-words">
                            {comment.message}
                          </div>
                          <div className="text-xs text-muted-foreground mt-2 flex items-center gap-2">
                            <User className="h-3 w-3" />
                            <span className="font-medium text-blue-600">{comment.author_name}</span>
                            <span>•</span>
                            <span>{format(new Date(comment.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhum comentário ainda</p>
                    <p className="text-sm">Seja o primeiro a comentar!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg mb-4">Histórico de Ações</h3>
                
                {actionLogs && actionLogs.length > 0 ? (
                  <div className="space-y-3">
                    {actionLogs.map((log) => (
                      <div key={log.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="p-2 rounded-full bg-blue-100">
                          <History className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-slate-800">
                            {getActionLabel(log.action_type, log.old_value, log.new_value)}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                            <User className="h-3 w-3" />
                            <span className="font-medium text-blue-600">{log.performer_name}</span>
                            <span>•</span>
                            <span>{format(new Date(log.performed_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhuma ação registrada ainda</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
      
      <DeleteTicketDialog
        ticket={ticket}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onRefetch={() => {
          onRefetch();
          onOpenChange(false);
        }}
      />
    </Dialog>
  );
};
