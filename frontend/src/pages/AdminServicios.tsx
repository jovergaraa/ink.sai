import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import AdminLayout from '../components/AdminLayout';

interface Servicio {
  id: string;
  tipo: string;
  duracion_minutos: number;
  precio: number;
  activo: boolean;
}

function fmtPrecio(n: number) {
  return '$' + n.toLocaleString('es-CL');
}

export default function AdminServicios() {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [seleccionadoId, setSeleccionadoId] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const [tipo, setTipo] = useState('');
  const [duracion, setDuracion] = useState('');
  const [precio, setPrecio] = useState('');
  const [activo, setActivo] = useState(true);

  useEffect(() => {
    let cancelado = false;

    supabase
      .from('services')
      .select('id, tipo, duracion_minutos, precio, activo')
      .order('tipo', { ascending: true })
      .then(({ data, error: err }) => {
        if (cancelado) return;
        if (err) {
          setError(true);
        } else {
          const rows = (data as Servicio[]) ?? [];
          setServicios(rows);
          if (rows.length > 0) seleccionar(rows[0]);
        }
        setLoading(false);
      });

    return () => {
      cancelado = true;
    };
  }, []);

  function seleccionar(s: Servicio) {
    setSeleccionadoId(s.id);
    setTipo(s.tipo);
    setDuracion(String(s.duracion_minutos));
    setPrecio(String(s.precio));
    setActivo(s.activo);
  }

  async function crear() {
    setGuardando(true);
    const { data, error: err } = await supabase
      .from('services')
      .insert({ tipo: 'Nuevo servicio', duracion_minutos: 60, precio: 0, activo: true })
      .select('id, tipo, duracion_minutos, precio, activo')
      .single();
    setGuardando(false);
    if (err || !data) {
      setError(true);
      return;
    }
    const nuevo = data as Servicio;
    setServicios((rows) => [...rows, nuevo]);
    seleccionar(nuevo);
  }

  async function guardar() {
    if (!seleccionadoId) return;
    setGuardando(true);
    const cambios = {
      tipo,
      duracion_minutos: Number(duracion) || 0,
      precio: Number(precio) || 0,
      activo,
    };
    const { error: err } = await supabase.from('services').update(cambios).eq('id', seleccionadoId);
    setGuardando(false);
    if (err) {
      setError(true);
      return;
    }
    setServicios((rows) =>
      rows.map((s) => (s.id === seleccionadoId ? { ...s, ...cambios } : s))
    );
  }

  const seleccionado = servicios.find((s) => s.id === seleccionadoId) ?? null;

  return (
    <AdminLayout>
      <div className="flex justify-between items-baseline">
        <div className="flex flex-col gap-1.5">
          <span className="font-mono text-[9.5px] tracking-[0.3em] uppercase text-dim">
            § Admin — Servicios
          </span>
          <h1 className="font-serif text-[42px]">Servicios</h1>
        </div>
        <button
          onClick={crear}
          disabled={guardando}
          className="font-mono bg-ink text-paper text-[10px] tracking-[0.2em] uppercase px-5 py-3.5 disabled:opacity-40"
        >
          + Nuevo servicio
        </button>
      </div>

      {error && (
        <p role="alert" className="font-mono text-[11px] leading-relaxed border-l-2 border-ink pl-3">
          Ocurrió un error al conectar con los servicios. Intenta recargar la página.
        </p>
      )}

      {loading && !error && (
        <div
          className="flex items-center justify-center h-40"
          style={{
            backgroundImage: 'repeating-linear-gradient(135deg, #E4DED2 0 1px, transparent 1px 15px)',
          }}
        >
          <p className="font-serif italic text-lg">Cargando servicios…</p>
        </div>
      )}

      {!loading && !error && servicios.length === 0 && (
        <div
          className="flex items-center justify-center h-40"
          style={{
            backgroundImage: 'repeating-linear-gradient(135deg, #E4DED2 0 1px, transparent 1px 15px)',
          }}
        >
          <p className="font-serif italic text-lg">Todavía no hay servicios cargados.</p>
        </div>
      )}

      {!loading && !error && servicios.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8 lg:gap-12">
          <div className="overflow-x-auto">
            <div className="hidden md:grid grid-cols-[1.8fr_0.9fr_0.8fr_0.8fr] gap-4 pb-3 border-b border-ink">
              <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-dim">Nombre</span>
              <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-dim">Duración</span>
              <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-dim">Precio</span>
              <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-dim">Estado</span>
            </div>
            {servicios.map((s) => (
              <button
                key={s.id}
                onClick={() => seleccionar(s)}
                className={`w-full text-left grid grid-cols-1 md:grid-cols-[1.8fr_0.9fr_0.8fr_0.8fr] gap-1 md:gap-4 py-4 px-3 -mx-3 md:items-center border-b border-dim/30 ${
                  s.id === seleccionadoId ? 'bg-[#EDE7DD]' : ''
                }`}
              >
                <span className="font-body text-[15px]">{s.tipo}</span>
                <span className="font-mono text-[11px] text-[#7A7268]">{s.duracion_minutos} min</span>
                <span className="font-mono text-[11px]">{fmtPrecio(s.precio)}</span>
                <span
                  className={`inline-block w-fit px-2.5 py-1 font-mono text-[9px] tracking-[0.18em] uppercase ${
                    s.activo ? 'text-ink' : 'border border-dim text-dim'
                  }`}
                >
                  {s.activo ? 'Activo' : 'Inactivo'}
                </span>
              </button>
            ))}
          </div>

          {seleccionado && (
            <div className="lg:border-l lg:border-dim/40 lg:pl-12">
              <span className="font-mono text-[9px] tracking-[0.22em] uppercase text-dim">Editando</span>
              <h2 className="font-serif italic text-2xl mt-2 mb-7">{seleccionado.tipo}</h2>

              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-[9px] tracking-[0.22em] uppercase text-dim">Nombre</label>
                  <input
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value)}
                    className="w-full bg-transparent border-b border-ink/20 focus:border-ink outline-none font-body text-lg py-2"
                  />
                </div>

                <div className="flex gap-4">
                  <div className="flex flex-col gap-1.5 flex-1">
                    <label className="font-mono text-[9px] tracking-[0.22em] uppercase text-dim">
                      Duración (min)
                    </label>
                    <input
                      type="number"
                      value={duracion}
                      onChange={(e) => setDuracion(e.target.value)}
                      className="w-full bg-transparent border-b border-ink/20 focus:border-ink outline-none font-body text-lg py-2"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 flex-1">
                    <label className="font-mono text-[9px] tracking-[0.22em] uppercase text-dim">
                      Precio (CLP)
                    </label>
                    <input
                      type="number"
                      value={precio}
                      onChange={(e) => setPrecio(e.target.value)}
                      className="w-full bg-transparent border-b border-ink/20 focus:border-ink outline-none font-body text-lg py-2"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 mt-2">
                  <label className="font-mono text-[9px] tracking-[0.22em] uppercase text-dim">
                    Disponibilidad
                  </label>
                  <button
                    onClick={() => setActivo((v) => !v)}
                    className={`w-fit text-left font-mono text-[10px] tracking-[0.18em] uppercase px-4 py-3.5 ${
                      activo ? 'bg-ink text-paper' : 'border border-dim text-dim'
                    }`}
                  >
                    {activo ? 'Activo — click para desactivar' : 'Inactivo — click para activar'}
                  </button>
                </div>

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={guardar}
                    disabled={guardando}
                    className="font-mono bg-ink text-paper text-[10px] tracking-[0.2em] uppercase px-6 py-3.5 disabled:opacity-40"
                  >
                    Guardar
                  </button>
                  <button
                    onClick={() => seleccionar(seleccionado)}
                    disabled={guardando}
                    className="font-mono text-dim border border-dim/60 text-[10px] tracking-[0.2em] uppercase px-6 py-3.5 disabled:opacity-40"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
