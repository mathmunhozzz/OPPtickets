import { memo } from 'react';
import { TicketColumn } from './TicketColumn';

interface MemoizedTicketColumnProps {
  status: string;
  title: string;
  tickets: any[];
  color: string;
  bgColor: string;
  onRefetch: () => void;
}

export const MemoizedTicketColumn = memo(({ status, title, tickets, color, bgColor, onRefetch }: MemoizedTicketColumnProps) => {
  return (
    <TicketColumn
      status={status}
      title={title}
      tickets={tickets}
      color={color}
      bgColor={bgColor}
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
    prevTicketIds.length === nextTicketIds.length &&
    prevTicketIds.every((id, index) => id === nextTicketIds[index])
  );
});

MemoizedTicketColumn.displayName = 'MemoizedTicketColumn';