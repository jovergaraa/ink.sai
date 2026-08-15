import type { Piece } from '../types';

interface Props {
  piece: Piece;
  height: number;
  width?: number;
  marginTop?: number;
  onClick: (piece: Piece) => void;
}

export default function PieceCard({ piece, height, width, marginTop = 0, onClick }: Props) {
  return (
    <figure
      onClick={() => onClick(piece)}
      className="m-0 cursor-pointer flex-shrink-0 group"
      style={{ width: width ? `${width}px` : undefined, marginTop: `${marginTop}px` }}
    >
      <div
        className="flex items-center justify-center bg-[#EAE4DA] font-mono text-[10px] tracking-[0.3em] uppercase text-dim transition-opacity group-hover:opacity-80"
        style={{
          height: `${height}px`,
          backgroundImage:
            'repeating-linear-gradient(135deg, #E4DED2 0 1px, transparent 1px 15px)',
        }}
      >
        {piece.title}
      </div>
      <figcaption className="flex justify-between pt-3 font-mono text-[9px] tracking-[0.26em] text-dim">
        <span>{piece.n}</span>
        <span>{piece.year}</span>
      </figcaption>
    </figure>
  );
}
