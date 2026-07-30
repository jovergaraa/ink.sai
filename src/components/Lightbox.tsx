import { useEffect } from 'react';
import type { Piece } from '../types';

export default function Lightbox({ piece, onClose }: { piece: Piece; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[150] bg-[rgba(20,18,15,0.94)] flex flex-col items-center justify-center gap-5 p-8 md:p-16 cursor-zoom-out anim-fade"
    >
      <div
        className="w-[min(760px,80vw)] h-[min(70vh,880px)] flex items-center justify-center bg-[#221E1A] font-mono text-[11px] tracking-[0.34em] uppercase text-[#6B635A]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(135deg, #2A2521 0 1px, transparent 1px 15px)',
        }}
      >
        {piece.title}
      </div>
      <div className="flex gap-6 font-mono text-[9px] tracking-[0.28em] uppercase text-[#7A7268]">
        <span>{piece.n}</span>
        <span>{piece.title}</span>
        <span>{piece.year}</span>
      </div>
      <span className="font-mono text-[8.5px] tracking-[0.3em] uppercase text-[#4E4842]">
        Click para cerrar
      </span>
    </div>
  );
}
