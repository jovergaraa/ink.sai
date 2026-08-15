export default function Hero() {
  return (
    <section
      id="hero"
      className="min-h-screen flex flex-col justify-between px-10 pt-[120px] pb-10 bg-paper"
    >
      <div className="font-mono text-[9.5px] tracking-[0.3em] uppercase text-dim">
        § 01 — Tatuaje &amp; pintura · Estudio privado
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1.55fr_1fr] gap-14 items-end py-16">
        <h1 className="m-0 font-serif font-normal text-[56px] md:text-[110px] lg:text-[148px] leading-[0.92] tracking-tight text-balance">
          Tinta que
          <br />
          <em className="italic">respira.</em>
        </h1>
        <div className="flex flex-col gap-5 pb-3">
          <p className="m-0 font-body text-lg leading-relaxed text-[#4A443C] max-w-[36ch] text-pretty">
            Blackwork de líneas finas y obra sobre lienzo. Cada pieza se dibuja una sola vez,
            para una sola piel.
          </p>
          <a
            href="#tatuajes"
            className="font-mono text-[9.5px] tracking-[0.3em] uppercase text-ink border-b border-ink pb-1.5 self-start"
          >
            Ver el trabajo →
          </a>
        </div>
      </div>

      <div className="flex justify-between items-center border-t border-[#DED7CB] pt-4 font-mono text-[9.5px] tracking-[0.26em] uppercase text-dim">
        <span>Desde 2018</span>
        <span>Sólo con cita</span>
        <span>↓ Desliza</span>
      </div>
    </section>
  );
}
