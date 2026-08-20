import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthModal from './AuthModal';

const SECTION_LINKS = [
  { href: '/#tatuajes', label: 'Tatuajes' },
  { href: '/#lienzo', label: 'Lienzo' },
  { href: '/#artista', label: 'Artista' },
  { href: '/#contacto', label: 'Contacto' },
];

const APP_LINKS = [
  { to: '/agendar', label: 'Agendar' },
  { to: '/mis-reservas', label: 'Mis reservas' },
];

export default function Header() {
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-10 py-5 mix-blend-difference">
      <Link to="/" className="font-serif italic text-[19px] tracking-wide text-paper">
        ink·sai
      </Link>
      <nav className="flex gap-8 font-mono text-[9.5px] tracking-[0.26em] uppercase text-paper">
        {SECTION_LINKS.map((l) => (
          <a key={l.href} href={l.href}>
            {l.label}
          </a>
        ))}
        {APP_LINKS.map((l) => (
          <Link key={l.to} to={l.to}>
            {l.label}
          </Link>
        ))}
        <button onClick={() => setAuthOpen(true)} className="font-mono uppercase tracking-[0.26em]">
          Ingresar
        </button>
      </nav>

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
    </header>
  );
}
