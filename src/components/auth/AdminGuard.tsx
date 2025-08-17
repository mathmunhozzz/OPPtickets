
import { ReactNode } from 'react';
import { useUserRole } from '@/hooks/useUserRole';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield } from 'lucide-react';

interface AdminGuardProps {
  children: ReactNode;
  allowedRoles?: ('admin' | 'manager')[];
}

export const AdminGuard = ({ children, allowedRoles = ['admin', 'manager'] }: AdminGuardProps) => {
  const { data: userRole, isLoading } = useUserRole();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!userRole || !allowedRoles.includes(userRole)) {
    return (
      <div className="p-6">
        <Alert className="border-destructive/50 text-destructive">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Você não tem permissão para acessar esta página. Acesso restrito a administradores e gestores.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <>{children}</>;
};
