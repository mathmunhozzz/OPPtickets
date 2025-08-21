
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AppLayout } from '@/components/layout/AppLayout';
import { TicketBoard } from '@/components/tickets/TicketBoard';

const Tickets = () => {
  return (
    <AuthGuard>
      <AppLayout>
        <TicketBoard />
      </AppLayout>
    </AuthGuard>
  );
};

export default Tickets;
