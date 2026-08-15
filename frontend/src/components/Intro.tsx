import { useEffect, useState } from 'react';

export default function Intro({ duration = 1900 }: { duration?: number }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), duration);
    return () => clearTimeout(t);
  }, [duration]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-ink flex items-center justify-center anim-out">
      <div className="font-serif italic text-[34px] tracking-wide text-paper opacity-90">
        ink·sai
      </div>
    </div>
  );
}
