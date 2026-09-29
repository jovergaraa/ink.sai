import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import type { Piece } from '../types';
import Intro from '../components/Intro';
import Hero from '../components/Hero';
import TattooGallery from '../components/TattooGallery';
import CanvasGrid from '../components/CanvasGrid';
import Artist from '../components/Artist';
import Contact from '../components/Contact';
import Lightbox from '../components/Lightbox';

export default function Home() {
  const [selected, setSelected] = useState<Piece | null>(null);
  const location = useLocation();

  // Los enlaces de sección son <Link>, así que react-router cambia el hash
  // sin desplazar la página. Hay que hacer el scroll a mano — y eso también
  // cubre llegar desde otra ruta, que antes obligaba a recargar entera.
  useEffect(() => {
    if (!location.hash) return;
    const el = document.getElementById(location.hash.slice(1));
    if (!el) return;
    // Un frame de margen: al montar, las secciones aún no tienen su
    // posición definitiva y el scroll se quedaría corto.
    const id = requestAnimationFrame(() => el.scrollIntoView({ behavior: 'smooth' }));
    return () => cancelAnimationFrame(id);
  }, [location.hash]);

  return (
    <>
      <Intro />
      <main>
        <Hero />
        <TattooGallery onSelect={setSelected} />
        <CanvasGrid onSelect={setSelected} />
        <Artist />
        <Contact />
      </main>
      {selected && <Lightbox piece={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
