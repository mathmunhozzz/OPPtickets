import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DeleteTicketDialogProps {
  ticket: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefetch: () => void;
}

export const DeleteTicketDialog = ({ ticket, open, onOpenChange, onRefetch }: DeleteTicketDialogProps) => {
  const [reason, setReason] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!reason.trim()) {
      toast.error('Por favor, informe o motivo da exclusão');
      return;
    }

    setIsDeleting(true);
    
    try {
      const { error } = await supabase
        .from('tickets')
        .delete()
        .eq('id', ticket.id);

      if (error) throw error;

      toast.success('Ticket deletado com sucesso');
      onRefetch();
      onOpenChange(false);
      setReason('');
    } catch (error) {
      console.error('Erro ao deletar ticket:', error);
      toast.error('Erro ao deletar ticket');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-destructive">
            Confirmar exclusão do ticket
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <div>
              Tem certeza que deseja excluir o ticket <strong>"{ticket?.title}"</strong>?
              Esta ação não pode ser desfeita.
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="delete-reason">
                Motivo da exclusão <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="delete-reason"
                placeholder="Informe o motivo para excluir este ticket..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter>
          <AlertDialogCancel 
            onClick={() => {
              setReason('');
              onOpenChange(false);
            }}
          >
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting || !reason.trim()}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isDeleting ? 'Deletando...' : 'Deletar Ticket'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};