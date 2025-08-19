import { memo } from 'react';
import { TicketCard } from './TicketCard';

interface MemoizedTicketCardProps {
  ticket: any;
  onRefetch: () => void;
}

export const MemoizedTicketCard = memo(({ ticket, onRefetch }: MemoizedTicketCardProps) => {
  return <TicketCard ticket={ticket} onRefetch={onRefetch} />;
}, (prevProps, nextProps) => {
  // Comparação personalizada para otimizar re-renders
  return (
    prevProps.ticket.id === nextProps.ticket.id &&
    prevProps.ticket.status === nextProps.ticket.status &&
    prevProps.ticket.title === nextProps.ticket.title &&
    prevProps.ticket.updated_at === nextProps.ticket.updated_at
  );
});

MemoizedTicketCard.displayName = 'MemoizedTicketCard';