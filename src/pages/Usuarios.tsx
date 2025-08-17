
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AdminGuard } from '@/components/auth/AdminGuard';
import { UsuariosContent } from '@/components/usuarios/UsuariosContent';

const Usuarios = () => {
  return (
    <AuthGuard>
      <AdminGuard>
        <UsuariosContent />
      </AdminGuard>
    </AuthGuard>
  );
};

export default Usuarios;
