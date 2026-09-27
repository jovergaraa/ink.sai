import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import AdminLayout from '../components/AdminLayout';

interface Hueco {
  id: string;
  fecha: string;
  hora: string;
  duracion_minutos: number;
  nota: string | null;
  tomado: boolean;
}

// Los mismos largos que ofrecen los servicios, para no tener que escribir
// minutos a mano cada vez.
const DURACIONES = [
  { min: 60, label: '1 h' },
  { min: 120, label: '2 h' },
  { min: 180, label: '3 h' },
  { min: 240, label: '4 h' },
  { min: 300, label: '5 h' },
  { min: 360, label: '6 h' },
];

function fmtDuracion(min: number) {
  const h = Math.floor(min / 60);
  const resto = min % 60;
  if (h === 0) return `${resto} min`;
  return resto === 0 ? `${h} h` : `${h} h ${resto} min`;
}

function fmtFecha(iso: string) {
  // iso viene como 'YYYY-MM-DD'. Se parte a mano en vez de usar new Date(iso),
  // que interpreta la cadena como UTC y en Chile devuelve el día anterior.
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(a, m - 1, d).toLocaleDateString('es-CL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function fmtHora(hhmmss: string) {
  return hhmmss.slice(0, 5);
}

const CLASES_INPUT =
  'w-full bg-transparent border-b border-ink/20 focus:border-ink outline-none font-body text-lg py-2';
const CLASES_LABEL = 'font-mono text-[9px] tracking-[0.22em] uppercase text-dim';

export default function AdminHuecos() {
  const [huecos, setHuecos] = useState<Hueco[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [duracion, setDuracion] = useState(120);
  const [nota, setNota] = useState('');

  const hoy = new Date().toLocaleDateString('sv-SE'); // 'YYYY-MM-DD' local

  useEffect(() => {
    let cancelado = false;

    supabase
      .from('huecos')
      .select('id, fecha, hora, duracion_minutos, nota, tomado')
      .gte('fecha', hoy)
      .order('fecha', { ascending: true })
      .order('hora', { ascending: true })
      .then(({ data, error: err }) => {
        if (cancelado) return;
        if (err) setError('No pudimos cargar los horarios. Intenta recargar la página.');
        else setHuecos((data as Hueco[]) ?? []);
        setLoading(false);
      });

    return () => {
      cancelado = true;
    };
  }, [hoy]);

  async function crear(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setGuardando(true);

    const { data, error: err } = await supabase
      .from('huecos')
      .insert({
        fecha,
        hora,
        duracion_minutos: duracion,
        nota: nota.trim() || null,
      })
      .select('id, fecha, hora, duracion_minutos, nota, tomado')
      .single();

    setGuardando(false);

    if (err || !data) {
      setError('No pudimos publicar el horario. Revisa los datos e intenta de nuevo.');
      return;
    }

    const nuevo = data as Hueco;
    setHuecos((rows) =>
      [...rows, nuevo].sort((a, b) =>
        a.fecha === b.fecha ? a.hora.localeCompare(b.hora) : a.fecha.localeCompare(b.fecha),
      ),
    );
    setHora('');
    setNota('');
  }

  async function borrar(h: Hueco) {
    setError(null);
    const { error: err } = await supabase.from('huecos').delete().eq('id', h.id);

    if (err) {
      // on delete restrict: la base bloquea borrar un hueco con reserva viva.
      setError(
        'Ese horario ya tiene una solicitud. Recházala primero desde Reservas y volverá a quedar libre.',
      );
      return;
    }

    setHuecos((rows) => rows.filter((r) => r.id !== h.id));
  }

  // Agrupar por fecha para que la lista se lea como una agenda.
  const porFecha = huecos.reduce<Record<string, Hueco[]>>((acc, h) => {
    (acc[h.fecha] ??= []).push(h);
    return acc;
  }, {});

  return (
    <AdminLayout>
      <div className="flex flex-col gap-1.5">
        <span className="font-mono text-[9.5px] tracking-[0.3em] uppercase text-dim">
          § Admin — Horarios
        </span>
        <h1 className="font-serif text-[42px]">Horarios</h1>
        <p className="font-body text-[17px] text-[#3A342D] max-w-[56ch] mt-2">
          Publica los horarios en los que puedes atender. El cliente solo podrá
          elegir entre estos, y solo si su sesión cabe en la duración que indiques.
        </p>
      </div>

      {error && (
        <p role="alert" className="font-mono text-[11px] leading-relaxed border-l-2 border-ink pl-3">
          {error}
        </p>
      )}

      <form onSubmit={crear} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_2fr_auto] gap-5 md:items-end border-b border-dim/40 pb-8">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="fecha" className={CLASES_LABEL}>Fecha</label>
          <input
            id="fecha"
            type="date"
            required
            min={hoy}
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className={CLASES_INPUT}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="hora" className={CLASES_LABEL}>Hora</label>
          <input
            id="hora"
            type="time"
            required
            value={hora}
            onChange={(e) => setHora(e.target.value)}
            className={CLASES_INPUT}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="duracion" className={CLASES_LABEL}>Duración</label>
          <select
            id="duracion"
            value={duracion}
            onChange={(e) => setDuracion(Number(e.target.value))}
            className={CLASES_INPUT}
          >
            {DURACIONES.map((d) => (
              <option key={d.min} value={d.min}>{d.label}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="nota" className={CLASES_LABEL}>Nota (opcional)</label>
          <input
            id="nota"
            type="text"
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="Solo piezas chicas"
            className={`${CLASES_INPUT} placeholder:text-[#B9AF9C]`}
          />
        </div>

        <button
          type="submit"
          disabled={guardando}
          className="font-mono bg-ink text-paper text-[10px] tracking-[0.2em] uppercase px-5 py-3.5 disabled:opacity-40"
        >
          {guardando ? 'Publicando…' : '+ Publicar'}
        </button>
      </form>

      {loading && (
        <div
          className="flex items-center justify-center h-40"
          style={{ backgroundImage: 'repeating-linear-gradient(135deg, #E4DED2 0 1px, transparent 1px 15px)' }}
        >
          <p className="font-serif italic text-lg">Cargando horarios…</p>
        </div>
      )}

      {!loading && huecos.length === 0 && (
        <div
          className="flex items-center justify-center h-40"
          style={{ backgroundImage: 'repeating-linear-gradient(135deg, #E4DED2 0 1px, transparent 1px 15px)' }}
        >
          <p className="font-serif italic text-lg">
            Todavía no publicaste ningún horario.
          </p>
        </div>
      )}

      {!loading && huecos.length > 0 && (
        <div className="flex flex-col gap-9">
          {Object.entries(porFecha).map(([f, delDia]) => (
            <div key={f}>
              {/* first-letter y no capitalize: capitalize pondría mayúscula en
                  cada palabra ("30 De Septiembre"). */}
              <h2 className="font-serif italic text-[22px] first-letter:uppercase border-b border-ink pb-2">
                {fmtFecha(f)}
              </h2>
              {delDia.map((h) => (
                <div
                  key={h.id}
                  className="grid grid-cols-[auto_auto_1fr_auto] gap-5 items-center py-4 border-b border-dim/30"
                >
                  <span className="font-mono text-[15px] tabular-nums">{fmtHora(h.hora)}</span>
                  <span className="font-mono text-[11px] text-[#7A7268]">
                    {fmtDuracion(h.duracion_minutos)}
                  </span>
                  <span className="font-body text-[15px] text-[#3A342D]">
                    {h.nota}
                    {h.tomado && (
                      <span className="ml-3 inline-block px-2.5 py-1 bg-ink text-paper font-mono text-[9px] tracking-[0.18em] uppercase">
                        Solicitado
                      </span>
                    )}
                  </span>
                  {!h.tomado && (
                    <button
                      onClick={() => borrar(h)}
                      className="font-mono text-[9.5px] tracking-[0.22em] uppercase text-dim hover:text-ink transition-colors"
                    >
                      Quitar
                    </button>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
