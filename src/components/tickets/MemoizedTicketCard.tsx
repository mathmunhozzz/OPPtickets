import { memo } from 'react';
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

interface MemoizedTicketCardProps {
  ticket: any;
  compact?: boolean;
  onRefetch: () => void;
}

const priorityColors = {
  baixa: 'from-green-500 to-green-600',
  media: 'from-yellow-500 to-yellow-600',
  alta: 'from-red-500 to-red-600'
};

const TicketCardComponent = ({ ticket, compact = false, onRefetch }: MemoizedTicketCardProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: ticket.id,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  // Determinar o nome do criador
  const getCreatorName = () => {
    return ticket.creator_name || 'Usuário';
  };

  // Renderização compacta
  if (compact) {
    return (
      <>
        <Card 
          ref={setNodeRef}
          style={style}
          className={`group relative cursor-pointer hover:shadow-md transition-all duration-200 backdrop-blur-sm bg-white/80 border-white/30 hover:bg-white/90 ${
            isDragging ? 'opacity-50 rotate-6 z-50' : ''
          }`}
          onClick={() => setDialogOpen(true)}
        >
          {/* Action Buttons - Compact */}
          <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                setDeleteDialogOpen(true);
              }}
            >
              <Trash2 className="h-2.5 w-2.5" />
            </Button>
            
            <div
              {...attributes}
              {...listeners}
              className="p-0.5 rounded cursor-grab active:cursor-grabbing bg-slate-100 hover:bg-slate-200"
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="h-3 w-3 text-slate-500" />
            </div>
          </div>
          
          <CardContent className="p-2 pr-12">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-medium text-xs line-clamp-1 text-slate-800">
                {ticket.title}
              </h4>
              <Badge 
                className={`text-xs font-medium text-white bg-gradient-to-r ${priorityColors[ticket.priority || 'media']} px-1 py-0.5`}
              >
                {ticket.priority === 'baixa' ? 'B' : ticket.priority === 'media' ? 'M' : 'A'}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="truncate">{getCreatorName()}</span>
              <span>{format(new Date(ticket.created_at), 'dd/MM', { locale: ptBR })}</span>
            </div>
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
  }

  return (
    <>
      <Card 
        ref={setNodeRef}
        style={style}
        className={`group relative cursor-pointer hover:shadow-lg transition-all duration-300 backdrop-blur-sm bg-white/80 border-white/30 hover:bg-white/90 hover:scale-[1.02] ${
          isDragging ? 'opacity-50 rotate-6 z-50' : ''
        }`}
        onClick={() => setDialogOpen(true)}
      >
        {/* Action Buttons */}
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
          
          <div
            {...attributes}
            {...listeners}
            className="p-1 rounded cursor-grab active:cursor-grabbing bg-slate-100 hover:bg-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-4 w-4 text-slate-500" />
          </div>
        </div>
        
        <CardContent className="p-4 space-y-3 pr-16">
          <div className="flex items-start justify-between">
            <h4 className="font-semibold text-sm line-clamp-2 text-slate-800 leading-relaxed">
              {ticket.title}
            </h4>
            <Badge 
              className={`text-xs font-medium text-white bg-gradient-to-r ${priorityColors[ticket.priority || 'media']} shadow-sm`}
            >
              {ticket.priority === 'baixa' ? 'Baixa' : ticket.priority === 'media' ? 'Média' : 'Alta'}
            </Badge>
          </div>
          
          {ticket.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {ticket.description}
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

            {ticket.funcionarios_clientes && (
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <div className="p-1 rounded bg-orange-100">
                  <User className="h-3 w-3 text-orange-600" />
                </div>
                <span className="font-medium">
                  Cliente: {ticket.funcionarios_clientes.name}
                  {ticket.funcionarios_clientes.clients?.name && ` (${ticket.funcionarios_clientes.clients.name})`}
                </span>
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

export const MemoizedTicketCard = memo(TicketCardComponent, (prevProps, nextProps) => {
  // Comparação personalizada para otimizar re-renders
  return (
    prevProps.ticket.id === nextProps.ticket.id &&
    prevProps.ticket.status === nextProps.ticket.status &&
    prevProps.ticket.title === nextProps.ticket.title &&
    prevProps.ticket.updated_at === nextProps.ticket.updated_at &&
    prevProps.compact === nextProps.compact
  );
});

MemoizedTicketCard.displayName = 'MemoizedTicketCard';