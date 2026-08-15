import { useState } from 'react';
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
