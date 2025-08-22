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
}

export const MemoizedTicketColumn = memo(({ status, title, tickets, visibleCount, onLoadMore, color, bgColor, compactMode, onRefetch }: MemoizedTicketColumnProps) => {
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
    prevTicketIds.length === nextTicketIds.length &&
    prevTicketIds.every((id, index) => id === nextTicketIds[index])
  );
});

MemoizedTicketColumn.displayName = 'MemoizedTicketColumn';