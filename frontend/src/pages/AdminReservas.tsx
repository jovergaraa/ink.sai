import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import AdminLayout from '../components/AdminLayout';

type Estado = 'pendiente' | 'confirmado' | 'cancelado';

interface ReservaRow {
  id: string;
  fecha: string;
  hora: string;
  estado: Estado;
  usuarios: { nombre: string } | null;
  services: { tipo: string } | null;
}

const ESTADO_LABEL: Record<Estado, string> = {
  pendiente: 'Pendiente',
  confirmado: 'Confirmada',
  cancelado: 'Cancelada',
};

const ESTADO_BADGE: Record<Estado, string> = {
  pendiente: 'border border-dim text-dim',
  confirmado: 'bg-ink text-paper',
  cancelado: 'text-dim line-through',
};

export default function AdminReservas() {
  const [reservas, setReservas] = useState<ReservaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState<'todas' | Estado>('todas');
  const [guardandoId, setGuardandoId] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;

    supabase
      .from('booking')
      .select('id, fecha, hora, estado, usuarios:cliente_id(nombre), services:service_id(tipo)')
      .order('fecha', { ascending: true })
      .order('hora', { ascending: true })
      .then(({ data, error: err }) => {
        if (cancelado) return;
        if (err) {
          setError(true);
        } else {
          setReservas((data as unknown as ReservaRow[]) ?? []);
        }
        setLoading(false);
      });

    return () => {
      cancelado = true;
    };
  }, []);

  async function actualizarEstado(id: string, estado: Estado) {
    // Optimista: el panel es de uso interno y de baja concurrencia,
    // revertir en el raro caso de error es preferible a esperar el roundtrip.
    const anteriores = reservas;
    setGuardandoId(id);
    setReservas((rows) => rows.map((r) => (r.id === id ? { ...r, estado } : r)));

    const { error: err } = await supabase.from('booking').update({ estado }).eq('id', id);
    if (err) setReservas(anteriores);
    setGuardandoId(null);
  }

  const filas = reservas.filter((r) => filtroEstado === 'todas' || r.estado === filtroEstado);

  return (
    <AdminLayout>
      <div className="flex justify-between items-baseline">
        <div className="flex flex-col gap-1.5">
          <span className="font-mono text-[9.5px] tracking-[0.3em] uppercase text-dim">
            § Admin — Reservas
          </span>
          <h1 className="font-serif text-[42px]">Reservas</h1>
        </div>
        <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-dim">
          {filas.length} en total
        </span>
      </div>

      <div className="flex gap-4 items-end">
        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-[9px] tracking-[0.22em] uppercase text-dim">Estado</label>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value as typeof filtroEstado)}
            className="bg-transparent border-b border-ink/20 focus:border-ink outline-none px-1 py-2 font-mono text-[11px] text-ink min-w-[170px]"
          >
            <option value="todas">Todas</option>
            <option value="pendiente">Pendiente</option>
            <option value="confirmado">Confirmada</option>
            <option value="cancelado">Cancelada</option>
          </select>
        </div>
      </div>

      {error && (
        <p role="alert" className="font-mono text-[11px] leading-relaxed border-l-2 border-ink pl-3">
          No pudimos cargar las reservas. Intenta recargar la página.
        </p>
      )}

      <div>
        <div className="hidden md:grid grid-cols-[2fr_1.8fr_0.9fr_0.7fr_1fr_1.4fr] gap-4 pb-3 border-b border-ink">
          <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-dim">Cliente</span>
          <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-dim">Servicio</span>
          <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-dim">Fecha</span>
          <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-dim">Hora</span>
          <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-dim">Estado</span>
          <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-dim">Acciones</span>
        </div>

        {loading && !error && (
          <div
            className="flex items-center justify-center h-40 mt-2"
            style={{
              backgroundImage:
                'repeating-linear-gradient(135deg, #E4DED2 0 1px, transparent 1px 15px)',
            }}
          >
            <p className="font-serif italic text-lg">Cargando reservas…</p>
          </div>
        )}

        {!loading && !error && filas.length === 0 && (
          <div
            className="flex items-center justify-center h-40 mt-2"
            style={{
              backgroundImage:
                'repeating-linear-gradient(135deg, #E4DED2 0 1px, transparent 1px 15px)',
            }}
          >
            <p className="font-serif italic text-lg">No hay reservas para este filtro.</p>
          </div>
        )}

        {filas.map((r) => (
          <div
            key={r.id}
            className="grid grid-cols-1 md:grid-cols-[2fr_1.8fr_0.9fr_0.7fr_1fr_1.4fr] gap-2 md:gap-4 py-4 border-b border-dim/30 md:items-center"
          >
            <span className="font-body text-[15px]">{r.usuarios?.nombre ?? '—'}</span>
            <span className="font-mono text-[11px]">{r.services?.tipo ?? '—'}</span>
            <span className="font-mono text-[11px] text-[#7A7268]">{r.fecha} · {r.hora}</span>
            <span className="hidden md:inline" />
            <span
              className={`inline-block w-fit px-2.5 py-1 font-mono text-[9px] tracking-[0.18em] uppercase ${ESTADO_BADGE[r.estado]}`}
            >
              {ESTADO_LABEL[r.estado]}
            </span>
            <div className="flex gap-4 items-center -ml-3">
              {r.estado === 'pendiente' && (
                <button
                  onClick={() => actualizarEstado(r.id, 'confirmado')}
                  disabled={guardandoId === r.id}
                  className="font-mono text-[9.5px] tracking-[0.16em] uppercase border-b border-ink px-3 py-4 disabled:opacity-40"
                >
                  Confirmar
                </button>
              )}
              {(r.estado === 'pendiente' || r.estado === 'confirmado') && (
                <button
                  onClick={() => actualizarEstado(r.id, 'cancelado')}
                  disabled={guardandoId === r.id}
                  className="font-mono text-[9.5px] tracking-[0.16em] uppercase text-dim border-b border-dim px-3 py-4 disabled:opacity-40"
                >
                  Cancelar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
