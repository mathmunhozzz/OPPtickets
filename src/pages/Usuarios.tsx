
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AdminGuard } from '@/components/auth/AdminGuard';
import { AppLayout } from '@/components/layout/AppLayout';
import { UsuariosContent } from '@/components/usuarios/UsuariosContent';

const Usuarios = () => {
  return (
    <AuthGuard>
      <AdminGuard>
        <AppLayout>
          <UsuariosContent />
        </AppLayout>
      </AdminGuard>
    </AuthGuard>
  );
};

export default Usuarios;
