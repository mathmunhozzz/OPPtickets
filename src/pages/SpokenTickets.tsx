import { AuthGuard } from '@/components/auth/AuthGuard';
import { AppLayout } from '@/components/layout/AppLayout';
import { SpokenTicketBoard } from '@/components/spoken-tickets/SpokenTicketBoard';

const SpokenTickets = () => {
  return (
    <AuthGuard>
      <AppLayout>
        <SpokenTicketBoard />
      </AppLayout>
    </AuthGuard>
  );
};

export default SpokenTickets;
