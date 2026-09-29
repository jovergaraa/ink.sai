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
        className="overflow-hidden bg-[#EAE4DA] transition-opacity group-hover:opacity-80"
        style={{
          height: `${height}px`,
          ...(piece.image
            ? {}
            : {
                backgroundImage:
                  'repeating-linear-gradient(135deg, #E4DED2 0 1px, transparent 1px 15px)',
              }),
        }}
      >
        {piece.image ? (
          <img
            src={piece.image}
            alt={piece.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center font-mono text-[10px] tracking-[0.3em] uppercase text-dim">
            {piece.title}
          </div>
        )}
      </div>
    </figure>
  );
}
