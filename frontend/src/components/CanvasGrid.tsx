import type { Piece } from '../types';

const PIECES: (Piece & { span: number; height: number })[] = [
  { n: 'N° 01', title: 'Figure · Painting', year: '2024', span: 5, height: 620 },
  { n: 'N° 02', title: 'Abstract · Ink', year: '2024', span: 12, height: 560 },
  { n: 'N° 03', title: 'Portrait · Study', year: '2025', span: 6, height: 700 },
  { n: 'N° 04', title: 'Abstract · Oil', year: '2024', span: 6, height: 500 },
  { n: 'N° 05', title: 'Figure · Oil', year: '2024', span: 6, height: 560 },
  { n: 'N° 06', title: 'Portrait · II', year: '2025', span: 12, height: 620 },
  { n: 'N° 07', title: 'Abstract · Fall', year: '2025', span: 12, height: 480 },
];

export default function CanvasGrid({ onSelect }: { onSelect: (p: Piece) => void }) {
  return (
    <section id="lienzo" className="px-10 py-28 bg-[#EDE7DD]">
      <div className="font-mono text-[9.5px] tracking-[0.3em] uppercase text-dim">
        § 03 — Pinturas &amp; obra sobre lienzo · 2020–2026
      </div>
      <div className="flex items-baseline justify-between gap-6 mt-3.5">
        <h2 className="m-0 font-serif font-normal text-[38px] md:text-[64px] lg:text-[86px] leading-none tracking-tight">
          Obra <em className="italic">sobre lienzo</em>
        </h2>
        <span className="font-serif italic text-[30px] md:text-[60px] text-[#CFC7B9] leading-none">
          07
        </span>
      </div>

      <div className="grid grid-cols-12 gap-8 mt-14">
        {PIECES.map((p) => (
          <figure
            key={p.n}
            onClick={() => onSelect(p)}
            className="m-0 cursor-pointer group"
            style={{ gridColumn: `span ${p.span} / span ${p.span}` }}
          >
            <div
              className="flex items-center justify-center bg-[#E7E1D6] font-mono text-[10px] tracking-[0.3em] uppercase text-dim transition-opacity group-hover:opacity-80"
              style={{
                height: `${p.height}px`,
                backgroundImage:
                  'repeating-linear-gradient(135deg, #E1DACD 0 1px, transparent 1px 15px)',
              }}
            >
              {p.title}
            </div>
            <figcaption className="flex justify-between pt-3 font-mono text-[9px] tracking-[0.26em] text-dim">
              <span>{p.n}</span>
              <span>{p.year}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
