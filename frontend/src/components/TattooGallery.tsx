import { useRef, useState } from 'react';
import type { Piece } from '../types';
import PieceCard from './PieceCard';

const PIECES: (Piece & { width: number; height: number; marginTop: number })[] = [
  { n: 'N° 01', title: 'Botanical · Arm', year: '2025', width: 380, height: 500, marginTop: 0 },
  { n: 'N° 02', title: 'Fine line · Rib', year: '2025', width: 290, height: 390, marginTop: 26 },
  { n: 'N° 03', title: 'Wildlife · Back', year: '2025', width: 330, height: 460, marginTop: 56 },
  { n: 'N° 04', title: 'Floral · Spine', year: '2024', width: 270, height: 540, marginTop: 96 },
  { n: 'N° 05', title: 'Ornamental · Nape', year: '2024', width: 340, height: 430, marginTop: 16 },
];

export default function TattooGallery({ onSelect }: { onSelect: (p: Piece) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [pct, setPct] = useState(0);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setPct(max > 0 ? Math.round((el.scrollLeft / max) * 100) : 0);
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && scrollRef.current) {
      scrollRef.current.scrollLeft += e.deltaY;
    }
  };

  return (
    <section id="tatuajes" className="pt-[110px] bg-paper">
      <div className="px-10">
        <div className="font-mono text-[9.5px] tracking-[0.3em] uppercase text-dim">
          § 02 — Galería de tatuajes · 2023–2026
        </div>
        <div className="flex items-baseline justify-between gap-6 mt-3.5">
          <h2 className="m-0 font-serif font-normal text-[38px] md:text-[64px] lg:text-[86px] leading-none tracking-tight">
            Tinta <em className="italic">sobre piel</em>
          </h2>
          <span className="font-serif italic text-[30px] md:text-[60px] text-[#CFC7B9] leading-none">
            04
          </span>
        </div>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        onWheel={handleWheel}
        className="flex items-start gap-8 overflow-x-auto no-scrollbar px-10 pt-14 pb-5 cursor-grab active:cursor-grabbing"
      >
        {PIECES.map((p) => (
          <PieceCard key={p.n} piece={p} width={p.width} height={p.height} marginTop={p.marginTop} onClick={onSelect} />
        ))}
      </div>

      <div className="px-10 pb-7">
        <div className="h-px bg-[#DED7CB] relative">
          <div className="h-px bg-ink transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex justify-between pt-3.5 font-mono text-[9px] tracking-[0.28em] uppercase text-dim">
          <span>← Desliza horizontal →</span>
          <span>Click para ampliar</span>
        </div>
      </div>
    </section>
  );
}
