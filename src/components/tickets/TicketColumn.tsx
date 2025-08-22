
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { MemoizedTicketCard } from './MemoizedTicketCard';
import { useDroppable } from '@dnd-kit/core';

interface TicketColumnProps {
  status: string;
  title: string;
  tickets: any[];
  visibleCount: number;
  onLoadMore: () => void;
  color: string;
  bgColor: string;
  compactMode: boolean;
  onRefetch: () => void;
}

export const TicketColumn = ({ status, title, tickets, visibleCount, onLoadMore, color, bgColor, compactMode, onRefetch }: TicketColumnProps) => {
  const { isOver, setNodeRef } = useDroppable({
    id: status,
  });

  const visibleTickets = tickets.slice(0, visibleCount);
  const hasMore = tickets.length > visibleCount;

  return (
    <Card 
      ref={setNodeRef}
      className={`h-full flex flex-col backdrop-blur-sm bg-white/70 border-white/20 shadow-lg animate-fade-in transition-colors ${
        isOver ? 'bg-blue-50/80 border-blue-200' : ''
      }`}
    >
      <CardHeader className="pb-3 flex-shrink-0">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${color} shadow-sm`} />
          <span className="text-slate-700">{title}</span>
          <span className="ml-auto text-xs text-muted-foreground bg-white/50 px-2 py-1 rounded-full">
            {tickets.length}
          </span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 min-h-0 p-3">
        <ScrollArea className="h-full">
          <div className="space-y-3 pr-3">
            {visibleTickets.map((ticket, index) => (
              <div 
                key={ticket.id} 
                className="animate-scale-in"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <MemoizedTicketCard
                  ticket={ticket}
                  compact={compactMode}
                  onRefetch={onRefetch}
                />
              </div>
            ))}
            
            {hasMore && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onLoadMore}
                className="w-full mt-2 text-xs bg-white/50 hover:bg-white/80"
              >
                Carregar mais ({tickets.length - visibleCount} restantes)
              </Button>
            )}
            
            {tickets.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <div className={`w-12 h-12 mx-auto mb-2 rounded-full bg-gradient-to-r ${bgColor} flex items-center justify-center opacity-50`}>
                  <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${color}`} />
                </div>
                <p className="text-sm">Nenhum ticket</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
