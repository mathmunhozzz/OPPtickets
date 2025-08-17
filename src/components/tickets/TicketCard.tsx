
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, Tag } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TicketDialog } from './TicketDialog';

interface TicketCardProps {
  ticket: any;
  onRefetch: () => void;
}

const priorityColors = {
  baixa: 'bg-green-500',
  media: 'bg-yellow-500',
  alta: 'bg-red-500'
};

export const TicketCard = ({ ticket, onRefetch }: TicketCardProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Card 
        className="cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => setDialogOpen(true)}
      >
        <CardContent className="p-3 space-y-2">
          <div className="flex items-start justify-between">
            <h4 className="font-medium text-sm line-clamp-2">{ticket.title}</h4>
            <Badge 
              variant="secondary" 
              className={`text-xs ${priorityColors[ticket.priority || 'media']} text-white`}
            >
              {ticket.priority || 'média'}
            </Badge>
          </div>
          
          {ticket.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {ticket.description}
            </p>
          )}

          <div className="space-y-1">
            {ticket.sectors?.name && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Tag className="h-3 w-3" />
                {ticket.sectors.name}
              </div>
            )}
            
            {ticket.employees?.name && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <User className="h-3 w-3" />
                {ticket.employees.name}
              </div>
            )}

            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {format(new Date(ticket.created_at), 'dd/MM/yyyy', { locale: ptBR })}
            </div>
          </div>

          {ticket.tags && ticket.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {ticket.tags.slice(0, 2).map((tag: string, index: number) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {ticket.tags.length > 2 && (
                <Badge variant="outline" className="text-xs">
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
    </>
  );
};
