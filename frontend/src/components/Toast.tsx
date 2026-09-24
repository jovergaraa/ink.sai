import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export default function Toast({
  children,
  onDone,
  duration = 2400,
}: {
  children: React.ReactNode;
  onDone: () => void;
  duration?: number;
}) {
  const [saliendo, setSaliendo] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setSaliendo(true), duration);
    return () => clearTimeout(t);
  }, [duration]);

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      onAnimationEnd={() => {
        if (saliendo) onDone();
      }}
      className={`fixed left-1/2 top-6 z-[400] -translate-x-1/2 ${
        saliendo ? 'anim-toast-out' : 'anim-toast-in'
      }`}
    >
      <div className="flex items-center gap-3 bg-ink px-6 py-3.5 text-paper">
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true" className="shrink-0">
          <path d="M2.5 8L6 11.5L12.5 4" stroke="currentColor" strokeWidth="1.4" />
        </svg>
        <span className="font-mono text-[10.5px] tracking-[0.16em] uppercase">{children}</span>
      </div>
    </div>,
    document.body
  );
}
