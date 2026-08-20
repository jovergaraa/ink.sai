import type { ReactNode } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { Rol } from '../types';

interface Props {
  children: ReactNode;
  requireRol?: Rol;
}

export default function ProtectedRoute({ children, requireRol }: Props) {
  const { session, perfil, loading } = useAuth();
  const location = useLocation();

  // Nunca redirigir mientras se resuelve la sesión: el fondo del sitio
  // evita el flash blanco sin comprometerse con una decisión aún incierta.
  if (loading) {
    return <main className="min-h-screen bg-paper" />;
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Sin rol suficiente se explica en pantalla en vez de redirigir en silencio:
  // así el caso de perfil huérfano tampoco genera un loop de navegación.
  if (requireRol && perfil?.rol !== requireRol) {
    return (
      <main className="min-h-screen pt-32 px-10 text-ink">
        <div className="max-w-sm anim-fade">
          <h1 className="font-serif italic text-3xl mb-3">Acceso restringido</h1>
          <p className="font-body text-lg leading-snug mb-6">
            Esta sección es solo para el equipo del estudio.
          </p>
          <Link
            to="/"
            className="font-mono text-[9.5px] tracking-[0.26em] uppercase border-b border-ink pb-1"
          >
            Volver al inicio
          </Link>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
