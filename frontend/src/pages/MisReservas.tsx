import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import {
  diasHasta,
  fmtDuracion,
  fmtFecha,
  fmtHora,
  fmtMonto,
  hoyIso,
} from '../lib/formato';

// PostgREST devuelve el recurso incrustado como objeto, o null si RLS no lo
// deja ver: un servicio que el artista desactivó deja de ser legible, pero la
// reserva sigue siendo del cliente y tiene que salir igual.
interface Servicio {
  tipo: string;
  precio: number;
  duracion_minutos: number;
}

interface Reserva {
  id: string;
  fecha: string;
  hora: string;
  estado: 'pendiente' | 'confirmado' | 'cancelado';
  comentario: string | null;
  referencia_path: string | null;
  created_at: string;
  services: Servicio | null;
}

// Cancelar con menos de esto pierde la seña (D11).
const DIAS_AVISO = 2;

const ESTADOS: Record<Reserva['estado'], { texto: string; clases: string }> = {
  pendiente: { texto: 'En revisión', clases: 'border border-ink text-ink' },
  confirmado: { texto: 'Confirmada', clases: 'bg-ink text-paper border border-ink' },
  cancelado: { texto: 'Cancelada', clases: 'border border-[#B3A997] text-[#7E7568]' },
};

export default function MisReservas() {
  const { user } = useAuth();

  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // path -> url firmada. El bucket es privado; no se puede linkear directo.
  const [miniaturas, setMiniaturas] = useState<Record<string, string>>({});

  const [porCancelar, setPorCancelar] = useState<Reserva | null>(null);
  const [cancelando, setCancelando] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelado = false;

    supabase
      .from('booking')
      .select(
        'id, fecha, hora, estado, comentario, referencia_path, created_at, services(tipo, precio, duracion_minutos)',
      )
      // Filtrar por dueño explícitamente y no dejárselo a RLS: la política
      // "admin ve todas las reservas" le abre la tabla entera al admin, así
      // que sin este eq un admin veía en "mis reservas" las de todo el mundo.
      .eq('cliente_id', user.id)
      .order('fecha', { ascending: false })
      .order('hora', { ascending: false })
      .then(({ data, error: err }) => {
        if (cancelado) return;
        if (err) setError('No pudimos cargar tus reservas. Recarga la página.');
        else setReservas((data as unknown as Reserva[]) ?? []);
        setCargando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [user]);

  // Las urls firmadas vencen, así que se piden al mostrar y no se guardan.
  useEffect(() => {
    const pendientes = reservas
      .map((r) => r.referencia_path)
      .filter((p): p is string => !!p && !(p in miniaturas));

    if (pendientes.length === 0) return;
    let cancelado = false;

    supabase.storage
      .from('referencias')
      .createSignedUrls(pendientes, 60 * 30)
      .then(({ data }) => {
        if (cancelado || !data) return;
        const nuevas: Record<string, string> = {};
        for (const f of data) if (f.path && f.signedUrl) nuevas[f.path] = f.signedUrl;
        setMiniaturas((m) => ({ ...m, ...nuevas }));
      });

    return () => {
      cancelado = true;
    };
  }, [reservas, miniaturas]);

  async function cancelar(r: Reserva) {
    setCancelando(true);
    setError(null);

    const { error: err } = await supabase
      .from('booking')
      .update({ estado: 'cancelado' })
      .eq('id', r.id);

    setCancelando(false);
    setPorCancelar(null);

    if (err) {
      setError('No pudimos cancelar la reserva. Intenta de nuevo.');
      return;
    }

    setReservas((rs) =>
      rs.map((x) => (x.id === r.id ? { ...x, estado: 'cancelado' as const } : x)),
    );
  }

  const hoy = hoyIso();
  const proximas = reservas.filter((r) => r.fecha >= hoy && r.estado !== 'cancelado');
  const resto = reservas.filter((r) => !proximas.includes(r));

  return (
    <main className="min-h-screen pt-32 px-6 md:px-10 pb-24 text-ink">
      <div className="anim-fade">
        <div className="max-w-xl">
          <div className="font-mono text-[9.5px] tracking-[0.3em] uppercase text-[#7E7568]">
            § 07 — Mis reservas
          </div>
          <h1 className="mt-3.5 font-serif font-normal text-[40px] md:text-[56px] leading-none tracking-tight">
            Tus <em className="italic">sesiones</em>
          </h1>
        </div>

        {error && (
          <p
            role="alert"
            className="mt-8 max-w-xl font-mono text-[11px] leading-relaxed border-l-2 border-ink pl-3"
          >
            {error}
          </p>
        )}

        {cargando && (
          <div
            className="mt-12 max-w-xl h-[180px]"
            style={{
              backgroundImage:
                'repeating-linear-gradient(135deg, #E4DED2 0 1px, transparent 1px 15px)',
            }}
          />
        )}

        {!cargando && reservas.length === 0 && (
          <div className="mt-12 max-w-xl">
            <p className="font-serif italic text-[22px]">Todavía no tienes reservas.</p>
            <p className="mt-2 font-body text-[17px] leading-relaxed text-[#3A342D]">
              Cuando pidas una hora va a aparecer acá, con su estado y las
              condiciones.
            </p>
            <Link
              to="/agendar"
              className="inline-block mt-5 font-mono text-[9.5px] tracking-[0.26em] uppercase border-b border-ink pb-1"
            >
              Reservar una sesión
            </Link>
          </div>
        )}

        {!cargando && proximas.length > 0 && (
          <Seccion titulo="Próximas">
            {proximas.map((r) => (
              <Tarjeta
                key={r.id}
                reserva={r}
                miniatura={r.referencia_path ? miniaturas[r.referencia_path] : undefined}
                onCancelar={() => setPorCancelar(r)}
              />
            ))}
          </Seccion>
        )}

        {!cargando && resto.length > 0 && (
          <Seccion titulo="Anteriores y canceladas">
            {resto.map((r) => (
              <Tarjeta
                key={r.id}
                reserva={r}
                miniatura={r.referencia_path ? miniaturas[r.referencia_path] : undefined}
              />
            ))}
          </Seccion>
        )}
      </div>

      {porCancelar && (
        <Confirmacion
          reserva={porCancelar}
          trabajando={cancelando}
          onCerrar={() => setPorCancelar(null)}
          onConfirmar={() => cancelar(porCancelar)}
        />
      )}
    </main>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mt-14">
      <h2 className="font-mono text-[9px] tracking-[0.26em] uppercase text-[#7E7568] mb-5">
        {titulo}
      </h2>
      {/* Rejilla y no una columna: con una sola reserva se ve igual, y a
          medida que se acumulan usan el ancho en vez de estirarse. */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
        {children}
      </div>
    </section>
  );
}

function Tarjeta({
  reserva: r,
  miniatura,
  onCancelar,
}: {
  reserva: Reserva;
  miniatura?: string;
  onCancelar?: () => void;
}) {
  const estado = ESTADOS[r.estado];
  const dias = diasHasta(r.fecha);

  return (
    <article className="bg-[#E9E2D5] border-t-2 border-ink p-6 md:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="font-serif text-[24px] leading-tight first-letter:uppercase">
            {fmtFecha(r.fecha)}
          </h3>
          <p className="mt-1.5 font-mono text-[12px] tracking-[0.12em] text-[#4A443C]">
            {fmtHora(r.hora)}
            {r.services && (
              <>
                {' · '}
                {fmtDuracion(r.services.duracion_minutos)}
                {' · '}
                {fmtMonto(r.services.precio)}
              </>
            )}
          </p>
        </div>

        <span
          className={`font-mono text-[9px] tracking-[0.2em] uppercase px-3 py-1.5 ${estado.clases}`}
        >
          {estado.texto}
        </span>
      </div>

      <div className="mt-5 pt-4 border-t border-[#D2C8B4] flex flex-wrap gap-x-10 gap-y-4 items-start">
        <div className="flex-1 min-w-[200px]">
          <Dato termino="Sesión" valor={r.services?.tipo ?? 'Servicio retirado del catálogo'} />
          {r.comentario && <Dato termino="Tu idea" valor={r.comentario} />}
          {!r.referencia_path && <Dato termino="Referencia" valor="Sin imagen" />}
        </div>

        {miniatura && (
          <img
            src={miniatura}
            alt="Tu imagen de referencia"
            // Una url firmada puede venir vencida o apuntar a una carpeta que
            // Storage no deja leer; sin esto queda un recuadro vacío.
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
            className="w-[120px] h-[120px] object-cover border border-[#D2C8B4]"
          />
        )}
      </div>

      {r.estado === 'pendiente' && (
        <p className="mt-5 font-body text-[15px] leading-relaxed text-[#4A443C]">
          El estudio todavía tiene que aprobarla. Te avisaremos en cuanto esté
          confirmada.
        </p>
      )}

      {onCancelar && (
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={onCancelar}
            className="font-mono text-[9.5px] tracking-[0.26em] uppercase border-b border-ink pb-1 hover:opacity-60 transition-opacity"
          >
            Cancelar reserva
          </button>
          {dias < DIAS_AVISO && (
            <span className="font-mono text-[10px] leading-relaxed text-[#4A443C]">
              Quedan menos de {DIAS_AVISO} días: cancelar ahora pierde la seña.
            </span>
          )}
        </div>
      )}
    </article>
  );
}

function Dato({ termino, valor }: { termino: string; valor: string }) {
  return (
    <div className="mb-3 last:mb-0">
      <dt className="font-mono text-[9px] tracking-[0.2em] uppercase text-[#786F61]">
        {termino}
      </dt>
      <dd className="mt-1 font-body text-[16px] leading-relaxed text-ink">{valor}</dd>
    </div>
  );
}

function Confirmacion({
  reserva: r,
  trabajando,
  onCerrar,
  onConfirmar,
}: {
  reserva: Reserva;
  trabajando: boolean;
  onCerrar: () => void;
  onConfirmar: () => void;
}) {
  const dias = diasHasta(r.fecha);
  const pierdeSena = dias < DIAS_AVISO;

  // Por portal a body: el header usa mix-blend-difference y un overlay dentro
  // del flujo normal queda ilegible debajo de él.
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-cancelar"
      className="fixed inset-0 z-[300] flex items-center justify-center px-6 bg-ink/40"
      onClick={onCerrar}
    >
      <div
        className="bg-paper border-t-2 border-ink max-w-md w-full p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="titulo-cancelar" className="font-serif text-[26px] leading-tight">
          ¿Cancelar esta sesión?
        </h2>
        <p className="mt-3 font-body text-[17px] leading-relaxed text-[#3A342D] first-letter:uppercase">
          {fmtFecha(r.fecha)} a las {fmtHora(r.hora)}.
        </p>

        <p className="mt-5 font-body text-[16px] leading-relaxed text-[#3A342D]">
          {pierdeSena
            ? `Faltan menos de ${DIAS_AVISO} días, así que se pierde la seña de $10.000. El horario vuelve a quedar libre para otra persona.`
            : 'El horario vuelve a quedar libre para otra persona. Si ya transferiste la seña, el estudio se contacta contigo.'}
        </p>

        <div className="mt-8 flex flex-wrap gap-4">
          <button
            type="button"
            onClick={onConfirmar}
            disabled={trabajando}
            className="flex-1 bg-ink text-paper font-mono text-[10px] tracking-[0.26em] uppercase py-4 disabled:opacity-40 transition-opacity"
          >
            {trabajando ? 'Cancelando…' : 'Sí, cancelar'}
          </button>
          <button
            type="button"
            onClick={onCerrar}
            className="font-mono text-[9.5px] tracking-[0.26em] uppercase border-b border-ink pb-1"
          >
            Volver
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
