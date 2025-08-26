import { memo } from 'react';
import { TicketColumn } from './TicketColumn';

interface MemoizedTicketColumnProps {
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

export const MemoizedTicketColumn = memo(({ 
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
}: MemoizedTicketColumnProps) => {
  return (
    <TicketColumn
      status={status}
      title={title}
      tickets={tickets}
      visibleCount={visibleCount}
      onLoadMore={onLoadMore}
      color={color}
      bgColor={bgColor}
      compactMode={compactMode}
      onRefetch={onRefetch}
      groupBy={groupBy}
      groupedTickets={groupedTickets}
      collapsedGroups={collapsedGroups}
      onToggleGroup={onToggleGroup}
    />
  );
}, (prevProps, nextProps) => {
  // Comparar arrays de tickets por IDs e status
  const prevTicketIds = prevProps.tickets.map(t => `${t.id}-${t.status}`);
  const nextTicketIds = nextProps.tickets.map(t => `${t.id}-${t.status}`);
  
  return (
    prevProps.status === nextProps.status &&
    prevProps.title === nextProps.title &&
    prevProps.visibleCount === nextProps.visibleCount &&
    prevProps.compactMode === nextProps.compactMode &&
    prevProps.groupBy === nextProps.groupBy &&
    prevTicketIds.length === nextTicketIds.length &&
    prevTicketIds.every((id, index) => id === nextTicketIds[index])
  );
});

MemoizedTicketColumn.displayName = 'MemoizedTicketColumn';