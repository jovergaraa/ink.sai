const LINKS = [
  { href: '#tatuajes', label: 'Tatuajes' },
  { href: '#lienzo', label: 'Lienzo' },
  { href: '#artista', label: 'Artista' },
  { href: '#contacto', label: 'Contacto' },
];

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-10 py-5 mix-blend-difference">
      <a href="#hero" className="font-serif italic text-[19px] tracking-wide text-paper">
        ink·sai
      </a>
      <nav className="flex gap-8 font-mono text-[9.5px] tracking-[0.26em] uppercase text-paper">
        {LINKS.map((l) => (
          <a key={l.href} href={l.href}>
            {l.label}
          </a>
        ))}
      </nav>
    </header>
  );
}
