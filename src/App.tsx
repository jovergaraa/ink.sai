import { useState } from 'react';
import type { Piece } from './types';
import Intro from './components/Intro';
import Header from './components/Header';
import Hero from './components/Hero';
import TattooGallery from './components/TattooGallery';
import CanvasGrid from './components/CanvasGrid';
import Artist from './components/Artist';
import Contact from './components/Contact';
import Lightbox from './components/Lightbox';

function App() {
  const [selected, setSelected] = useState<Piece | null>(null);

  return (
    <div className="min-h-screen bg-paper text-ink selection:bg-ink selection:text-paper overflow-x-hidden">
      <Intro />
      <Header />
      <main>
        <Hero />
        <TattooGallery onSelect={setSelected} />
        <CanvasGrid onSelect={setSelected} />
        <Artist />
        <Contact />
      </main>
      {selected && <Lightbox piece={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

export default App;
