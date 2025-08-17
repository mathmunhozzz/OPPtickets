
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
  baixa: 'from-green-500 to-green-600',
  media: 'from-yellow-500 to-yellow-600',
  alta: 'from-red-500 to-red-600'
};

export const TicketCard = ({ ticket, onRefetch }: TicketCardProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Card 
        className="cursor-pointer hover:shadow-lg transition-all duration-300 backdrop-blur-sm bg-white/80 border-white/30 hover:bg-white/90 hover:scale-[1.02]"
        onClick={() => setDialogOpen(true)}
      >
        <CardContent className="p-4 space-y-3">
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
                <span className="font-medium">{ticket.employees.name}</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-xs text-slate-600">
              <div className="p-1 rounded bg-gray-100">
                <Calendar className="h-3 w-3 text-gray-600" />
              </div>
              <span className="font-medium">
                {format(new Date(ticket.created_at), 'dd/MM/yyyy', { locale: ptBR })}
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
    </>
  );
};
