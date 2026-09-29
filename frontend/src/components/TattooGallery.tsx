import { useCallback, useEffect, useRef, useState } from 'react';
import type { Piece } from '../types';
import PieceCard from './PieceCard';
import tatuaje01 from '../assets/tatuaje-01.webp';
import tatuaje02 from '../assets/tatuaje-02.webp';
import tatuaje03 from '../assets/tatuaje-03.webp';
import tatuaje04 from '../assets/tatuaje-04.webp';
import tatuaje05 from '../assets/tatuaje-05.webp';
import tatuaje08 from '../assets/tatuaje-08.webp';
import tatuaje09 from '../assets/tatuaje-09.webp';
import tatuaje10 from '../assets/tatuaje-10.webp';
import tatuaje11 from '../assets/tatuaje-11.webp';
import tatuaje12 from '../assets/tatuaje-12.webp';
import tatuaje13 from '../assets/tatuaje-13.webp';
import tatuaje14 from '../assets/tatuaje-14.webp';
import tatuaje15 from '../assets/tatuaje-15.webp';
import tatuaje16 from '../assets/tatuaje-16.webp';
import tatuaje17 from '../assets/tatuaje-17.webp';

// Algunas fotos llegaron repetidas (misma pieza, distinta toma o recompresión).
// Aquí queda una sola entrada por tatuaje.
const PIECES: (Piece & { width: number; height: number; marginTop: number })[] = [
  { n: 'N° 01', title: 'Amapola · Sien', year: '2025', width: 340, height: 460, marginTop: 0, image: tatuaje01 },
  { n: 'N° 02', title: 'Rama · Mano', year: '2025', width: 300, height: 420, marginTop: 30, image: tatuaje02 },
  { n: 'N° 03', title: 'Virgen · Pantorrilla', year: '2025', width: 320, height: 480, marginTop: 10, image: tatuaje03 },
  { n: 'N° 04', title: 'Mariposa · Antebrazo', year: '2025', width: 300, height: 420, marginTop: 46, image: tatuaje04 },
  { n: 'N° 05', title: 'Peonía · Hombro', year: '2025', width: 320, height: 460, marginTop: 4, image: tatuaje05 },
  { n: 'N° 06', title: 'Mariposas · Clavícula', year: '2025', width: 300, height: 420, marginTop: 30, image: tatuaje08 },
  { n: 'N° 07', title: 'Abanico · Brazo', year: '2025', width: 300, height: 420, marginTop: 42, image: tatuaje09 },
  { n: 'N° 08', title: 'Virgen · Espalda', year: '2025', width: 340, height: 470, marginTop: 0, image: tatuaje10 },
  { n: 'N° 09', title: 'Daga · Columna', year: '2025', width: 300, height: 430, marginTop: 26, image: tatuaje11 },
  { n: 'N° 10', title: 'Medallón · Brazo', year: '2025', width: 300, height: 420, marginTop: 10, image: tatuaje12 },
  { n: 'N° 11', title: 'Gatos · Antebrazo', year: '2025', width: 320, height: 460, marginTop: 40, image: tatuaje13 },
  { n: 'N° 12', title: 'Golondrina · Antebrazo', year: '2025', width: 300, height: 420, marginTop: 6, image: tatuaje14 },
  { n: 'N° 13', title: 'Dragón · Antebrazo', year: '2025', width: 300, height: 420, marginTop: 34, image: tatuaje15 },
  { n: 'N° 14', title: 'Rosa · Costado', year: '2025', width: 300, height: 420, marginTop: 14, image: tatuaje16 },
  { n: 'N° 15', title: 'Flores · Hombro', year: '2025', width: 320, height: 460, marginTop: 44, image: tatuaje17 },
];

const AUTO_ADVANCE_MS = 3600;

export default function TattooGallery({ onSelect }: { onSelect: (p: Piece) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [index, setIndex] = useState(0);
  const [reduceMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  // Cambia solo para reiniciar la animación visual de la barra tras un
  // click manual; el temporizador real vive en el ref de abajo.
  const [tick, setTick] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scrollToCard = useCallback((i: number) => {
    // scrollIntoView recorre también los contenedores ancestros (incluida
    // la ventana) cuando el carrusel no está entero a la vista, y termina
    // saltando la página entera a esta sección. Se mueve solo el scroll
    // horizontal del carril, calculando la posición a mano.
    const el = scrollRef.current;
    const card = cardRefs.current[i];
    if (el && card) {
      const target = card.offsetLeft - el.offsetLeft;
      // Las últimas piezas no tienen suficiente ancho detrás para llegar
      // al borde izquierdo: sin este tope, el scroll se clampea antes de
      // "moverse" y las últimas piezas parecen congeladas en su sitio.
      const maxScroll = el.scrollWidth - el.clientWidth;
      el.scrollTo({ left: Math.min(target, maxScroll), behavior: 'smooth' });
    }
  }, []);

  // Varias piezas del final comparten el mismo maxScroll (ya caben enteras
  // en el carril): si el auto-advance las recorriera una a una, el scroll
  // no se movería en ninguno de esos ticks y el carrusel parecería
  // congelado. En cuanto detectamos que ya no queda scroll por recorrer,
  // saltamos directo al inicio — esas piezas ya están todas a la vista.
  const isAtScrollEnd = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return false;
    return el.scrollLeft >= el.scrollWidth - el.clientWidth - 1;
  }, []);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (reduceMotion) return;
    timerRef.current = setInterval(() => {
      setIndex((i) => {
        const next = isAtScrollEnd() ? 0 : (i + 1) % PIECES.length;
        scrollToCard(next);
        return next;
      });
    }, AUTO_ADVANCE_MS);
  }, [reduceMotion, scrollToCard, isAtScrollEnd]);

  useEffect(() => {
    startTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Botones: saltan a la pieza pedida y matan el interval en curso antes
  // de crear uno nuevo. Sin el clearInterval inmediato, el timer viejo
  // podía disparar en el mismo instante que el click y sumar dos avances
  // de golpe (p. ej. de la pieza 9 saltar directo a la 11).
  const goManual = useCallback(
    (i: number) => {
      const clamped = (i + PIECES.length) % PIECES.length;
      setIndex(clamped);
      scrollToCard(clamped);
      setTick((t) => t + 1);
      startTimer();
    },
    [scrollToCard, startTimer],
  );

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
            15
          </span>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex items-start gap-8 overflow-x-auto no-scrollbar px-10 pt-14 pb-5 scroll-smooth"
      >
        {PIECES.map((p, i) => (
          <div key={p.n} ref={(el) => { cardRefs.current[i] = el; }}>
            <PieceCard piece={p} width={p.width} height={p.height} marginTop={p.marginTop} onClick={onSelect} />
          </div>
        ))}
      </div>

      <div className="px-10 pb-7">
        <div className="flex items-center justify-between gap-6">
          <button
            onClick={() => goManual(index - 1)}
            aria-label="Pieza anterior"
            className="font-mono text-[11px] tracking-[0.28em] uppercase text-dim hover:text-ink transition-colors"
          >
            ← Anterior
          </button>

          {/* Un ciclo por pieza: se rellena de 0 a 100% y, al cambiar de
              pieza, vuelve a arrancar vacía en el mismo tic — así nunca
              queda "llena y quieta" esperando el siguiente avance. */}
          <div className="relative h-px flex-1 bg-[#DED7CB]">
            {!reduceMotion && (
              <div
                key={`${index}-${tick}`}
                className="absolute inset-y-0 left-0 h-px bg-ink"
                style={{ animation: `tattoo-progress ${AUTO_ADVANCE_MS}ms linear forwards` }}
              />
            )}
          </div>

          <button
            onClick={() => goManual(isAtScrollEnd() ? 0 : index + 1)}
            aria-label="Pieza siguiente"
            className="font-mono text-[11px] tracking-[0.28em] uppercase text-dim hover:text-ink transition-colors"
          >
            Siguiente →
          </button>
        </div>
      </div>
    </section>
  );
}
