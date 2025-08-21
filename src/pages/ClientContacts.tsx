
import { AuthGuard } from "@/components/auth/AuthGuard";
import { AppLayout } from "@/components/layout/AppLayout";
import { ClientContactsContent } from "@/components/clients/ClientContactsContent";

const ClientContacts = () => {
  return (
    <AuthGuard>
      <AppLayout>
        <ClientContactsContent />
      </AppLayout>
    </AuthGuard>
  );
};

export default ClientContacts;
