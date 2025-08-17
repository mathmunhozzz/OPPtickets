
import { AuthGuard } from '@/components/auth/AuthGuard';
import { TicketBoard } from '@/components/tickets/TicketBoard';

const Tickets = () => {
  return (
    <AuthGuard>
      <TicketBoard />
    </AuthGuard>
  );
};

export default Tickets;
