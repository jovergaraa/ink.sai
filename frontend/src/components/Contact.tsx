const CHANNELS = [
  { label: 'hola@ink-sai.art', tag: 'Mail' },
  { label: 'behance.net/inksai', tag: 'Work' },
  { label: 'are.na/ink-sai', tag: 'Notes' },
];

const BOOKING = [
  { label: 'Tatuaje — consulta', tag: '01' },
  { label: 'Comisión pintura', tag: '02' },
  { label: 'Visita al estudio', tag: '03' },
];

export default function Contact() {
  return (
    <section
      id="contacto"
      className="relative overflow-hidden px-10 pt-28 bg-ink text-[#EFEAE1]"
    >
      <div className="font-mono text-[9.5px] tracking-[0.3em] uppercase text-[#7A7268]">
        § 05 — Contacto
      </div>
      <h2 className="mt-4 m-0 font-serif font-normal text-[44px] md:text-[80px] lg:text-[110px] leading-[0.96] tracking-tight">
        Escríbeme.
        <br />
        <em className="italic">Conversemos</em>{' '}
        <span className="border-b-2 border-[#EFEAE1]">la pieza.</span>
      </h2>

      <div className="h-px bg-[#3A342D] my-16" />

      <div className="grid grid-cols-1 md:grid-cols-[1fr_1.35fr] gap-16">
        <div className="flex flex-col gap-6">
          <span className="font-mono text-[8.5px] tracking-[0.3em] uppercase text-[#7A7268]">
            Canal principal
          </span>
          <a
            href="#contacto"
            className="font-serif italic text-[34px] border-b border-[#6B635A] self-start pb-1"
          >
            @ink.sai
          </a>
          <a
            href="#contacto"
            className="font-serif italic text-[34px] border-b border-[#6B635A] self-start pb-1"
          >
            WhatsApp →
          </a>
        </div>

        <div className="flex flex-col gap-8">
          <div className="flex flex-col">
            <span className="font-mono text-[8.5px] tracking-[0.3em] uppercase text-[#7A7268] pb-3.5">
              Otros canales
            </span>
            {CHANNELS.map((c, i) => (
              <a
                key={c.label}
                href="#contacto"
                className={`flex justify-between items-baseline border-t border-[#3A342D] py-4 font-body text-xl hover:text-white ${
                  i === CHANNELS.length - 1 ? 'border-b' : ''
                }`}
              >
                <span>{c.label}</span>
                <span className="font-mono text-[8.5px] tracking-[0.28em] uppercase text-[#7A7268]">
                  {c.tag}
                </span>
              </a>
            ))}
          </div>
          <div className="flex flex-col">
            <span className="font-mono text-[8.5px] tracking-[0.3em] uppercase text-[#7A7268] pb-3.5">
              Agenda
            </span>
            {BOOKING.map((b, i) => (
              <a
                key={b.label}
                href="#contacto"
                className={`flex justify-between items-baseline border-t border-[#3A342D] py-4 font-body text-xl hover:text-white ${
                  i === BOOKING.length - 1 ? 'border-b' : ''
                }`}
              >
                <span>{b.label}</span>
                <span className="font-mono text-[8.5px] tracking-[0.28em] text-[#7A7268]">
                  {b.tag}
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="relative z-[2] flex justify-between items-center mt-24 pb-8 font-mono text-[8.5px] tracking-[0.3em] uppercase text-[#7A7268]">
        <span>Ink·sai — MMXXVI</span>
        <span>Hecho a mano</span>
        <a href="#hero">↑ Volver arriba</a>
      </div>

      <div className="relative h-[100px] md:h-[150px] overflow-hidden">
        <div className="absolute left-0 right-0 -bottom-8 text-center font-serif italic text-[80px] md:text-[180px] lg:text-[300px] leading-[0.8] text-[#241F1B] select-none">
          ink·sai
        </div>
      </div>
    </section>
  );
}
