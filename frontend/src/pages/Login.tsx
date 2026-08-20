import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AuthModal from '../components/AuthModal';
import { useAuth } from '../context/AuthContext';

// La UI de auth vive en AuthModal. Esta ruta existe para que
// ProtectedRoute tenga a dónde redirigir y para enlaces directos a /login.
export default function Login() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const desde = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
  const destino = desde && desde !== '/login' ? desde : '/';

  // Cubre el login exitoso y también entrar a /login ya con sesión.
  useEffect(() => {
    if (session) {
      navigate(destino, { replace: true });
    }
  }, [session, destino, navigate]);

  return <AuthModal onClose={() => navigate('/')} />;
}
