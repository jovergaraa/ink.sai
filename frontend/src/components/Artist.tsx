import simon from '../assets/simon.webp';

const STATS = [
  { label: 'Práctica', value: '2018 —' },
  { label: 'Obras', value: '+ 240' },
  { label: 'Estudio', value: 'Privado' },
];

export default function Artist() {
  return (
    <section id="artista" className="px-10 py-28 bg-[#F4F0E9]">
      <div className="font-mono text-[9.5px] tracking-[0.3em] uppercase text-dim">
        § 04 — Sobre el artista
      </div>
      <h2 className="mt-3.5 m-0 font-serif font-normal text-[40px] md:text-[64px] lg:text-[92px] leading-[0.98] tracking-tight">
        Mano firme,
        <br />
        <em className="italic">mirada lenta.</em>
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,320px)_1fr] gap-10 md:gap-16 mt-14 items-start">
        <div className="relative aspect-[3/4] overflow-hidden bg-[#EAE4DA]">
          <img
            src={simon}
            alt="El artista trabajando en el estudio"
            className="h-full w-full object-cover object-top grayscale-[15%] contrast-[1.05]"
          />
          <span className="absolute left-4 bottom-4 bg-ink text-paper px-3 py-1.5 font-mono text-[8.5px] tracking-[0.28em] uppercase">
            En el estudio
          </span>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3.5">
            <span className="w-8 h-px bg-ink" />
            <span className="font-mono text-[9px] tracking-[0.3em] uppercase text-dim">
              Sobre el artista
            </span>
          </div>
          <p className="m-0 font-body text-[19px] leading-relaxed text-[#3A342D] text-pretty">
            <span className="float-left font-serif text-[64px] leading-[0.78] pr-2.5 pt-1.5">
              S
            </span>
            ai trabaja entre la piel y el lienzo desde hace más de seis años. Blackwork de
            líneas finas, figuras que respiran, tinta que reposa en silencio sobre el cuerpo.
          </p>
          <p className="m-0 font-body text-[19px] leading-relaxed text-[#3A342D] text-pretty">
            Cada pieza se construye en el estudio, una a la vez — boceto, conversación, trazo.
            No se replican diseños. Cada obra vive sólo en una piel o en un lienzo.
          </p>

          <div className="h-px bg-[#DED7CB] mt-6" />
          <div className="grid grid-cols-3 gap-5">
            {STATS.map((s) => (
              <div key={s.label} className="flex flex-col gap-2">
                <span className="font-mono text-[8.5px] tracking-[0.28em] uppercase text-dim">
                  {s.label}
                </span>
                <span className="font-serif italic text-[26px]">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
