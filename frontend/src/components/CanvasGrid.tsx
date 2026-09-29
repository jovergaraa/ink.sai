import { useCallback, useState } from 'react';
import type { Piece } from '../types';
import lienzo02 from '../assets/lienzo-02.webp';
import lienzo05 from '../assets/lienzo-05.webp';
import lienzo06 from '../assets/lienzo-06.webp';
import lienzo07 from '../assets/lienzo-07.webp';

// Hay tres obras fotografiadas dos veces (colgada en pared y en detalle);
// se usa la toma de detalle de cada una.
const PIECES: Piece[] = [
  { n: 'N° 01', title: 'Jinetes y naipes', year: '2025', image: lienzo05 },
  { n: 'N° 02', title: 'Baño nocturno', year: '2025', image: lienzo02 },
  { n: 'N° 03', title: 'Motociclista', year: '2025', image: lienzo06 },
  { n: 'N° 04', title: 'Fumador', year: '2025', image: lienzo07 },
];

export default function CanvasGrid({ onSelect }: { onSelect: (p: Piece) => void }) {
  const [featuredIndex, setFeaturedIndex] = useState(0);
  // Nueva key en cada cambio: reinicia la animación de crossfade de la
  // protagonista aunque se vuelva a elegir la misma pieza más tarde.
  const [tick, setTick] = useState(0);
  const featured = PIECES[featuredIndex];

  const chooseFeatured = useCallback((i: number) => {
    setFeaturedIndex(i);
    setTick((t) => t + 1);
  }, []);

  // Un click en la miniatura la promueve a protagonista; un segundo click
  // sobre la que ya es protagonista abre el lightbox — así un solo click
  // no salta directo a la vista ampliada.
  const handleThumbClick = useCallback(
    (i: number) => {
      if (i === featuredIndex) {
        onSelect(PIECES[i]);
        return;
      }
      chooseFeatured(i);
    },
    [featuredIndex, chooseFeatured, onSelect],
  );

  return (
    <section id="lienzo" className="px-10 py-28 bg-[#EDE7DD]">
      <div className="max-w-[1280px] mx-auto">
        <div className="font-mono text-[9.5px] tracking-[0.3em] uppercase text-dim">
          § 03 — Pinturas &amp; obra sobre lienzo · 2020–2026
        </div>
        <div className="flex items-baseline justify-between gap-6 mt-3.5">
          <h2 className="m-0 font-serif font-normal text-[38px] md:text-[64px] lg:text-[86px] leading-none tracking-tight">
            Obra <em className="italic">sobre lienzo</em>
          </h2>
          <span className="font-serif italic text-[30px] md:text-[60px] text-[#CFC7B9] leading-none">
            04
          </span>
        </div>

        <p className="m-0 mt-8 font-body text-[20px] leading-relaxed text-[#3A342D] max-w-[52ch]">
          Cuatro obras, ninguna réplica. Cada lienzo se detiene en una escena
          propia — luz, mesa, calle — y se muestra entero, sin recortes que
          compitan con el color.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_400px] gap-14 mt-14 items-start">
          <figure
            onClick={() => onSelect(featured)}
            className="m-0 cursor-pointer group"
          >
            <div className="overflow-hidden bg-[#E7E1D6] border border-[#DED7CB] aspect-[4/3]">
              <img
                key={tick}
                src={featured.image}
                alt={featured.title}
                className="w-full h-full object-cover transition-opacity group-hover:opacity-85 anim-canvas-featured"
              />
            </div>
            <figcaption className="flex justify-between pt-4 font-mono text-[11px] tracking-[0.26em] text-dim">
              <span>{featured.n}</span>
              <span>{featured.year}</span>
            </figcaption>
            <div className="mt-2 font-serif italic text-[28px]">{featured.title}</div>
          </figure>

          <div className="flex flex-col gap-6">
            {PIECES.map((p, i) => (
              <div
                key={p.n}
                onClick={() => handleThumbClick(i)}
                className={`flex items-center gap-5 cursor-pointer group border-b border-[#DED7CB] pb-6 last:border-b-0 last:pb-0 transition-opacity ${
                  i === featuredIndex ? 'opacity-100' : 'opacity-70 hover:opacity-100'
                }`}
              >
                <div className="flex-none w-[120px] h-[92px] overflow-hidden bg-[#E7E1D6] border border-[#DED7CB]">
                  <img
                    src={p.image}
                    alt={p.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="font-mono text-[10px] tracking-[0.24em] text-dim">
                    {p.n} — {p.year}
                  </div>
                  <div className="font-serif italic text-[21px] mt-1">{p.title}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
