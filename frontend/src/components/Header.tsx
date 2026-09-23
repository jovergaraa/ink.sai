import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthModal from './AuthModal';
import { useAuth } from '../context/AuthContext';

const SECTION_LINKS = [
  { to: '/#tatuajes', label: 'Tatuajes' },
  { to: '/#lienzo', label: 'Lienzo' },
  { to: '/#artista', label: 'Artista' },
  { to: '/#contacto', label: 'Contacto' },
];

export default function Header() {
  const [authOpen, setAuthOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { session, perfil, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const appLinks = [
    { to: '/agendar', label: 'Agendar' },
    ...(session ? [{ to: '/mis-reservas', label: 'Mis reservas' }] : []),
    ...(perfil?.rol === 'admin' ? [{ to: '/admin', label: 'Admin' }] : []),
  ];

  // El mix-blend-difference es la firma del header sobre el hero, pero más
  // abajo se superpone a los eyebrows de sección y los vuelve ilegibles.
  // Pasado el hero cambiamos a fondo sólido y tinta normal.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // El modal no se cierra a sí mismo: lo cierra la sesión al aparecer.
  useEffect(() => {
    if (session) setAuthOpen(false);
  }, [session]);

  // Cambiar de ruta cierra el menú móvil; si no, queda abierto encima
  // de la página nueva.
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.hash]);

  // Sin el navigate, cerrar sesión desde /admin deja al usuario
  // mirando la pantalla de acceso restringido.
  async function handleSalir() {
    setMenuOpen(false);
    await signOut();
    navigate('/');
  }

  function abrirLogin() {
    setMenuOpen(false);
    setAuthOpen(true);
  }

  const tinta = scrolled ? 'text-ink' : 'text-paper';

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-6 md:px-10 py-5 transition-colors duration-300 ${
        scrolled
          ? 'bg-paper/95 backdrop-blur-sm border-b border-ink/10'
          : 'mix-blend-difference'
      }`}
    >
      <Link to="/" className={`font-serif italic text-[19px] tracking-wide ${tinta}`}>
        ink·sai
      </Link>

      {/* Escritorio: todo en fila. Bajo md no cabe — hasta nueve elementos
          en un teléfono de 375px se salen de la pantalla. */}
      <nav
        className={`hidden md:flex gap-8 font-mono text-[9.5px] tracking-[0.26em] uppercase ${tinta}`}
      >
        {SECTION_LINKS.map((l) => (
          <Link key={l.to} to={l.to}>
            {l.label}
          </Link>
        ))}
        {appLinks.map((l) => (
          <Link key={l.to} to={l.to}>
            {l.label}
          </Link>
        ))}
        {session ? (
          <>
            <span className="text-dim">{perfil?.nombre ?? 'Cuenta'}</span>
            <button onClick={handleSalir} className="font-mono uppercase tracking-[0.26em]">
              Salir
            </button>
          </>
        ) : (
          <button onClick={abrirLogin} className="font-mono uppercase tracking-[0.26em]">
            Ingresar
          </button>
        )}
      </nav>

      <button
        onClick={() => setMenuOpen(true)}
        aria-label="Abrir menú"
        aria-expanded={menuOpen}
        className={`md:hidden flex flex-col gap-[5px] py-2 ${tinta}`}
      >
        <span className="block w-6 h-px bg-current" />
        <span className="block w-6 h-px bg-current" />
      </button>

      {menuOpen && (
        <MenuMovil
          appLinks={appLinks}
          nombre={perfil?.nombre}
          haySesion={Boolean(session)}
          onCerrar={() => setMenuOpen(false)}
          onSalir={handleSalir}
          onIngresar={abrirLogin}
        />
      )}

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
    </header>
  );
}

interface MenuProps {
  appLinks: { to: string; label: string }[];
  nombre?: string;
  haySesion: boolean;
  onCerrar: () => void;
  onSalir: () => void;
  onIngresar: () => void;
}

function MenuMovil({ appLinks, nombre, haySesion, onCerrar, onSalir, onIngresar }: MenuProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCerrar();
    };
    window.addEventListener('keydown', handler);
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = overflowPrevio;
    };
  }, [onCerrar]);

  // Portal fuera del header: heredar su mix-blend-difference dejaría el
  // menú ilegible sobre el fondo oscuro.
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Menú de navegación"
      className="fixed inset-0 z-[300] flex flex-col bg-[#141210] text-paper anim-fade"
      style={{
        backgroundImage: 'radial-gradient(rgba(242,238,231,0.05) 1px, transparent 1px)',
        backgroundSize: '14px 14px',
      }}
    >
      <div className="flex items-center justify-between px-6 py-5">
        <span className="font-serif italic text-[19px] tracking-wide">ink·sai</span>
        <button
          onClick={onCerrar}
          aria-label="Cerrar menú"
          className="font-mono text-[10px] tracking-[0.28em] uppercase text-[#7A7268] py-2"
        >
          Cerrar
        </button>
      </div>

      <nav className="flex flex-col gap-1 px-6 mt-6">
        {SECTION_LINKS.map((l) => (
          <Link key={l.to} to={l.to} className="font-serif italic text-[34px] py-2">
            {l.label}
          </Link>
        ))}
      </nav>

      <div className="mt-auto px-6 pb-10">
        <div className="h-px bg-[#3A342D] mb-6" />
        <div className="flex flex-col gap-4 font-mono text-[11px] tracking-[0.28em] uppercase">
          {appLinks.map((l) => (
            <Link key={l.to} to={l.to} className="py-1">
              {l.label}
            </Link>
          ))}
          {haySesion ? (
            <>
              <span className="text-[#7A7268] py-1">{nombre ?? 'Cuenta'}</span>
              <button
                onClick={onSalir}
                className="font-mono text-[11px] tracking-[0.28em] uppercase text-left py-1"
              >
                Salir
              </button>
            </>
          ) : (
            <button
              onClick={onIngresar}
              className="font-mono text-[11px] tracking-[0.28em] uppercase text-left py-1"
            >
              Ingresar
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
