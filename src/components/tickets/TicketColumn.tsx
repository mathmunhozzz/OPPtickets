
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { MemoizedTicketCard } from './MemoizedTicketCard';
import { GroupHeader } from './GroupHeader';
import { useDroppable } from '@dnd-kit/core';
import { useEffect, useRef, useState } from 'react';

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
  groupBy?: 'none' | 'priority' | 'assignee' | 'client';
  groupedTickets?: Record<string, any[]>;
  collapsedGroups?: Record<string, boolean>;
  onToggleGroup?: (groupKey: string) => void;
}

export const TicketColumn = ({ 
  status, 
  title, 
  tickets, 
  visibleCount, 
  onLoadMore, 
  color, 
  bgColor, 
  compactMode, 
  onRefetch,
  groupBy = 'none',
  groupedTickets = {},
  collapsedGroups = {},
  onToggleGroup
}: TicketColumnProps) => {
  const { isOver, setNodeRef } = useDroppable({
    id: status,
  });

  const [autoLoad, setAutoLoad] = useState(true);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const visibleTickets = tickets.slice(0, visibleCount);
  const hasMore = tickets.length > visibleCount;

  // Intersection Observer para carregamento automático
  useEffect(() => {
    if (!autoLoad || !hasMore || !sentinelRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [autoLoad, hasMore, onLoadMore]);

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
            {groupBy !== 'none' && Object.keys(groupedTickets).length > 0 ? (
              // Renderização com agrupamento
              Object.entries(groupedTickets).map(([groupKey, groupTickets]) => {
                const isCollapsed = collapsedGroups[groupKey] || false;
                const visibleGroupTickets = groupTickets.slice(0, visibleCount);
                
                return (
                  <div key={groupKey}>
                    <GroupHeader
                      groupKey={groupKey}
                      groupValue={groupTickets[0]?.groupValue || ''}
                      ticketCount={groupTickets.length}
                      groupBy={groupBy as 'priority' | 'assignee' | 'client'}
                      isCollapsed={isCollapsed}
                      onToggle={() => onToggleGroup?.(groupKey)}
                    />
                    
                    {!isCollapsed && (
                      <div className="space-y-2 ml-4">
                        {visibleGroupTickets.map((ticket, index) => (
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
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              // Renderização normal sem agrupamento
              visibleTickets.map((ticket, index) => (
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
              ))
            )}
            
            {/* Sentinel para infinite scroll */}
            {hasMore && autoLoad && <div ref={sentinelRef} className="h-4" />}
            
            {hasMore && (
              <div className="flex flex-col gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onLoadMore}
                  className="w-full text-xs bg-white/50 hover:bg-white/80"
                >
                  Carregar mais ({tickets.length - visibleCount} restantes)
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAutoLoad(!autoLoad)}
                  className="w-full text-xs bg-white/30 hover:bg-white/50"
                >
                  {autoLoad ? 'Auto: ON' : 'Auto: OFF'}
                </Button>
              </div>
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
