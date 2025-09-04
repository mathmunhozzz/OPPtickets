
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, User, Tag, GripVertical, Trash2, MoreHorizontal } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TicketDialog } from './TicketDialog';
import { DeleteTicketDialog } from './DeleteTicketDialog';
import { AvatarWithInitials } from '@/components/ui/avatar-with-initials';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { truncateWords } from '@/lib/utils';

interface TicketCardProps {
  ticket: any;
  onRefetch: () => void;
}

// Static priority styles to avoid CSS class generation issues
const priorityStyles = {
  baixa: { 
    badge: 'bg-gradient-to-r from-green-500 to-green-600',
    border: 'border-l-green-400'
  },
  media: { 
    badge: 'bg-gradient-to-r from-yellow-500 to-yellow-600',
    border: 'border-l-yellow-400'
  },
  alta: { 
    badge: 'bg-gradient-to-r from-red-500 to-red-600',
    border: 'border-l-red-400'
  }
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

  const hasMoreContent = ticket.description && ticket.description.length > 50;

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
        className={`group relative overflow-hidden border-l-4 ${getPriorityStyle(ticket.priority || 'media').border} backdrop-blur-sm bg-white/90 border-white/30 hover:bg-white/95 shadow-md hover:shadow-xl transition-all duration-300 select-none animate-fade-in ${
          isDragging ? 'opacity-50 rotate-2 shadow-2xl z-50 scale-105' : 'hover:scale-[1.02]'
        }`}
      >
        {/* Drag Handle */}
        <div 
          {...attributes}
          {...listeners}
          className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-20 p-1 rounded bg-white/80 hover:bg-white shadow-sm"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>

        {/* Quick Actions */}
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 z-20">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 bg-white/80 hover:bg-destructive/10 hover:text-destructive shadow-sm"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteDialogOpen(true);
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 bg-white/80 hover:bg-muted shadow-sm"
            onClick={(e) => {
              e.stopPropagation();
              setDialogOpen(true);
            }}
          >
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        </div>
        
        <CardContent 
          className="p-4 space-y-3 pl-12 pr-16 cursor-pointer" 
          onClick={() => setDialogOpen(true)}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2 flex-1 min-w-0">
              {ticket.employees?.name && (
                <AvatarWithInitials 
                  name={ticket.employees.name}
                  variant="assignee"
                  size="md"
                />
              )}
              <h4 className="font-semibold text-sm line-clamp-2 text-foreground leading-relaxed flex-1">
                {ticket.title}
              </h4>
            </div>
            <Badge 
              className={`text-xs font-medium text-white ${getPriorityStyle(ticket.priority || 'media').badge} shadow-sm flex-shrink-0`}
            >
              {ticket.priority === 'baixa' ? 'Baixa' : ticket.priority === 'media' ? 'Média' : 'Alta'}
            </Badge>
          </div>
          
          {ticket.description && (
            <div className="relative">
              <p className="text-xs text-muted-foreground leading-relaxed break-words">
                {truncateWords(ticket.description, 5)}
              </p>
              {hasMoreContent && (
                <div className="absolute right-0 bottom-0 w-8 h-4 bg-gradient-to-l from-white/95 to-transparent flex items-center justify-end">
                  <span className="text-xs text-muted-foreground">...</span>
                </div>
              )}
            </div>
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
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <AvatarWithInitials 
                  name={ticket.employees.name}
                  variant="assignee"
                  size="sm"
                />
                <span className="font-medium">Responsável: {ticket.employees.name}</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <AvatarWithInitials 
                name={getCreatorName()}
                variant="creator"
                size="sm"
              />
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
