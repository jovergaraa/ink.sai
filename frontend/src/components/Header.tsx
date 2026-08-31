import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthModal from './AuthModal';
import { useAuth } from '../context/AuthContext';

const SECTION_LINKS = [
  { href: '/#tatuajes', label: 'Tatuajes' },
  { href: '/#lienzo', label: 'Lienzo' },
  { href: '/#artista', label: 'Artista' },
  { href: '/#contacto', label: 'Contacto' },
];

export default function Header() {
  const [authOpen, setAuthOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { session, perfil, signOut } = useAuth();
  const navigate = useNavigate();

  // El mix-blend-difference es la firma del header sobre el hero, pero más
  // abajo se superpone a los eyebrows de sección y los vuelve ilegibles.
  // Pasado el hero cambiamos a fondo sólido y tinta normal.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const appLinks = [
    { to: '/agendar', label: 'Agendar' },
    ...(session ? [{ to: '/mis-reservas', label: 'Mis reservas' }] : []),
    ...(perfil?.rol === 'admin' ? [{ to: '/admin', label: 'Admin' }] : []),
  ];

  // El modal no se cierra a sí mismo: lo cierra la sesión al aparecer.
  useEffect(() => {
    if (session) setAuthOpen(false);
  }, [session]);

  // Sin el navigate, cerrar sesión desde /admin deja al usuario
  // mirando la pantalla de acceso restringido.
  async function handleSalir() {
    await signOut();
    navigate('/');
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-10 py-5 transition-colors duration-300 ${
        scrolled
          ? 'bg-paper/95 backdrop-blur-sm border-b border-ink/10'
          : 'mix-blend-difference'
      }`}
    >
      <Link
        to="/"
        className={`font-serif italic text-[19px] tracking-wide ${scrolled ? 'text-ink' : 'text-paper'}`}
      >
        ink·sai
      </Link>
      <nav
        className={`flex gap-8 font-mono text-[9.5px] tracking-[0.26em] uppercase ${
          scrolled ? 'text-ink' : 'text-paper'
        }`}
      >
        {SECTION_LINKS.map((l) => (
          <a key={l.href} href={l.href}>
            {l.label}
          </a>
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
          <button onClick={() => setAuthOpen(true)} className="font-mono uppercase tracking-[0.26em]">
            Ingresar
          </button>
        )}
      </nav>

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
    </header>
  );
}
