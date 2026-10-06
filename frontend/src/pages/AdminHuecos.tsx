import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../lib/supabase';
import AdminLayout from '../components/AdminLayout';

interface ReservaDelHueco {
  id: string;
  estado: string;
  comentario: string | null;
  // Objeto único (no array): a diferencia del embed de `booking` bajo
  // `huecos` (donde PostgREST no puede inferir cardinalidad y devuelve
  // array), acá sí hay FK simple cliente_id/service_id -> una fila, así que
  // PostgREST lo resuelve como objeto.
  usuarios: { nombre: string; correo: string; telefono: string | null } | null;
  services: { tipo: string; precio: number } | null;
}

interface Hueco {
  id: string;
  fecha: string;
  hora: string;
  duracion_minutos: number;
  nota: string | null;
  tomado: boolean;
  // Embed inverso desde booking.hueco_id (ver política "admin ve todas las
  // reservas" — sin ella este array vendría vacío incluso con una reserva
  // viva). Solo trae la reserva no cancelada por el índice único parcial
  // que ya garantiza una reserva viva como máximo por hueco.
  booking: ReservaDelHueco[];
}

interface Bloqueo {
  id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  motivo: string | null;
}

interface Servicio {
  id: string;
  tipo: string;
  duracion_minutos: number;
  precio: number;
}

interface Cliente {
  id: string;
  nombre: string;
  correo: string;
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

const DIAS_ABREV = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const DIAS_INICIAL = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

// Formatea mientras se escribe: 1430 -> 14:30. Evita el selector nativo de
// <input type="time">, que obliga a hacer scroll en dos columnas — acá
// Simón tipea los 4 dígitos y el ":" se agrega solo.
function formatearHora(valor: string): string {
  const digitos = valor.replace(/\D/g, '').slice(0, 4);
  if (digitos.length <= 2) return digitos;
  return `${digitos.slice(0, 2)}:${digitos.slice(2)}`;
}

// true solo si son 4 dígitos con hora 00–23 y minuto 00–59.
function horaValida(valor: string): boolean {
  if (!/^\d{2}:\d{2}$/.test(valor)) return false;
  const [h, m] = valor.split(':').map(Number);
  return h <= 23 && m <= 59;
}

// Rango base cuando una semana no tiene ningún horario publicado — así la
// grilla siempre muestra dónde hacer click, en vez de quedar en blanco.
// También es el horario de atención real: "todo el día" en un bloqueo
// cubre este mismo rango, no las 24 horas — nadie agenda a las 3 AM, así
// que bloquear esas horas no aporta nada y solo alarga la grilla.
const HORA_BASE_INICIO = 9;
const HORA_BASE_FIN = 22;

// "Todo el día" se guarda en la base como el horario de atención completo:
// no hay un booleano aparte, así que se reconoce por el rango exacto.
const DIA_COMPLETO_INICIO = `${String(HORA_BASE_INICIO).padStart(2, '0')}:00`;
const DIA_COMPLETO_FIN = `${String(HORA_BASE_FIN).padStart(2, '0')}:00`;

// Alto de cada fila de hora, en px. Fijo (no solo min-height) para que los
// bloques de horario, posicionados con top/height calculados sobre este
// mismo número, calcen exactamente con las líneas de la grilla — incluida
// la fila de cierre, que no tiene celdas propias pero debe medir igual.
const ALTO_FILA = 52;

function fmtDuracion(min: number) {
  const h = Math.floor(min / 60);
  const resto = min % 60;
  if (h === 0) return `${resto} min`;
  return resto === 0 ? `${h} h` : `${h} h ${resto} min`;
}

function fmtHora(hhmmss: string) {
  return hhmmss.slice(0, 5);
}

function sumarMinutos(hhmmss: string, minutos: number) {
  const [h, m] = hhmmss.split(':').map(Number);
  const total = h * 60 + m + minutos;
  const hh = Math.floor((total % (24 * 60)) / 60);
  const mm = total % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

// Lunes de la semana que contiene `d`.
function lunesDeLaSemana(d: Date) {
  const copia = new Date(d);
  const dia = copia.getDay(); // 0 = domingo
  const offset = dia === 0 ? -6 : 1 - dia;
  copia.setDate(copia.getDate() + offset);
  copia.setHours(0, 0, 0, 0);
  return copia;
}

function fechaISOLocal(d: Date) {
  return d.toLocaleDateString('sv-SE'); // 'YYYY-MM-DD' local
}

// El índice único parcial (booking_hueco_unico) garantiza a lo sumo una
// reserva viva por hueco, pero el embed igual puede traer reservas viejas
// ya canceladas del mismo hueco — se filtra acá antes de usar cualquier dato.
function reservaVivaDelHueco(h: Hueco): ReservaDelHueco | null {
  return h.booking?.find((b) => b.estado !== 'cancelado') ?? null;
}

function clienteDelHueco(h: Hueco): string | null {
  return reservaVivaDelHueco(h)?.usuarios?.nombre ?? null;
}

function fmtPrecio(precio: number) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(
    precio,
  );
}

// true si `horaLabel` cae dentro de [hora_inicio, hora_fin) de algún
// bloqueo del día. Usada tanto por las filas normales de la grilla como
// por la fila de cierre (que representa HORA_BASE_FIN, el borde del
// horario de atención) — ambas necesitan el mismo criterio para que un
// bloqueo de "todo el día" se vea completo hasta el final, sin una celda
// suelta sin rayar en el borde.
function bloqueoEnHora(bloqueosDelDia: Bloqueo[], horaLabel: number): Bloqueo | undefined {
  return bloqueosDelDia.find((b) => {
    const [hhIni] = b.hora_inicio.split(':').map(Number);
    const [hhFin, mmFin] = b.hora_fin.split(':').map(Number);
    const terminaEnMinutoExacto = mmFin === 0 && hhFin !== HORA_BASE_FIN;
    const finExclusivo = terminaEnMinutoExacto ? hhFin : hhFin + 1;
    return horaLabel >= hhIni && horaLabel < finExclusivo;
  });
}

function fmtRangoBloqueo(b: Bloqueo) {
  if (b.hora_inicio.slice(0, 5) === DIA_COMPLETO_INICIO && b.hora_fin.slice(0, 5) === DIA_COMPLETO_FIN) {
    return 'Todo el día';
  }
  return `${fmtHora(b.hora_inicio)} – ${fmtHora(b.hora_fin)}`;
}

function fmtFechaCorta(iso: string) {
  const [, m, d] = iso.split('-').map(Number);
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`;
}

const CLASES_INPUT =
  'w-full bg-transparent border-b border-ink/20 focus:border-ink outline-none font-body text-lg py-2';
const CLASES_LABEL = 'font-mono text-[9px] tracking-[0.22em] uppercase text-dim';

export default function AdminHuecos() {
  const [huecos, setHuecos] = useState<Hueco[]>([]);
  const [bloqueos, setBloqueos] = useState<Bloqueo[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [duracion, setDuracion] = useState(120);
  const [nota, setNota] = useState('');
  const [formularioAbierto, setFormularioAbierto] = useState(false);

  const [modalBloqueoAbierto, setModalBloqueoAbierto] = useState(false);
  const [huecoDetalle, setHuecoDetalle] = useState<Hueco | null>(null);
  const [eliminandoReserva, setEliminandoReserva] = useState(false);
  // Celda vacía (fecha + hora) donde se hizo click en "+" para agendar
  // directo — null cuando el modal de agendar está cerrado.
  const [celdaAgendar, setCeldaAgendar] = useState<{ fecha: string; hora: string } | null>(null);

  const [inicioSemana, setInicioSemana] = useState(() => lunesDeLaSemana(new Date()));
  // Mes que muestra el mini-calendario. Por defecto sigue a la semana
  // visible (así "esta semana" y las flechas lo arrastran solas), pero se
  // puede alejar navegando sus propias flechas sin mover la grilla —
  // `siguiendoSemana` corta ese enlace hasta que vuelva a cambiar la semana.
  const [mesCalendario, setMesCalendario] = useState(() => {
    const d = lunesDeLaSemana(new Date());
    d.setDate(1);
    return d;
  });
  const [siguiendoSemana, setSiguiendoSemana] = useState(true);

  useEffect(() => {
    if (!siguiendoSemana) return;
    const d = new Date(inicioSemana);
    d.setDate(1);
    setMesCalendario(d);
  }, [inicioSemana, siguiendoSemana]);

  const hoy = fechaISOLocal(new Date());

  useEffect(() => {
    let cancelado = false;

    Promise.all([
      supabase
        .from('huecos')
        .select(
          'id, fecha, hora, duracion_minutos, nota, tomado, booking(id, estado, comentario, usuarios:cliente_id(nombre, correo, telefono), services:service_id(tipo, precio))',
        )
        .gte('fecha', hoy)
        .order('fecha', { ascending: true })
        .order('hora', { ascending: true }),
      supabase
        .from('bloqueos')
        .select('id, fecha, hora_inicio, hora_fin, motivo')
        .gte('fecha', hoy)
        .order('fecha', { ascending: true })
        .order('hora_inicio', { ascending: true }),
      supabase
        .from('services')
        .select('id, tipo, duracion_minutos, precio')
        .eq('activo', true)
        .order('duracion_minutos', { ascending: true }),
      supabase.from('usuarios').select('id, nombre, correo').order('nombre', { ascending: true }),
    ]).then(([resHuecos, resBloqueos, resServicios, resClientes]) => {
      if (cancelado) return;
      if (resHuecos.error || resBloqueos.error || resServicios.error || resClientes.error) {
        setError('No pudimos cargar los horarios. Intenta recargar la página.');
      } else {
        // El `select()` con embeds no tiene tipos de BD generados que guíen
        // la inferencia: el cliente de Supabase arma un tipo genérico que no
        // calza con la forma real en runtime (usuarios/services embebidos a
        // un solo nivel llegan como objeto, no array), de ahí el `unknown`.
        setHuecos((resHuecos.data as unknown as Hueco[]) ?? []);
        setBloqueos((resBloqueos.data as Bloqueo[]) ?? []);
        setServicios((resServicios.data as Servicio[]) ?? []);
        setClientes((resClientes.data as Cliente[]) ?? []);
      }
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

    // Recién publicado: por definición todavía no tiene ninguna reserva.
    const nuevo: Hueco = { ...(data as Omit<Hueco, 'booking'>), booking: [] };
    setHuecos((rows) =>
      [...rows, nuevo].sort((a, b) =>
        a.fecha === b.fecha ? a.hora.localeCompare(b.hora) : a.fecha.localeCompare(b.fecha),
      ),
    );
    setHora('');
    setNota('');
    setFormularioAbierto(false);
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

  // Borra la reserva (no el hueco): el trigger que mantiene `huecos.tomado`
  // libera el horario solo. Pensado para limpiar pruebas desde el panel de
  // detalle, no como flujo normal (eso es "Cancelar" desde Reservas).
  async function borrarReserva(h: Hueco) {
    const reserva = reservaVivaDelHueco(h);
    if (!reserva) return;

    setError(null);
    setEliminandoReserva(true);
    const { error: err } = await supabase.from('booking').delete().eq('id', reserva.id);
    setEliminandoReserva(false);

    if (err) {
      setError('No pudimos eliminar esa sesión. Intenta de nuevo.');
      return;
    }

    setHuecos((rows) =>
      rows.map((r) => (r.id === h.id ? { ...r, tomado: false, booking: [] } : r)),
    );
    setHuecoDetalle(null);
  }

  // Agenda directo: Simón elige una celda vacía y, a diferencia de "Publicar
  // horario" (que solo abre el hueco para que alguien lo reserve después),
  // acá se crea el hueco y la reserva en el mismo paso — ya con cliente y
  // servicio elegidos, como si el cliente la hubiera pedido por teléfono.
  async function crearReservaDirecta(datos: {
    fecha: string;
    hora: string;
    duracion: number;
    clienteId: string;
    servicioId: string;
    nota: string;
  }) {
    setError(null);

    const { data: hueco, error: errHueco } = await supabase
      .from('huecos')
      .insert({ fecha: datos.fecha, hora: datos.hora, duracion_minutos: datos.duracion })
      .select('id, fecha, hora, duracion_minutos, nota, tomado')
      .single();

    if (errHueco || !hueco) {
      setError('No pudimos crear el horario. Revisa los datos e intenta de nuevo.');
      return false;
    }

    const { data: booking, error: errBooking } = await supabase
      .from('booking')
      .insert({
        cliente_id: datos.clienteId,
        service_id: datos.servicioId,
        fecha: datos.fecha,
        hora: datos.hora,
        hueco_id: hueco.id,
        estado: 'confirmado',
        comentario: datos.nota.trim() || null,
      })
      .select('id, estado, comentario')
      .single();

    if (errBooking || !booking) {
      // El hueco ya se creó pero sin reserva — lo borramos para no dejar un
      // horario libre huérfano que nadie pidió.
      await supabase.from('huecos').delete().eq('id', hueco.id);
      setError('No pudimos agendar la sesión. Revisa el cliente y el servicio e intenta de nuevo.');
      return false;
    }

    const cliente = clientes.find((c) => c.id === datos.clienteId);
    const servicio = servicios.find((s) => s.id === datos.servicioId);
    const nuevo: Hueco = {
      ...(hueco as Omit<Hueco, 'booking'>),
      tomado: true,
      booking: [
        {
          id: booking.id,
          estado: booking.estado,
          comentario: booking.comentario,
          usuarios: cliente ? { nombre: cliente.nombre, correo: cliente.correo, telefono: null } : null,
          services: servicio ? { tipo: servicio.tipo, precio: servicio.precio } : null,
        },
      ],
    };
    setHuecos((rows) =>
      [...rows, nuevo].sort((a, b) =>
        a.fecha === b.fecha ? a.hora.localeCompare(b.hora) : a.fecha.localeCompare(b.fecha),
      ),
    );
    setCeldaAgendar(null);
    return true;
  }

  async function crearBloqueo(datos: { fecha: string; horaInicio: string; horaFin: string; motivo: string }) {
    setError(null);

    const { data, error: err } = await supabase
      .from('bloqueos')
      .insert({
        fecha: datos.fecha,
        hora_inicio: datos.horaInicio,
        hora_fin: datos.horaFin,
        motivo: datos.motivo.trim() || null,
      })
      .select('id, fecha, hora_inicio, hora_fin, motivo')
      .single();

    if (err || !data) {
      setError('No pudimos bloquear esa fecha. Revisa el rango e intenta de nuevo.');
      return false;
    }

    const nuevo = data as Bloqueo;
    setBloqueos((rows) =>
      [...rows, nuevo].sort((a, b) =>
        a.fecha === b.fecha ? a.hora_inicio.localeCompare(b.hora_inicio) : a.fecha.localeCompare(b.fecha),
      ),
    );
    return true;
  }

  async function borrarBloqueo(b: Bloqueo) {
    setError(null);
    const { error: err } = await supabase.from('bloqueos').delete().eq('id', b.id);

    if (err) {
      setError('No pudimos quitar ese bloqueo. Intenta de nuevo.');
      return;
    }

    setBloqueos((rows) => rows.filter((r) => r.id !== b.id));
  }

  // --- Semana visible: 7 fechas ISO desde el lunes de inicioSemana ---
  const diasSemana = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(inicioSemana);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [inicioSemana]);

  const fechasISO = useMemo(() => diasSemana.map(fechaISOLocal), [diasSemana]);

  const huecosPorFecha = useMemo(() => {
    const porFecha: Record<string, Hueco[]> = {};
    for (const h of huecos) {
      (porFecha[h.fecha] ??= []).push(h);
    }
    return porFecha;
  }, [huecos]);

  const bloqueosPorFecha = useMemo(() => {
    const porFecha: Record<string, Bloqueo[]> = {};
    for (const b of bloqueos) {
      (porFecha[b.fecha] ??= []).push(b);
    }
    return porFecha;
  }, [bloqueos]);

  const huecosSemana = useMemo(
    () => fechasISO.flatMap((f) => huecosPorFecha[f] ?? []),
    [fechasISO, huecosPorFecha],
  );

  const bloqueosSemana = useMemo(
    () => fechasISO.flatMap((f) => bloqueosPorFecha[f] ?? []),
    [fechasISO, bloqueosPorFecha],
  );

  // Rango de horas a mostrar: cubre todos los huecos y bloqueos de la semana
  // (redondeando a la hora), con un piso/techo razonable si está vacía.
  const { horaInicioGrilla, horaFinGrilla } = useMemo(() => {
    let min = HORA_BASE_INICIO;
    let max = HORA_BASE_FIN;
    for (const h of huecosSemana) {
      const [hh, mm] = h.hora.split(':').map(Number);
      min = Math.min(min, hh);
      max = Math.max(max, Math.ceil((hh * 60 + mm + h.duracion_minutos) / 60));
    }
    for (const b of bloqueosSemana) {
      const [hhIni] = b.hora_inicio.split(':').map(Number);
      const [hhFin, mmFin] = b.hora_fin.split(':').map(Number);
      min = Math.min(min, hhIni);
      max = Math.max(max, Math.min(24, Math.ceil((hhFin * 60 + mmFin) / 60)));
    }
    return { horaInicioGrilla: min, horaFinGrilla: max };
  }, [huecosSemana, bloqueosSemana]);

  const filasHora = useMemo(
    () => Array.from({ length: horaFinGrilla - horaInicioGrilla }, (_, i) => horaInicioGrilla + i),
    [horaInicioGrilla, horaFinGrilla],
  );

  function irSemanaAnterior() {
    setSiguiendoSemana(true);
    setInicioSemana((d) => {
      const nueva = new Date(d);
      nueva.setDate(nueva.getDate() - 7);
      return nueva;
    });
  }

  function irSemanaSiguiente() {
    setSiguiendoSemana(true);
    setInicioSemana((d) => {
      const nueva = new Date(d);
      nueva.setDate(nueva.getDate() + 7);
      return nueva;
    });
  }

  function irHoy() {
    setSiguiendoSemana(true);
    setInicioSemana(lunesDeLaSemana(new Date()));
  }

  // Saltar a la semana que contiene la fecha elegida en el mini-calendario.
  function irASemanaDe(d: Date) {
    setSiguiendoSemana(true);
    setInicioSemana(lunesDeLaSemana(d));
  }

  const esSemanaActual = fechasISO.includes(hoy);

  const rangoLabel = (() => {
    const inicio = diasSemana[0];
    const fin = diasSemana[6];
    return `${inicio.toLocaleDateString('es-CL', { day: 'numeric' })} — ${fin.toLocaleDateString('es-CL', { day: 'numeric', month: 'long' })}`;
  })();

  return (
    <AdminLayout>
      {error && (
        <p role="alert" className="font-mono text-[11px] leading-relaxed border-l-2 border-ink pl-3">
          {error}
        </p>
      )}

      {loading && (
        <div
          className="flex items-center justify-center h-40"
          style={{ backgroundImage: 'repeating-linear-gradient(135deg, #E4DED2 0 1px, transparent 1px 15px)' }}
        >
          <p className="font-serif italic text-lg">Cargando horarios…</p>
        </div>
      )}

      {!loading && (
        <div className="flex gap-10">
          {/* Sidebar: mini-calendario + bloqueos */}
          <div className="w-[260px] shrink-0 flex flex-col gap-7">
            <MiniCalendario
              mes={mesCalendario}
              onCambiarMes={(d) => {
                setSiguiendoSemana(false);
                setMesCalendario(d);
              }}
              diasSeleccionados={fechasISO}
              hoy={hoy}
              onSeleccionarDia={irASemanaDe}
            />

            <div className="h-px bg-[#DED7C9]" />

            <div>
              <div className="flex items-center justify-between mb-3.5">
                <span className="font-mono text-[9px] tracking-[0.22em] uppercase text-dim">
                  Bloqueos
                </span>
              </div>

              <button
                type="button"
                onClick={() => setModalBloqueoAbierto(true)}
                className="w-full font-mono bg-ink text-paper text-[9.5px] tracking-[0.2em] uppercase px-4 py-3"
              >
                + Bloquear fecha
              </button>

              <div className="flex flex-col mt-4">
                {bloqueos.length === 0 && (
                  <p className="font-body italic text-[13px] text-dim">Sin bloqueos próximos.</p>
                )}
                {bloqueos.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between gap-2 py-2.5 border-b border-[#ECE6D9]"
                  >
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="font-mono text-[10px] text-ink">{fmtFechaCorta(b.fecha)}</span>
                      <span className="font-body italic text-[11.5px] text-[#8A6A2E]">
                        {fmtRangoBloqueo(b)}
                      </span>
                      {b.motivo && (
                        <span className="font-body text-[11px] text-dim truncate">{b.motivo}</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => borrarBloqueo(b)}
                      aria-label={`Quitar bloqueo del ${fmtFechaCorta(b.fecha)}`}
                      className="text-dim hover:text-ink transition-colors shrink-0 p-1"
                    >
                      <svg width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden="true">
                        <path d="M1 1l7 7M8 1L1 8" stroke="currentColor" strokeWidth="1.1" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Panel principal: grilla semanal */}
          <div className="flex-1 min-w-0 flex flex-col gap-5">
            {/* Cabecera: rango de semana + navegación */}
            <div className="flex items-end justify-between flex-wrap gap-4">
              <div className="flex flex-col gap-1">
                <span className="font-mono text-[9px] tracking-[0.22em] uppercase text-dim">
                  {huecosSemana.length} {huecosSemana.length === 1 ? 'horario' : 'horarios'} esta semana
                </span>
                <h2 className="font-serif italic text-[26px] leading-none">{rangoLabel}</h2>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-5">
                  <button
                    type="button"
                    onClick={irSemanaAnterior}
                    aria-label="Semana anterior"
                    className="p-2 text-ink hover:opacity-60 transition-opacity"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.3" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={irHoy}
                    disabled={esSemanaActual}
                    className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#7A7268] border-b border-ink pb-0.5 disabled:opacity-40 disabled:border-transparent"
                  >
                    Esta semana
                  </button>
                  <button
                    type="button"
                    onClick={irSemanaSiguiente}
                    aria-label="Semana siguiente"
                    className="p-2 text-ink hover:opacity-60 transition-opacity"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.3" />
                    </svg>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setFormularioAbierto((v) => !v)}
                  aria-expanded={formularioAbierto}
                  className="font-mono bg-ink text-paper text-[10px] tracking-[0.2em] uppercase px-5 py-3"
                >
                  {formularioAbierto ? '− Cerrar' : '+ Publicar horario'}
                </button>
              </div>
            </div>

            {formularioAbierto && (
              <form
                onSubmit={crear}
                className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_2fr_auto] gap-5 md:items-end bg-[#EDE7DD] p-6 anim-fade"
              >
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
                  {guardando ? 'Publicando…' : 'Confirmar'}
                </button>
              </form>
            )}

            {/* Grilla semanal: columna de horas + 7 días.
                grid-auto-rows fijo (no solo min-height en las celdas): sin
                esto, una fila cuyos 7 días están vacíos puede medir menos de
                ALTO_FILA en el grid real, y un bloque posicionado con
                top/height en base a ALTO_FILA termina desalineado con las
                líneas divisorias de las filas siguientes. */}
            <div
              className="grid border-t-2 border-t-ink border-l border-l-[#DED7C9] overflow-x-auto"
              style={{
                gridTemplateColumns: '56px repeat(7, minmax(84px, 1fr))',
                gridAutoRows: `minmax(${ALTO_FILA}px, auto)`,
              }}
            >
              <div className="border-r border-r-[#DED7C9] border-b-2 border-b-ink" />
              {diasSemana.map((d, i) => {
                const iso = fechasISO[i];
                const esHoy = iso === hoy;
                return (
                  <div
                    key={iso}
                    className={`border-r border-r-[#DED7C9] border-b-2 border-b-ink py-2.5 px-2 text-center ${esHoy ? 'bg-[#EDE7DD]' : ''}`}
                  >
                    <div className="font-mono text-[9px] tracking-[0.2em] uppercase text-dim">
                      {DIAS_ABREV[i]}
                    </div>
                    <div className="font-serif italic text-xl text-ink mt-0.5">{d.getDate()}</div>
                  </div>
                );
              })}

              {filasHora.map((hLabel) => (
                <ExpandedRow
                  key={hLabel}
                  horaLabel={hLabel}
                  fechasISO={fechasISO}
                  huecosPorFecha={huecosPorFecha}
                  bloqueosPorFecha={bloqueosPorFecha}
                  onBorrar={borrar}
                  onVerDetalle={setHuecoDetalle}
                  onAgendar={(fecha, hora) => {
                    if (servicios.length === 0) {
                      setError('No hay servicios activos. Crea uno en Servicios antes de agendar.');
                      return;
                    }
                    setCeldaAgendar({ fecha, hora });
                  }}
                />
              ))}

              {/* Borde de cierre: muestra la hora tope de la grilla (ej. 22:00)
                  para que no se lea como si terminara en la última fila con
                  contenido. Sin celdas de huecos (nada empieza justo en el
                  borde), pero SÍ puede estar bloqueada: un bloqueo que
                  llega hasta HORA_BASE_FIN (el caso "todo el día") cubre
                  también esta fila, para que no quede una celda suelta sin
                  rayar en el borde. */}
              <div className="border-r border-r-[#DED7C9] pr-2 pt-1 text-right font-mono text-[9px] text-dim">
                {String(horaFinGrilla).padStart(2, '0')}:00
              </div>
              {fechasISO.map((iso) => {
                const bloqueoDeEstaCelda = bloqueoEnHora(bloqueosPorFecha[iso] ?? [], horaFinGrilla);
                return (
                  <div key={`techo-${iso}`} className="relative border-r border-r-[#DED7C9]" style={{ minHeight: 20 }}>
                    {bloqueoDeEstaCelda && <CandadoBloqueo bloqueo={bloqueoDeEstaCelda} />}
                  </div>
                );
              })}
            </div>

            {/* Leyenda */}
            <div className="flex items-center gap-6 font-mono text-[9px] tracking-[0.15em] uppercase text-[#7A7268]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 border-l-2 border-[#C9A05C] bg-[#F5EEE0] inline-block" />
                Libre
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 border-l-2 border-ink bg-[#EAE4D8] inline-block" />
                Solicitado
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 border-l-2 border-[#8A7A68] inline-block"
                  style={{ backgroundImage: 'repeating-linear-gradient(135deg, #E4DED2 0 1px, #DAD2C2 1px 5px)' }}
                />
                Bloqueado
              </div>
            </div>
          </div>
        </div>
      )}

      {modalBloqueoAbierto && (
        <ModalBloqueo
          hoy={hoy}
          onClose={() => setModalBloqueoAbierto(false)}
          onCrear={crearBloqueo}
        />
      )}

      {huecoDetalle && (
        <PanelDetalleReserva
          hueco={huecoDetalle}
          eliminando={eliminandoReserva}
          onClose={() => setHuecoDetalle(null)}
          onEliminar={() => borrarReserva(huecoDetalle)}
        />
      )}

      {celdaAgendar && servicios.length > 0 && (
        <ModalAgendarDirecto
          celda={celdaAgendar}
          clientes={clientes}
          servicios={servicios}
          onClose={() => setCeldaAgendar(null)}
          onCrear={crearReservaDirecta}
        />
      )}
    </AdminLayout>
  );
}

// Mini-calendario mensual: navega de mes, marca el día de hoy y resalta los
// 7 días de la semana actualmente visible en la grilla. Clickear un día
// salta la grilla a la semana que lo contiene.
function MiniCalendario({
  mes,
  onCambiarMes,
  diasSeleccionados,
  hoy,
  onSeleccionarDia,
}: {
  mes: Date;
  onCambiarMes: (d: Date) => void;
  diasSeleccionados: string[];
  hoy: string;
  onSeleccionarDia: (d: Date) => void;
}) {
  const nombreMes = mes.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });

  const celdas = useMemo(() => {
    const primerDia = new Date(mes.getFullYear(), mes.getMonth(), 1);
    const diasEnMes = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate();
    // getDay(): 0 = domingo. La grilla empieza en lunes, así que se corre el índice.
    const offsetInicial = (primerDia.getDay() + 6) % 7;

    const filas: (Date | null)[] = Array.from({ length: offsetInicial }, () => null);
    for (let d = 1; d <= diasEnMes; d++) {
      filas.push(new Date(mes.getFullYear(), mes.getMonth(), d));
    }
    return filas;
  }, [mes]);

  function mesAnterior() {
    onCambiarMes(new Date(mes.getFullYear(), mes.getMonth() - 1, 1));
  }

  function mesSiguiente() {
    onCambiarMes(new Date(mes.getFullYear(), mes.getMonth() + 1, 1));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3.5">
        <button
          type="button"
          onClick={mesAnterior}
          aria-label="Mes anterior"
          className="p-1 text-[#7A7268] hover:text-ink transition-colors"
        >
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M7.5 2L3.5 6l4 4" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </button>
        <span className="font-serif italic text-[16px] first-letter:uppercase">{nombreMes}</span>
        <button
          type="button"
          onClick={mesSiguiente}
          aria-label="Mes siguiente"
          className="p-1 text-[#7A7268] hover:text-ink transition-colors"
        >
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M4.5 2l4 4-4 4" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 font-mono text-[8px] tracking-[0.05em] uppercase text-dim text-center mb-1">
        {DIAS_INICIAL.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {celdas.map((d, i) => {
          if (!d) return <div key={i} />;
          const iso = fechaISOLocal(d);
          const esHoy = iso === hoy;
          const enSemanaVisible = diasSeleccionados.includes(iso);

          return (
            <button
              key={i}
              type="button"
              onClick={() => onSeleccionarDia(d)}
              className={`aspect-square font-body text-[13px] flex items-center justify-center relative transition-colors ${
                enSemanaVisible ? 'bg-ink text-paper' : 'text-ink hover:bg-[#EDE7DD]'
              }`}
            >
              {d.getDate()}
              {esHoy && (
                <span
                  className={`absolute bottom-0.5 w-[3px] h-[3px] rounded-full ${enSemanaVisible ? 'bg-paper' : 'bg-ink'}`}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Modal para crear un bloqueo. Mismo patrón que AuthModal: overlay bg-ink
// sólido con rayado diagonal, createPortal a document.body, Escape cierra,
// scroll del body bloqueado mientras está abierto.
function ModalBloqueo({
  hoy,
  onClose,
  onCrear,
}: {
  hoy: string;
  onClose: () => void;
  onCrear: (datos: { fecha: string; horaInicio: string; horaFin: string; motivo: string }) => Promise<boolean>;
}) {
  const [fecha, setFecha] = useState(hoy);
  const [todoElDia, setTodoElDia] = useState(true);
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFin, setHoraFin] = useState('');
  const [motivo, setMotivo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = overflowPrevio;
    };
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorLocal(null);

    const rangoFinal = todoElDia
      ? { horaInicio: DIA_COMPLETO_INICIO, horaFin: DIA_COMPLETO_FIN }
      : { horaInicio, horaFin };

    if (!todoElDia && (!horaValida(horaInicio) || !horaValida(horaFin))) {
      setErrorLocal('Escribe la hora completa en formato HH:MM, por ejemplo 14:30.');
      return;
    }

    if (!todoElDia && rangoFinal.horaFin <= rangoFinal.horaInicio) {
      setErrorLocal('La hora de término debe ser posterior a la de inicio.');
      return;
    }

    setEnviando(true);
    const ok = await onCrear({ fecha, ...rangoFinal, motivo });
    setEnviando(false);
    if (ok) onClose();
  }

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[300] flex items-center justify-center bg-ink p-6 anim-fade"
      style={{
        backgroundImage:
          'repeating-linear-gradient(135deg, rgba(242,238,231,0.04) 0 1px, transparent 1px 18px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-bloqueo-title"
        className="w-full max-w-[400px] bg-paper px-9 py-10 anim-modal-in"
      >
        <h2 id="modal-bloqueo-title" className="font-serif italic text-2xl text-ink">
          Bloquear fecha
        </h2>
        <p className="mt-2 font-body text-[13.5px] text-[#7A7268] leading-relaxed">
          El horario bloqueado no estará disponible para reservas.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
          <label className="block">
            <span className={CLASES_LABEL}>Fecha</span>
            <input
              type="date"
              required
              min={hoy}
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className={`${CLASES_INPUT} mt-2`}
            />
          </label>

          <label className="flex items-center gap-2.5 font-body text-[13.5px] text-[#3A342D] cursor-pointer">
            <input
              type="checkbox"
              checked={todoElDia}
              onChange={(e) => setTodoElDia(e.target.checked)}
              className="accent-ink"
            />
            Todo el día
          </label>

          {!todoElDia && (
            <div className="flex gap-4 anim-fade">
              <label className="flex-1">
                <span className={CLASES_LABEL}>Desde</span>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  placeholder="__:__"
                  maxLength={5}
                  value={horaInicio}
                  onChange={(e) => setHoraInicio(formatearHora(e.target.value))}
                  className={`${CLASES_INPUT} mt-2 text-center font-mono tracking-[0.15em] placeholder:text-[#B9AF9C]`}
                />
              </label>
              <label className="flex-1">
                <span className={CLASES_LABEL}>Hasta</span>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  placeholder="__:__"
                  maxLength={5}
                  value={horaFin}
                  onChange={(e) => setHoraFin(formatearHora(e.target.value))}
                  className={`${CLASES_INPUT} mt-2 text-center font-mono tracking-[0.15em] placeholder:text-[#B9AF9C]`}
                />
              </label>
            </div>
          )}

          <label className="block">
            <span className={CLASES_LABEL}>Motivo (opcional)</span>
            <input
              type="text"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Vacaciones, reunión…"
              className={`${CLASES_INPUT} mt-2 placeholder:text-[#B9AF9C]`}
            />
          </label>

          {errorLocal && (
            <p role="alert" className="font-mono text-[11px] leading-relaxed border-l-2 border-ink pl-3">
              {errorLocal}
            </p>
          )}

          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 font-mono text-[10px] tracking-[0.2em] uppercase border border-ink/25 text-ink py-3.5"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando}
              className="flex-1 font-mono bg-ink text-paper text-[10px] tracking-[0.2em] uppercase py-3.5 disabled:opacity-40"
            >
              {enviando ? 'Bloqueando…' : 'Bloquear'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}

// Modal para que Simón agende directo a un cliente en una celda vacía:
// crea el hueco y la reserva en el mismo paso. Mismo patrón de overlay que
// ModalBloqueo. El buscador de cliente es un autocompletar simple sobre la
// lista ya cargada (no hay tantos clientes como para paginar o ir al server
// por cada letra).
function ModalAgendarDirecto({
  celda,
  clientes,
  servicios,
  onClose,
  onCrear,
}: {
  celda: { fecha: string; hora: string };
  clientes: Cliente[];
  servicios: Servicio[];
  onClose: () => void;
  onCrear: (datos: {
    fecha: string;
    hora: string;
    duracion: number;
    clienteId: string;
    servicioId: string;
    nota: string;
  }) => Promise<boolean>;
}) {
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [clienteId, setClienteId] = useState<string | null>(null);
  const [listaAbierta, setListaAbierta] = useState(false);
  const [servicioId, setServicioId] = useState(servicios[0]?.id ?? '');
  const [duracion, setDuracion] = useState(servicios[0]?.duracion_minutos ?? 120);
  const [nota, setNota] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  const clienteElegido = clientes.find((c) => c.id === clienteId) ?? null;

  // Sin texto: muestra los primeros clientes igual que con texto, para que
  // la lista aparezca completa al hacer foco (no solo al empezar a tipear).
  const resultados = clienteElegido
    ? []
    : clientes
        .filter((c) => {
          const q = busquedaCliente.trim().toLowerCase();
          if (!q) return true;
          return c.nombre.toLowerCase().includes(q) || c.correo.toLowerCase().includes(q);
        })
        .slice(0, 6);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = overflowPrevio;
    };
  }, [onClose]);

  function elegirCliente(c: Cliente) {
    setClienteId(c.id);
    setBusquedaCliente(c.nombre);
    setListaAbierta(false);
  }

  function elegirServicio(id: string) {
    setServicioId(id);
    const s = servicios.find((s) => s.id === id);
    if (s) setDuracion(s.duracion_minutos);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorLocal(null);

    if (!clienteId) {
      setErrorLocal('Busca y selecciona un cliente de la lista.');
      return;
    }
    if (!servicioId) {
      setErrorLocal('Elige un servicio.');
      return;
    }

    setEnviando(true);
    const ok = await onCrear({ fecha: celda.fecha, hora: celda.hora, duracion, clienteId, servicioId, nota });
    setEnviando(false);
    if (ok) onClose();
    else setErrorLocal('No pudimos agendar la sesión. Intenta de nuevo.');
  }

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[300] flex items-center justify-center bg-ink p-6 anim-fade"
      style={{
        backgroundImage:
          'repeating-linear-gradient(135deg, rgba(242,238,231,0.04) 0 1px, transparent 1px 18px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-agendar-title"
        className="w-full max-w-[420px] bg-paper px-9 py-10 anim-modal-in"
      >
        <span className="font-mono text-[9px] tracking-[0.22em] uppercase text-dim">
          {fmtFechaCorta(celda.fecha)} · {celda.hora} hrs
        </span>
        <h2 id="modal-agendar-title" className="mt-1 font-serif italic text-2xl text-ink">
          Agendar sesión
        </h2>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
          <div className="relative">
            <label className="block">
              <span className={CLASES_LABEL}>Cliente</span>
              <input
                type="text"
                required
                placeholder="Buscar por nombre o correo…"
                value={busquedaCliente}
                onChange={(e) => {
                  setBusquedaCliente(e.target.value);
                  setClienteId(null);
                  setListaAbierta(true);
                }}
                onFocus={() => setListaAbierta(true)}
                onBlur={() => setTimeout(() => setListaAbierta(false), 150)}
                className={`${CLASES_INPUT} mt-2 placeholder:text-[#B9AF9C]`}
              />
            </label>
            {listaAbierta && resultados.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-paper border border-ink/15 shadow-[0_4px_16px_rgba(27,24,21,0.12)] z-10 max-h-[180px] overflow-y-auto">
                {resultados.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => elegirCliente(c)}
                    className="w-full text-left px-4 py-2.5 hover:bg-[#EDE7DD] transition-colors"
                  >
                    <span className="block font-body text-[14px] text-ink">{c.nombre}</span>
                    <span className="block font-mono text-[10px] text-dim">{c.correo}</span>
                  </button>
                ))}
              </div>
            )}
            {listaAbierta && busquedaCliente.trim().length > 0 && resultados.length === 0 && !clienteElegido && (
              <p className="mt-1.5 font-body italic text-[12.5px] text-dim">Sin resultados.</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="agendar-servicio" className={CLASES_LABEL}>Servicio</label>
            <select
              id="agendar-servicio"
              required
              value={servicioId}
              onChange={(e) => elegirServicio(e.target.value)}
              className={CLASES_INPUT}
            >
              {servicios.map((s) => (
                <option key={s.id} value={s.id}>{s.tipo}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="agendar-duracion" className={CLASES_LABEL}>Duración</label>
            <select
              id="agendar-duracion"
              value={duracion}
              onChange={(e) => setDuracion(Number(e.target.value))}
              className={CLASES_INPUT}
            >
              {DURACIONES.map((d) => (
                <option key={d.min} value={d.min}>{d.label}</option>
              ))}
            </select>
          </div>

          <label className="block">
            <span className={CLASES_LABEL}>Notas (opcional)</span>
            <input
              type="text"
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="Motivo, indicaciones…"
              className={`${CLASES_INPUT} mt-2 placeholder:text-[#B9AF9C]`}
            />
          </label>

          {errorLocal && (
            <p role="alert" className="font-mono text-[11px] leading-relaxed border-l-2 border-ink pl-3">
              {errorLocal}
            </p>
          )}

          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 font-mono text-[10px] tracking-[0.2em] uppercase border border-ink/25 text-ink py-3.5"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando}
              className="flex-1 font-mono bg-ink text-paper text-[10px] tracking-[0.2em] uppercase py-3.5 disabled:opacity-40"
            >
              {enviando ? 'Agendando…' : 'Agendar sesión'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}

// Panel lateral con el detalle de una reserva ("Solicitado"): cliente,
// servicio y cobro. Mismo patrón de overlay + portal que ModalBloqueo, pero
// anclado a la derecha en vez de centrado.
function PanelDetalleReserva({
  hueco,
  eliminando,
  onClose,
  onEliminar,
}: {
  hueco: Hueco;
  eliminando: boolean;
  onClose: () => void;
  onEliminar: () => void;
}) {
  const [confirmando, setConfirmando] = useState(false);
  const reserva = reservaVivaDelHueco(hueco);
  const cliente = reserva?.usuarios ?? null;
  const servicio = reserva?.services ?? null;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = overflowPrevio;
    };
  }, [onClose]);

  if (!reserva) return null;

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[300] flex justify-end bg-ink/40 anim-fade"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="panel-detalle-title"
        className="h-full w-full max-w-[380px] bg-paper px-8 py-10 overflow-y-auto anim-panel-in"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[9px] tracking-[0.22em] uppercase text-dim">
              {new Date(`${hueco.fecha}T00:00:00`).toLocaleDateString('es-CL', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </span>
            <h2 id="panel-detalle-title" className="font-serif italic text-2xl text-ink">
              {fmtHora(hueco.hora)} hrs
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="text-dim hover:text-ink transition-colors p-1 shrink-0"
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
              <path d="M1 1l11 11M12 1L1 12" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          </button>
        </div>

        <div className="h-px bg-[#DED7C9] mt-6" />

        <div className="mt-6">
          <span className={CLASES_LABEL}>Cliente</span>
          <div className="mt-2 bg-[#EDE7DD] px-4 py-3.5 flex flex-col gap-0.5">
            <span className="font-body text-[16px] text-ink">{cliente?.nombre ?? '—'}</span>
            {cliente?.correo && (
              <span className="font-mono text-[11px] text-[#7A7268]">{cliente.correo}</span>
            )}
            {cliente?.telefono && (
              <span className="font-mono text-[11px] text-[#7A7268]">{cliente.telefono}</span>
            )}
          </div>
        </div>

        <div className="mt-6">
          <span className={CLASES_LABEL}>Servicio</span>
          <div className="mt-2 flex items-baseline justify-between gap-3">
            <span className="font-body text-[16px] text-ink">{servicio?.tipo ?? '—'}</span>
          </div>
        </div>

        {reserva.comentario && (
          <div className="mt-6">
            <span className={CLASES_LABEL}>Comentario</span>
            <p className="mt-2 font-body italic text-[14px] text-[#3A342D] leading-relaxed">
              {reserva.comentario}
            </p>
          </div>
        )}

        <div className="mt-6">
          <span className={CLASES_LABEL}>Cobro</span>
          <p className="mt-2 font-serif italic text-[28px] text-ink">
            {servicio ? fmtPrecio(servicio.precio) : '—'}
          </p>
        </div>

        <div className="h-px bg-[#DED7C9] mt-8" />

        <div className="mt-6">
          <span className={CLASES_LABEL}>Acciones</span>

          {!confirmando ? (
            <button
              type="button"
              onClick={() => setConfirmando(true)}
              className="mt-3 w-full font-mono text-[9.5px] tracking-[0.18em] uppercase border border-ink/25 text-ink py-3.5 hover:border-ink transition-colors"
            >
              Eliminar sesión
            </button>
          ) : (
            <div className="mt-3 flex flex-col gap-3 anim-fade">
              <p className="font-body text-[13px] text-[#7A7268] leading-relaxed">
                Esto borra la reserva y libera el horario. Úsalo para limpiar pruebas o errores,
                no como cancelación normal.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmando(false)}
                  className="flex-1 font-mono text-[9.5px] tracking-[0.18em] uppercase border border-ink/25 text-ink py-3"
                >
                  Volver
                </button>
                <button
                  type="button"
                  onClick={onEliminar}
                  disabled={eliminando}
                  className="flex-1 font-mono bg-ink text-paper text-[9.5px] tracking-[0.18em] uppercase py-3 disabled:opacity-40"
                >
                  {eliminando ? 'Eliminando…' : 'Confirmar'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

// Una fila de la grilla = una hora, con sus 7 celdas de día. Los huecos se
// posicionan con altura proporcional a su duración (position: absolute
// dentro de la celda de inicio). Los bloqueos, en cambio, se pintan celda
// por celda (ver bloqueoDeEstaCelda más abajo), cada una con su propio
// candado: más simple y no depende de que la fila donde arrancan exista.
function ExpandedRow({
  horaLabel,
  fechasISO,
  huecosPorFecha,
  bloqueosPorFecha,
  onBorrar,
  onVerDetalle,
  onAgendar,
}: {
  horaLabel: number;
  fechasISO: string[];
  huecosPorFecha: Record<string, Hueco[]>;
  bloqueosPorFecha: Record<string, Bloqueo[]>;
  onBorrar: (h: Hueco) => void;
  onVerDetalle: (h: Hueco) => void;
  onAgendar: (fecha: string, hora: string) => void;
}) {
  return (
    <>
      <div className="border-r border-r-[#DED7C9] border-b border-b-[#ECE6D9] pr-2 pt-1 text-right font-mono text-[9px] text-dim">
        {String(horaLabel).padStart(2, '0')}:00
      </div>
      {fechasISO.map((iso) => {
        const huecosDelDia = huecosPorFecha[iso] ?? [];
        const huecosQueEmpiezanAqui = huecosDelDia.filter((h) => {
          const [hh] = h.hora.split(':').map(Number);
          return hh === horaLabel;
        });

        // Por celda, no por "empieza aquí": un bloqueo de todo el día
        // arranca a las 00:00, una hora que la grilla ni siquiera dibuja
        // (arranca en HORA_BASE_INICIO), así que depender de encontrar su
        // fila de inicio lo dejaba sin renderizar.
        const bloqueosDelDia = bloqueosPorFecha[iso] ?? [];
        const bloqueoDeEstaCelda = bloqueoEnHora(bloqueosDelDia, horaLabel);

        // Vacía: nada empieza acá, ningún hueco anterior se extiende sobre
        // esta celda, y no está bloqueada — solo ahí tiene sentido ofrecer
        // "agendar" (si hay algo dibujado encima, el click lo tapa).
        const cubiertaPorHuecoAnterior = huecosDelDia.some((h) => {
          const [hh, mm] = h.hora.split(':').map(Number);
          const finMin = hh * 60 + mm + h.duracion_minutos;
          return hh < horaLabel && finMin > horaLabel * 60;
        });
        const celdaVacia =
          huecosQueEmpiezanAqui.length === 0 && !cubiertaPorHuecoAnterior && !bloqueoDeEstaCelda;

        return (
          <div
            key={iso}
            className="group/celda relative border-r border-r-[#DED7C9] border-b border-b-[#ECE6D9]"
            style={{ minHeight: ALTO_FILA }}
          >
            {celdaVacia && (
              <button
                type="button"
                onClick={() => onAgendar(iso, `${String(horaLabel).padStart(2, '0')}:00`)}
                aria-label={`Agendar sesión el ${iso} a las ${String(horaLabel).padStart(2, '0')}:00`}
                className="absolute inset-0.5 flex items-center justify-center opacity-0 group-hover/celda:opacity-100 hover:bg-[#EDE7DD] transition-opacity"
              >
                <span className="font-mono text-base text-dim leading-none">+</span>
              </button>
            )}
            {huecosQueEmpiezanAqui.map((h) => {
              const [, mm] = h.hora.split(':').map(Number);
              const alto = (h.duracion_minutos / 60) * ALTO_FILA - 4;
              const top = (mm / 60) * ALTO_FILA + 2;

              return (
                <div
                  key={h.id}
                  role={h.tomado ? 'button' : undefined}
                  tabIndex={h.tomado ? 0 : undefined}
                  onClick={h.tomado ? () => onVerDetalle(h) : undefined}
                  onKeyDown={
                    h.tomado
                      ? (e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onVerDetalle(h);
                          }
                        }
                      : undefined
                  }
                  className={`absolute left-0.5 right-0.5 px-1.5 py-1 overflow-hidden group ${
                    h.tomado
                      ? 'bg-[#EAE4D8] border-l-2 border-ink cursor-pointer hover:bg-[#E3DCCC]'
                      : 'bg-[#F5EEE0] border-l-2 border-[#C9A05C]'
                  }`}
                  style={{ top, height: Math.max(alto, 20) }}
                >
                  <div className="flex items-start justify-between gap-1">
                    <span className="font-mono text-[10px] font-medium text-ink leading-tight">
                      {fmtHora(h.hora)}–{sumarMinutos(h.hora, h.duracion_minutos)}
                    </span>
                    {!h.tomado && (
                      <button
                        type="button"
                        onClick={() => onBorrar(h)}
                        aria-label={`Quitar horario de las ${fmtHora(h.hora)}`}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-dim hover:text-ink shrink-0"
                      >
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                          <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.2" />
                        </svg>
                      </button>
                    )}
                  </div>
                  {h.tomado ? (
                    <>
                      <span className="inline-block mt-1 font-mono text-[7.5px] tracking-[0.14em] uppercase bg-ink text-paper px-1.5 py-0.5">
                        Solicitado
                      </span>
                      {clienteDelHueco(h) && (
                        <span className="block font-body italic text-[11px] text-ink leading-tight mt-1 truncate">
                          {clienteDelHueco(h)}
                        </span>
                      )}
                    </>
                  ) : h.nota ? (
                    <span className="block font-mono text-[8px] text-[#8A6A2E] leading-tight mt-0.5">
                      {h.nota}
                    </span>
                  ) : (
                    <span className="block font-mono text-[7.5px] tracking-[0.12em] uppercase text-[#8A6A2E] mt-0.5">
                      {fmtDuracion(h.duracion_minutos)}
                    </span>
                  )}
                </div>
              );
            })}

            {bloqueoDeEstaCelda && <CandadoBloqueo bloqueo={bloqueoDeEstaCelda} />}
          </div>
        );
      })}
    </>
  );
}

// Candado centrado sobre fondo rayado — la marca visual de una celda
// bloqueada, usada tanto en las filas normales de la grilla (ExpandedRow)
// como en la fila de cierre (representa HORA_BASE_FIN, el borde del
// horario de atención).
function CandadoBloqueo({ bloqueo }: { bloqueo: Bloqueo }) {
  const titulo = bloqueo.motivo
    ? `Bloqueado — ${fmtRangoBloqueo(bloqueo)} — ${bloqueo.motivo}`
    : `Bloqueado — ${fmtRangoBloqueo(bloqueo)}`;

  return (
    <div
      title={titulo}
      className="absolute inset-0.5 overflow-hidden bg-[#EAE4D8] border-l-2 border-[#8A7A68] flex items-center justify-center"
      style={{
        backgroundImage: 'repeating-linear-gradient(135deg, rgba(27,24,21,0.05) 0 1px, transparent 1px 7px)',
      }}
    >
      <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true" className="text-[#7A7268]">
        <rect x="3" y="6.5" width="8" height="6" stroke="currentColor" strokeWidth="1.1" />
        <path d="M4.5 6.5V4.5a2.5 2.5 0 0 1 5 0v2" stroke="currentColor" strokeWidth="1.1" />
      </svg>
      <span className="sr-only">{titulo}</span>
    </div>
  );
}
