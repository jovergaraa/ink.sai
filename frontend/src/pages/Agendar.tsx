import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import AuthModal from '../components/AuthModal';
import { fmtDuracion, fmtFecha, fmtMonto } from '../lib/formato';

interface Servicio {
  id: string;
  tipo: string;
  duracion_minutos: number;
  precio: number;
}

interface Hueco {
  id: string;
  fecha: string;
  hora: string;
  duracion_minutos: number;
  nota: string | null;
}

interface Borrador {
  servicioId: string | null;
  huecoId: string | null;
  comentario: string;
}

// En localStorage y no sessionStorage a propósito: un cliente nuevo tiene que
// confirmar su correo, y ese enlace abre otra pestaña. Con sessionStorage
// perdería todo lo que llevaba escrito.
const CLAVE_BORRADOR = 'inksai:borrador-reserva';
const VIGENCIA_MS = 24 * 60 * 60 * 1000;
const MAX_BYTES = 8 * 1024 * 1024;
const SENA = 10000;

// Más oscuro que el `dim` del resto del sitio: aquí las etiquetas numeran
// pasos de un formulario, no son decoración, y hay que poder leerlas.
const CLASES_LABEL = 'block font-mono text-[9px] tracking-[0.26em] uppercase text-[#7E7568] mb-2';
const CLASES_INPUT =
  'w-full bg-transparent border-b border-ink/20 focus:border-ink outline-none font-body text-lg py-2 transition-colors';

function fmtPrecio(n: number) {
  return n === 0 ? 'Gratis' : 'desde ' + fmtMonto(n);
}

// Una línea de la ficha. Sin valor todavía muestra una raya, para que el
// bloque tenga su altura final desde el principio y no salte al llenarse.
function Fila({
  termino,
  valor,
  vacio = '—',
}: {
  termino: string;
  valor: string | null;
  vacio?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-5 py-2.5 border-b border-[#D2C8B4] last:border-b-0">
      <dt className="font-mono text-[9px] tracking-[0.2em] uppercase text-[#786F61] shrink-0">
        {termino}
      </dt>
      <dd
        className={`font-body text-[15px] text-right first-letter:uppercase ${
          valor ? 'text-ink' : 'text-[#A0957F]'
        }`}
      >
        {valor ?? vacio}
      </dd>
    </div>
  );
}

// La semana parte en lunes, como en Chile.
const DIAS_SEMANA = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

function isoDe(a: number, m: number, d: number) {
  return `${a}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function fmtMes(a: number, m: number) {
  return new Date(a, m, 1).toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });
}

function leerBorrador(): Borrador | null {
  try {
    const crudo = localStorage.getItem(CLAVE_BORRADOR);
    if (!crudo) return null;
    const { guardadoEn, datos } = JSON.parse(crudo);
    if (Date.now() - guardadoEn > VIGENCIA_MS) {
      localStorage.removeItem(CLAVE_BORRADOR);
      return null;
    }
    return datos as Borrador;
  } catch {
    return null;
  }
}

// Una foto de celular son 8 MB; se sube redimensionada a webp.
async function comprimir(file: File, maxLado = 1600): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const escala = Math.min(1, maxLado / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * escala);
  canvas.height = Math.round(bitmap.height * escala);

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('sin canvas');
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

  return new Promise((resolver, rechazar) => {
    canvas.toBlob(
      (b) => (b ? resolver(b) : rechazar(new Error('sin blob'))),
      'image/webp',
      0.85,
    );
  });
}

export default function Agendar() {
  const { session, user } = useAuth();

  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [cargandoServicios, setCargandoServicios] = useState(true);
  const [errorCarga, setErrorCarga] = useState(false);

  const [huecos, setHuecos] = useState<Hueco[]>([]);
  const [cargandoHuecos, setCargandoHuecos] = useState(false);

  const [servicioId, setServicioId] = useState<string | null>(null);
  const [huecoId, setHuecoId] = useState<string | null>(null);
  const [diaSel, setDiaSel] = useState<string | null>(null);
  const [mes, setMes] = useState(() => {
    const h = new Date();
    return { a: h.getFullYear(), m: h.getMonth() };
  });
  const [comentario, setComentario] = useState('');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [authOpen, setAuthOpen] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [creada, setCreada] = useState<{ servicio: Servicio; hueco: Hueco } | null>(null);

  // El borrador se restaura una vez; después el usuario manda.
  const borradorAplicado = useRef(false);

  const servicio = servicios.find((s) => s.id === servicioId) ?? null;
  const hueco = huecos.find((h) => h.id === huecoId) ?? null;

  useEffect(() => {
    let cancelado = false;

    supabase
      .from('services')
      .select('id, tipo, duracion_minutos, precio')
      .eq('activo', true)
      .order('duracion_minutos', { ascending: true })
      .then(({ data, error: err }) => {
        if (cancelado) return;
        if (err) setErrorCarga(true);
        else setServicios((data as Servicio[]) ?? []);
        setCargandoServicios(false);
      });

    return () => {
      cancelado = true;
    };
  }, []);

  // Los huecos dependen del servicio: solo los que aguantan su duración (D7).
  useEffect(() => {
    if (!servicio) {
      setHuecos([]);
      return;
    }

    let cancelado = false;
    setCargandoHuecos(true);

    supabase
      .from('huecos_libres')
      .select('id, fecha, hora, duracion_minutos, nota')
      .gte('duracion_minutos', servicio.duracion_minutos)
      .order('fecha', { ascending: true })
      .order('hora', { ascending: true })
      .then(({ data, error: err }) => {
        if (cancelado) return;
        if (err) setErrorCarga(true);
        else setHuecos((data as Hueco[]) ?? []);
        setCargandoHuecos(false);
      });

    return () => {
      cancelado = true;
    };
  }, [servicio]);

  // Recuperar lo que llevaba escrito antes de irse a registrarse.
  useEffect(() => {
    if (borradorAplicado.current || servicios.length === 0) return;
    borradorAplicado.current = true;

    const b = leerBorrador();
    if (!b) return;
    if (b.servicioId && servicios.some((s) => s.id === b.servicioId)) setServicioId(b.servicioId);
    setComentario(b.comentario);
    if (b.huecoId) setHuecoId(b.huecoId);
    setAviso(
      'Recuperamos lo que habías elegido. Si habías adjuntado una referencia, vuelve a subirla.',
    );
  }, [servicios]);

  // El hueco guardado puede haberse ocupado mientras el cliente se registraba.
  useEffect(() => {
    if (!huecoId || cargandoHuecos || huecos.length === 0) return;
    if (!huecos.some((h) => h.id === huecoId)) {
      setHuecoId(null);
      setAviso('El horario que habías elegido ya no está disponible. Elige otro.');
    }
  }, [huecos, huecoId, cargandoHuecos]);

  // El calendario arranca en el mes del primer hueco: si el artista solo
  // publicó horas del mes que viene, abrir en el actual mostraría una grilla
  // entera apagada.
  useEffect(() => {
    if (huecos.length === 0) return;
    const [a, m] = huecos[0].fecha.split('-').map(Number);
    setMes({ a, m: m - 1 });
  }, [huecos]);

  // El día elegido puede quedarse sin horas tras recargar (otro lo tomó).
  useEffect(() => {
    if (diaSel && !huecos.some((h) => h.fecha === diaSel)) setDiaSel(null);
  }, [huecos, diaSel]);

  useEffect(() => {
    if (session) setAuthOpen(false);
  }, [session]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function elegirServicio(id: string) {
    setServicioId(id);
    setHuecoId(null);
    setDiaSel(null);
    setError(null);
  }

  function moverMes(delta: number) {
    setMes(({ a, m }) => {
      const d = new Date(a, m + delta, 1);
      return { a: d.getFullYear(), m: d.getMonth() };
    });
  }

  function elegirArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;

    if (f.size > MAX_BYTES) {
      setError('Esa imagen pesa demasiado. Prueba con una de menos de 8 MB.');
      return;
    }

    setError(null);
    setArchivo(f);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(f));
  }

  function guardarBorrador() {
    const datos: Borrador = { servicioId, huecoId, comentario };
    localStorage.setItem(CLAVE_BORRADOR, JSON.stringify({ guardadoEn: Date.now(), datos }));
  }

  async function recargarHuecos() {
    if (!servicio) return;
    const { data } = await supabase
      .from('huecos_libres')
      .select('id, fecha, hora, duracion_minutos, nota')
      .gte('duracion_minutos', servicio.duracion_minutos)
      .order('fecha', { ascending: true })
      .order('hora', { ascending: true });
    setHuecos((data as Hueco[]) ?? []);
  }

  async function confirmar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setAviso(null);

    if (!servicio) return setError('Elige un tipo de sesión.');
    if (!hueco) return setError('Elige un horario.');

    // /agendar es pública: el login se pide recién aquí (D1).
    if (!session || !user) {
      guardarBorrador();
      setAuthOpen(true);
      return;
    }

    setEnviando(true);

    // La referencia es opcional: sin archivo no se sube nada y la reserva
    // queda con referencia_path en null.
    let ruta: string | null = null;
    if (archivo) {
      try {
        const blob = await comprimir(archivo);
        ruta = `${user.id}/${crypto.randomUUID()}.webp`;
        const { error: errSubida } = await supabase.storage
          .from('referencias')
          .upload(ruta, blob, { contentType: 'image/webp' });
        if (errSubida) throw errSubida;
      } catch {
        setEnviando(false);
        setError('No pudimos subir la imagen. Intenta con otra.');
        return;
      }
    }

    const { error: errReserva } = await supabase.from('booking').insert({
      cliente_id: user.id,
      service_id: servicio.id,
      hueco_id: hueco.id,
      fecha: hueco.fecha,
      hora: hueco.hora,
      comentario: comentario.trim() || null,
      referencia_path: ruta,
    });

    setEnviando(false);

    if (errReserva) {
      // La imagen ya subida queda huérfana si no se limpia.
      if (ruta) await supabase.storage.from('referencias').remove([ruta]);

      // 23505: el índice único parcial sobre (hueco_id) — alguien tomó ese
      // horario entre que se cargó la lista y ahora (B1, B2).
      if (errReserva.code === '23505') {
        setHuecoId(null);
        await recargarHuecos();
        setError('Ese horario acaba de ocuparse. Elige otro de la lista.');
      } else {
        setError('No pudimos registrar tu solicitud. Intenta de nuevo.');
      }
      return;
    }

    localStorage.removeItem(CLAVE_BORRADOR);
    setCreada({ servicio, hueco });
  }

  if (creada) {
    return (
      <main className="min-h-screen pt-32 px-6 md:px-10 pb-24 flex justify-center text-ink">
        <div className="w-full max-w-xl anim-fade">
          <h1 className="font-serif italic text-4xl mb-3">Ficha enviada.</h1>
          <p className="font-body text-[19px] leading-relaxed text-[#3A342D]">
            Pediste <span className="italic">{creada.servicio.tipo}</span> para el{' '}
            {fmtFecha(creada.hueco.fecha)} a las {creada.hueco.hora.slice(0, 5)}.
          </p>

          <div className="h-px bg-[#DED7CB] my-8" />

          <h2 className="font-mono text-[10px] tracking-[0.28em] uppercase text-dim mb-3">
            Qué pasa ahora
          </h2>
          <ul className="flex flex-col gap-3 font-body text-[17px] leading-relaxed text-[#3A342D]">
            <li>
              El estudio revisa cada solicitud antes de confirmarla. Te avisaremos
              en cuanto esté aprobada.
            </li>
            <li>
              Para dejar la hora firme hay que transferir una seña de{' '}
              <span className="font-mono text-[15px]">{fmtMonto(SENA)}</span>. Te enviaremos
              los datos para la transferencia junto con la confirmación.
            </li>
            <li>
              Si necesitas cancelar, avísanos con al menos <strong>2 días</strong> de
              anticipación para no perder la seña. Puedes cambiar la fecha una vez.
            </li>
          </ul>

          <div className="h-px bg-[#DED7CB] my-8" />

          <Link
            to="/mis-reservas"
            className="font-mono text-[9.5px] tracking-[0.26em] uppercase border-b border-ink pb-1"
          >
            Ver mis reservas
          </Link>
        </div>
      </main>
    );
  }

  // Agrupar por fecha: el calendario solo necesita saber qué días tienen algo.
  const porFecha = huecos.reduce<Record<string, Hueco[]>>((acc, h) => {
    (acc[h.fecha] ??= []).push(h);
    return acc;
  }, {});

  // Celdas del mes visible. El desfase alinea el día 1 con su columna contando
  // desde el lunes (getDay() devuelve 0 para domingo).
  const desfase = (new Date(mes.a, mes.m, 1).getDay() + 6) % 7;
  const diasDelMes = new Date(mes.a, mes.m + 1, 0).getDate();
  const celdas: (number | null)[] = [
    ...Array<null>(desfase).fill(null),
    ...Array.from({ length: diasDelMes }, (_, i) => i + 1),
  ];

  const ahora = new Date();
  const puedeRetroceder =
    mes.a > ahora.getFullYear() ||
    (mes.a === ahora.getFullYear() && mes.m > ahora.getMonth());

  return (
    <main className="min-h-screen pt-32 px-6 md:px-10 pb-24 text-ink">
      <div className="anim-fade">
        <div className="max-w-xl">
          <div className="font-mono text-[9.5px] tracking-[0.3em] uppercase text-dim">
            § 06 — Agendar
          </div>
          <h1 className="mt-3.5 font-serif font-normal text-[40px] md:text-[56px] leading-none tracking-tight">
            Reserva <em className="italic">tu sesión</em>
          </h1>
          <p className="mt-6 font-body text-[19px] leading-relaxed text-[#3A342D]">
            Elige el tipo de sesión y uno de los horarios disponibles. El estudio
            confirma cada reserva a mano.
          </p>

          {aviso && (
            <p className="mt-8 font-mono text-[11px] leading-relaxed border-l-2 border-dim pl-3 text-[#5A534B]">
              {aviso}
            </p>
          )}
        </div>

        {/* Tres columnas: el catálogo como índice angosto, el calendario con el
            centro (que es la decisión que más espacio pide) y la ficha a la
            derecha, que no pide nada y solo resume lo que llevas. */}
        <form
          onSubmit={confirmar}
          className="mt-12 grid grid-cols-1 lg:grid-cols-[230px_minmax(0,1fr)_320px] xl:grid-cols-[270px_minmax(0,1fr)_400px] gap-x-12 xl:gap-x-16 gap-y-12 items-start"
        >
          {/* 1 — Servicio */}
          <div>
            <span className={CLASES_LABEL}>01 — Tipo de sesión</span>

            {cargandoServicios && (
              <div
                className="h-[140px]"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(135deg, #E4DED2 0 1px, transparent 1px 15px)',
                }}
              />
            )}

            {!cargandoServicios && errorCarga && (
              <p role="alert" className="font-mono text-[11px] border-l-2 border-ink pl-3">
                No pudimos cargar los servicios. Recarga la página.
              </p>
            )}

            {!cargandoServicios && !errorCarga && servicios.length === 0 && (
              <div>
                <p className="font-serif italic text-[22px]">Aún no hay servicios publicados.</p>
                <Link
                  to="/#contacto"
                  className="inline-block mt-4 font-mono text-[9.5px] tracking-[0.26em] uppercase border-b border-ink pb-1"
                >
                  Escríbenos
                </Link>
              </div>
            )}

            {servicios.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => elegirServicio(s.id)}
                aria-pressed={servicioId === s.id}
                // El elegido se marca con relleno, no bajando la opacidad de
                // los demás: sobre papel, atenuar deja el catálogo ilegible.
                className={`w-full flex flex-col gap-1.5 border-t border-[#C9BFAB] py-4 px-3 -mx-3 text-left last:border-b transition-colors ${
                  servicioId === s.id ? 'bg-[#E3DBCB]' : 'hover:bg-[#EBE6DB]'
                }`}
              >
                <span
                  className={`font-body text-[19px] leading-snug ${
                    servicioId === s.id ? 'text-ink' : 'text-[#4A443C]'
                  }`}
                >
                  {s.tipo}
                </span>
                <span className="font-mono text-[9.5px] tracking-[0.2em] uppercase text-[#867D70]">
                  {fmtDuracion(s.duracion_minutos)} · {fmtPrecio(s.precio)}
                </span>
              </button>
            ))}
          </div>

          {/* Columna del centro: horario y lo que depende de él */}
          <div className="flex flex-col gap-12">
            {!servicio && servicios.length > 0 && (
              <div
                className="hidden lg:flex items-center justify-center h-[280px] px-8 text-center"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(135deg, #E4DED2 0 1px, transparent 1px 15px)',
                }}
              >
                <p className="font-serif italic text-[21px] text-[#5A534B]">
                  Elige un tipo de sesión y aquí aparecerá el calendario.
                </p>
              </div>
            )}

            {/* 2 — Hueco */}
            {servicio && (
              <div>
                <span className={CLASES_LABEL}>02 — Horario</span>

                {cargandoHuecos && (
                  <div
                    className="h-[100px]"
                    style={{
                      backgroundImage:
                        'repeating-linear-gradient(135deg, #E4DED2 0 1px, transparent 1px 15px)',
                    }}
                  />
                )}

                {!cargandoHuecos && huecos.length === 0 && (
                  <div>
                    <p className="font-serif italic text-[22px]">
                      No hay horarios disponibles para una {servicio.tipo.toLowerCase()}.
                    </p>
                    <p className="mt-2 font-body text-[17px] text-[#3A342D]">
                      Necesita {fmtDuracion(servicio.duracion_minutos)}. Prueba con una
                      sesión más corta, o escríbenos y coordinamos.
                    </p>
                    <Link
                      to="/#contacto"
                      className="inline-block mt-4 font-mono text-[9.5px] tracking-[0.26em] uppercase border-b border-ink pb-1"
                    >
                      Escríbenos
                    </Link>
                  </div>
                )}

                {!cargandoHuecos && huecos.length > 0 && (
                  <div className="max-w-[820px]">
                    <div className="flex items-center justify-between gap-4">
                      <button
                        type="button"
                        onClick={() => moverMes(-1)}
                        disabled={!puedeRetroceder}
                        aria-label="Mes anterior"
                        className="font-mono text-[15px] px-2 leading-none text-[#5A5248] hover:text-ink disabled:opacity-30 transition-colors"
                      >
                        ‹
                      </button>
                      <span
                        aria-live="polite"
                        className="font-serif italic text-[19px] first-letter:uppercase"
                      >
                        {fmtMes(mes.a, mes.m)}
                      </span>
                      <button
                        type="button"
                        onClick={() => moverMes(1)}
                        aria-label="Mes siguiente"
                        className="font-mono text-[15px] px-2 leading-none text-[#5A5248] hover:text-ink transition-colors"
                      >
                        ›
                      </button>
                    </div>

                    <div className="grid grid-cols-7 gap-1.5 mt-5">
                      {DIAS_SEMANA.map((d, i) => (
                        <div
                          key={i}
                          aria-hidden="true"
                          className="text-center font-mono text-[9px] tracking-[0.18em] uppercase text-[#7E7568] pb-1"
                        >
                          {d}
                        </div>
                      ))}

                      {celdas.map((d, i) => {
                        if (d === null) return <div key={`v${i}`} />;

                        const iso = isoDe(mes.a, mes.m, d);
                        const libres = porFecha[iso]?.length ?? 0;
                        const elegido = diaSel === iso;

                        return (
                          <button
                            key={iso}
                            type="button"
                            disabled={libres === 0}
                            onClick={() => {
                              setDiaSel(iso);
                              setHuecoId(null);
                            }}
                            aria-pressed={elegido}
                            aria-label={`${fmtFecha(iso)} — ${libres} ${
                              libres === 1 ? 'hora libre' : 'horas libres'
                            }`}
                            className={`h-12 flex items-center justify-center font-mono text-[12px] tabular-nums transition-colors ${
                              elegido
                                ? 'bg-ink text-paper'
                                : libres > 0
                                  ? 'border border-ink/55 text-ink hover:bg-[#E3DBCB]'
                                  : 'text-[#ADA392]'
                            }`}
                          >
                            {d}
                          </button>
                        );
                      })}
                    </div>

                    {!diaSel && (
                      <p className="mt-6 font-body text-[15px] leading-relaxed text-[#5A534B]">
                        Los días recuadrados tienen horas libres para esta sesión.
                        Elige uno.
                      </p>
                    )}

                    {diaSel && (
                      <div className="mt-7">
                        <h3 className="font-serif italic text-[19px] first-letter:uppercase text-[#5A534B] mb-3">
                          {fmtFecha(diaSel)}
                        </h3>
                        <div className="flex flex-wrap gap-3">
                          {(porFecha[diaSel] ?? []).map((h) => (
                            <button
                              key={h.id}
                              type="button"
                              onClick={() => setHuecoId(h.id)}
                              aria-pressed={huecoId === h.id}
                              title={h.nota ?? undefined}
                              className={`font-mono text-[11px] tracking-[0.16em] px-4 py-3 border transition-colors ${
                                huecoId === h.id
                                  ? 'bg-ink text-paper border-ink'
                                  : 'border-ink/55 hover:bg-[#E3DBCB]'
                              }`}
                            >
                              {h.hora.slice(0, 5)}
                              <span className="ml-2 opacity-60">
                                {fmtDuracion(h.duracion_minutos)}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 3 — Referencia y comentario */}
            {hueco && (
              <>
                <div>
                  <span className={CLASES_LABEL}>03 — Imagen de referencia (opcional)</span>
                  <p className="-mt-1 mb-3 font-body text-[15px] leading-relaxed text-[#4A443C]">
                    Si tienes una idea a mano, adjúntala. Si no, puedes enviarla
                    igual y coordinarla después.
                  </p>
                  <input
                    id="referencia"
                    type="file"
                    accept="image/*"
                    onChange={elegirArchivo}
                    className="block w-full font-mono text-[11px] text-[#6B6255] file:mr-4 file:border file:border-ink file:bg-transparent file:px-4 file:py-2 file:font-mono file:text-[9.5px] file:uppercase file:tracking-[0.2em] file:text-ink"
                  />
                  {previewUrl && (
                    <img
                      src={previewUrl}
                      alt="Vista previa de tu referencia"
                      className="mt-4 max-h-56 border border-[#DED7CB] object-contain"
                    />
                  )}
                </div>

                <div>
                  <label htmlFor="comentario" className={CLASES_LABEL}>
                    04 — Tu idea (opcional)
                  </label>
                  <textarea
                    id="comentario"
                    rows={3}
                    value={comentario}
                    onChange={(e) => setComentario(e.target.value)}
                    placeholder="Zona del cuerpo, tamaño aproximado…"
                    className={`${CLASES_INPUT} resize-none placeholder:text-[#B9AF9C]`}
                  />
                </div>
              </>
            )}

            {error && (
              <p role="alert" className="font-mono text-[11px] leading-relaxed border-l-2 border-ink pl-3">
                {error}
              </p>
            )}
          </div>

          {/* Ficha */}
          {servicios.length > 0 && (
            <aside className="lg:sticky lg:top-28 bg-[#E9E2D5] border-t-2 border-ink p-7">
              <span className="font-mono text-[9px] tracking-[0.26em] uppercase text-[#786F61]">
                Tu ficha
              </span>

              <dl className="mt-5 flex flex-col">
                <Fila termino="Sesión" valor={servicio?.tipo ?? null} />
                <Fila
                  termino="Duración"
                  valor={servicio ? fmtDuracion(servicio.duracion_minutos) : null}
                />
                {/* El día se llena al tocarlo en el calendario, antes de elegir
                    la hora, para que la ficha responda al primer clic. */}
                <Fila termino="Día" valor={diaSel ? fmtFecha(diaSel) : null} />
                <Fila termino="Hora" valor={hueco ? hueco.hora.slice(0, 5) : null} />
                {/* "Sin imagen" y no una raya: la raya se lee como un campo
                    que falta, y la referencia ya no es obligatoria. */}
                <Fila
                  termino="Referencia"
                  valor={archivo ? 'Adjunta' : null}
                  vacio="Sin imagen"
                />
              </dl>

              <div className="mt-6 pt-4 border-t border-[#D2C8B4] flex items-baseline justify-between gap-4">
                <span className="font-mono text-[9px] tracking-[0.26em] uppercase text-[#786F61]">
                  Valor
                </span>
                <span className="font-serif text-[26px] leading-none">
                  {servicio ? fmtMonto(servicio.precio) : '—'}
                </span>
              </div>

              <p className="mt-3 font-body text-[14px] leading-relaxed text-[#5A534B]">
                Se reserva con una seña de{' '}
                <span className="font-mono text-[13px]">{fmtMonto(SENA)}</span>. El resto
                se paga el día de la sesión.
              </p>

              <button
                type="submit"
                disabled={enviando}
                className="mt-7 w-full bg-ink text-paper font-mono text-[10px] tracking-[0.26em] uppercase py-4 disabled:opacity-40 transition-opacity"
              >
                {enviando ? 'Enviando…' : session ? 'Enviar solicitud' : 'Continuar'}
              </button>

              {!session && (
                <p className="mt-3 font-mono text-[9px] tracking-[0.24em] uppercase text-[#786F61]">
                  Te pediremos entrar antes de enviarla
                </p>
              )}
            </aside>
          )}
        </form>
      </div>

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
    </main>
  );
}
