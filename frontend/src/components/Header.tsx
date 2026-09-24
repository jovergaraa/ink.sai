import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthModal from './AuthModal';
import Toast from './Toast';
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
  const [cuentaOpen, setCuentaOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [bienvenida, setBienvenida] = useState<string | null>(null);
  const [esperandoBienvenida, setEsperandoBienvenida] = useState(false);
  const { session, perfil, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const cuentaBtnRef = useRef<HTMLButtonElement>(null);
  const cuentaMenuRef = useRef<HTMLDivElement>(null);
  const [cuentaPos, setCuentaPos] = useState({ top: 0, right: 0 });

  // El menú móvil mantiene todo en una lista (hay espacio de sobra en
  // vertical); en escritorio, Mis reservas y Admin se agrupan dentro del
  // dropdown de cuenta en vez de competir como links sueltos en la barra.
  const appLinksMovil = [
    { to: '/agendar', label: 'Agendar' },
    ...(session ? [{ to: '/mis-reservas', label: 'Mis reservas' }] : []),
    ...(perfil?.rol === 'admin' ? [{ to: '/admin', label: 'Admin' }] : []),
  ];
  const appLinksEscritorio = [{ to: '/agendar', label: 'Agendar' }];

  // El mix-blend-difference es la firma del header sobre el hero, pero más
  // abajo se superpone a los eyebrows de sección y los vuelve ilegibles.
  // Pasado el hero cambiamos a fondo sólido y tinta normal.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // El modal se cierra apenas la sesión aparece. El perfil (con el
  // nombre) llega después, en su propio efecto async dentro de
  // AuthContext — por eso el toast no puede depender de que ambos
  // cambien en la misma pasada: solo marcamos que estamos "esperando"
  // el nombre, y un segundo efecto dispara el toast cuando llega.
  useEffect(() => {
    if (session && authOpen) {
      setAuthOpen(false);
      setEsperandoBienvenida(true);
    }
  }, [session, authOpen]);

  useEffect(() => {
    if (esperandoBienvenida && perfil?.nombre) {
      setBienvenida(perfil.nombre.split(' ')[0]);
      setEsperandoBienvenida(false);
    }
  }, [esperandoBienvenida, perfil]);

  // Cambiar de ruta cierra el menú móvil; si no, queda abierto encima
  // de la página nueva.
  useEffect(() => {
    setMenuOpen(false);
    setCuentaOpen(false);
  }, [location.pathname, location.hash]);

  // El dropdown de cuenta va por portal (ver el render más abajo): el
  // header usa mix-blend-difference sobre el hero, y ese blend se aplica
  // a todo hijo suyo sin excepción. Un panel bg-paper adentro quedaría
  // invertido e ilegible. Al vivir fuera, hay que calcular su posición a
  // mano con el botón.
  useEffect(() => {
    if (!cuentaOpen) return;

    function actualizarPos() {
      const r = cuentaBtnRef.current?.getBoundingClientRect();
      if (r) setCuentaPos({ top: r.bottom + 12, right: window.innerWidth - r.right });
    }
    actualizarPos();

    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (cuentaBtnRef.current?.contains(target) || cuentaMenuRef.current?.contains(target)) {
        return;
      }
      setCuentaOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setCuentaOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    window.addEventListener('keydown', handleKey);
    window.addEventListener('resize', actualizarPos);
    window.addEventListener('scroll', actualizarPos, true);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('resize', actualizarPos);
      window.removeEventListener('scroll', actualizarPos, true);
    };
  }, [cuentaOpen]);

  // Sin el navigate, cerrar sesión desde /admin deja al usuario
  // mirando la pantalla de acceso restringido.
  async function handleSalir() {
    setMenuOpen(false);
    setCuentaOpen(false);
    await signOut();
    navigate('/');
  }

  function abrirLogin() {
    setMenuOpen(false);
    setAuthOpen(true);
  }

  // Si ya está en el home, <Link to="/"> no dispara navegación (misma
  // ruta) y el scroll no se mueve solo. Forzamos el scroll arriba en ese
  // caso; si viene de otra ruta, el Link ya lo deja al tope del home.
  function handleLogoClick(e: React.MouseEvent) {
    if (location.pathname === '/') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
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
      <Link to="/" onClick={handleLogoClick} className={`font-serif italic text-[19px] tracking-wide ${tinta}`}>
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
        {appLinksEscritorio.map((l) => (
          <Link key={l.to} to={l.to}>
            {l.label}
          </Link>
        ))}
        {session ? (
          <button
            ref={cuentaBtnRef}
            type="button"
            onClick={() => setCuentaOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={cuentaOpen}
            className="flex items-center gap-1.5 font-mono uppercase tracking-[0.26em]"
          >
            {perfil?.nombre?.split(' ')[0] ?? 'Cuenta'}
            <span
              aria-hidden="true"
              className={`inline-block text-[8px] transition-transform duration-200 ${cuentaOpen ? '-scale-y-100' : ''}`}
            >
              ▾
            </span>
          </button>
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
          appLinks={appLinksMovil}
          nombre={perfil?.nombre}
          haySesion={Boolean(session)}
          onCerrar={() => setMenuOpen(false)}
          onSalir={handleSalir}
          onIngresar={abrirLogin}
        />
      )}

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
      {bienvenida && <Toast onDone={() => setBienvenida(null)}>Bienvenido, {bienvenida}</Toast>}

      {cuentaOpen &&
        createPortal(
          <div
            ref={cuentaMenuRef}
            role="menu"
            style={{ top: cuentaPos.top, right: cuentaPos.right }}
            className="fixed z-[300] w-44 border border-ink/15 bg-paper py-1.5 text-ink anim-fade"
          >
            {perfil?.rol === 'admin' && (
              <Link
                to="/admin"
                role="menuitem"
                onClick={() => setCuentaOpen(false)}
                className="block px-4 py-2.5 font-mono text-[9.5px] tracking-[0.2em] uppercase hover:bg-ink/[0.04]"
              >
                Panel de control
              </Link>
            )}
            <Link
              to="/mis-reservas"
              role="menuitem"
              onClick={() => setCuentaOpen(false)}
              className="block px-4 py-2.5 font-mono text-[9.5px] tracking-[0.2em] uppercase hover:bg-ink/[0.04]"
            >
              Mis reservas
            </Link>
            <div className="my-1.5 border-t border-ink/10" />
            <button
              type="button"
              role="menuitem"
              onClick={handleSalir}
              className="block w-full px-4 py-2.5 text-left font-mono text-[9.5px] tracking-[0.2em] uppercase text-[#7A7268] hover:bg-ink/[0.04] hover:text-ink"
            >
              Cerrar sesión
            </button>
          </div>,
          document.body
        )}
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
