
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TicketCard } from './TicketCard';
import { useDroppable } from '@dnd-kit/core';

interface TicketColumnProps {
  status: string;
  title: string;
  tickets: any[];
  color: string;
  bgColor: string;
  onRefetch: () => void;
}

export const TicketColumn = ({ status, title, tickets, color, bgColor, onRefetch }: TicketColumnProps) => {
  const { isOver, setNodeRef } = useDroppable({
    id: status,
  });

  return (
    <Card 
      ref={setNodeRef}
      className={`h-fit backdrop-blur-sm bg-white/70 border-white/20 shadow-lg animate-fade-in transition-colors ${
        isOver ? 'bg-blue-50/80 border-blue-200' : ''
      }`}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${color} shadow-sm`} />
          <span className="text-slate-700">{title}</span>
          <span className="ml-auto text-xs text-muted-foreground bg-white/50 px-2 py-1 rounded-full">
            {tickets.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {tickets.map((ticket, index) => (
          <div 
            key={ticket.id} 
            className="animate-scale-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <TicketCard
              ticket={ticket}
              onRefetch={onRefetch}
            />
          </div>
        ))}
        {tickets.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <div className={`w-12 h-12 mx-auto mb-2 rounded-full bg-gradient-to-r ${bgColor} flex items-center justify-center opacity-50`}>
              <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${color}`} />
            </div>
            <p className="text-sm">Nenhum ticket</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
