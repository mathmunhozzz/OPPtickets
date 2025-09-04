
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, User, Tag, GripVertical, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TicketDialog } from './TicketDialog';
import { DeleteTicketDialog } from './DeleteTicketDialog';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { truncateWords } from '@/lib/utils';

interface TicketCardProps {
  ticket: any;
  onRefetch: () => void;
}

// Static priority styles to avoid CSS class generation issues
const priorityStyles = {
  baixa: { badge: 'bg-gradient-to-r from-green-500 to-green-600' },
  media: { badge: 'bg-gradient-to-r from-yellow-500 to-yellow-600' },
  alta: { badge: 'bg-gradient-to-r from-red-500 to-red-600' }
};

export const TicketCard = ({ ticket, onRefetch }: TicketCardProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: ticket.id,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  // Get priority styles
  const getPriorityStyle = (priority: string) => {
    return priorityStyles[priority as keyof typeof priorityStyles] || priorityStyles.media;
  };

  // Determinar o nome do criador
  const getCreatorName = () => {
    return ticket.creator_name || 'Usuário';
  };

  return (
    <>
      <Card 
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={`group relative cursor-grab active:cursor-grabbing hover:shadow-lg transition-all duration-300 backdrop-blur-sm bg-white/80 border-white/30 hover:bg-white/90 hover:scale-[1.02] select-none ${
          isDragging ? 'opacity-50 rotate-6 z-50' : ''
        }`}
      >
        {/* Action Buttons */}
        <div className="absolute top-2 right-2 flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-10">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteDialogOpen(true);
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
          
          <div className="p-1 rounded bg-slate-100 hover:bg-slate-200">
            <GripVertical className="h-4 w-4 text-slate-500" />
          </div>
        </div>
        
        <CardContent 
          className="p-4 space-y-3 pr-16" 
          onClick={() => setDialogOpen(true)}
        >
          <div className="flex items-start justify-between">
            <h4 className="font-semibold text-sm line-clamp-2 text-slate-800 leading-relaxed">
              {ticket.title}
            </h4>
            <Badge 
              className={`text-xs font-medium text-white ${getPriorityStyle(ticket.priority || 'media').badge} shadow-sm`}
            >
              {ticket.priority === 'baixa' ? 'Baixa' : ticket.priority === 'media' ? 'Média' : 'Alta'}
            </Badge>
          </div>
          
          {ticket.description && (
            <p className="text-xs text-muted-foreground leading-relaxed break-words">
              {truncateWords(ticket.description, 5)}
            </p>
          )}

          <div className="space-y-2">
            {ticket.sectors?.name && (
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <div className="p-1 rounded bg-blue-100">
                  <Tag className="h-3 w-3 text-blue-600" />
                </div>
                <span className="font-medium">{ticket.sectors.name}</span>
              </div>
            )}
            
            {ticket.employees?.name && (
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <div className="p-1 rounded bg-purple-100">
                  <User className="h-3 w-3 text-purple-600" />
                </div>
                <span className="font-medium">Responsável: {ticket.employees.name}</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-xs text-slate-600">
              <div className="p-1 rounded bg-green-100">
                <User className="h-3 w-3 text-green-600" />
              </div>
              <span className="font-medium">Criado por: {getCreatorName()}</span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-600">
              <div className="p-1 rounded bg-gray-100">
                <Calendar className="h-3 w-3 text-gray-600" />
              </div>
              <span className="font-medium">
                {format(new Date(ticket.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
              </span>
            </div>
          </div>

          {ticket.tags && ticket.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {ticket.tags.slice(0, 2).map((tag: string, index: number) => (
                <Badge 
                  key={index} 
                  variant="outline" 
                  className="text-xs bg-slate-50 border-slate-200 text-slate-700"
                >
                  {tag}
                </Badge>
              ))}
              {ticket.tags.length > 2 && (
                <Badge 
                  variant="outline" 
                  className="text-xs bg-slate-50 border-slate-200 text-slate-700"
                >
                  +{ticket.tags.length - 2}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <TicketDialog
        ticket={ticket}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onRefetch={onRefetch}
      />

      <DeleteTicketDialog
        ticket={ticket}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onRefetch={onRefetch}
      />
    </>
  );
};
