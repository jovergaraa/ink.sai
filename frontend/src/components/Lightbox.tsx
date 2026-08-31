import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { Piece } from '../types';

export default function Lightbox({ piece, onClose }: { piece: Piece; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    // Con la pieza abierta el fondo no debe seguir desplazándose.
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = overflowPrevio;
    };
  }, [onClose]);

  // Portal + z sobre el header: si no, el mix-blend-difference del header
  // lo deja flotando legible encima de la obra.
  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[400] bg-[#141210] flex flex-col items-center justify-center gap-5 p-8 md:p-16 cursor-zoom-out anim-fade"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-[min(760px,80vw)] h-[min(70vh,880px)] flex items-center justify-center overflow-hidden bg-[#221E1A] font-mono text-[11px] tracking-[0.34em] uppercase text-[#6B635A]"
        style={{
          ...(piece.image
            ? {}
            : {
                backgroundImage:
                  'repeating-linear-gradient(135deg, #2A2521 0 1px, transparent 1px 15px)',
              }),
        }}
      >
        {piece.image ? (
          <img
            src={piece.image}
            alt={piece.title}
            className="h-full w-full object-contain"
          />
        ) : (
          piece.title
        )}
      </div>
      <div className="flex gap-6 font-mono text-[9px] tracking-[0.28em] uppercase text-[#7A7268]">
        <span>{piece.n}</span>
        <span>{piece.title}</span>
        <span>{piece.year}</span>
      </div>
      <span className="font-mono text-[8.5px] tracking-[0.3em] uppercase text-[#4E4842]">
        Click para cerrar
      </span>
    </div>,
    document.body
  );
}
