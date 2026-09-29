import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';

type Tab = 'entrar' | 'registro';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Valida formato (NN.NNN.NNN-D, con o sin puntos/guion) y dígito
// verificador de un RUT chileno con el algoritmo módulo 11 estándar.
function rutValido(valor: string): boolean {
  const limpio = valor.replace(/[.\s-]/g, '').toUpperCase();
  if (!/^\d{7,8}[0-9K]$/.test(limpio)) return false;

  const cuerpo = limpio.slice(0, -1);
  const dv = limpio.slice(-1);

  let suma = 0;
  let multiplicador = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo[i]) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }
  const resto = 11 - (suma % 11);
  const dvEsperado = resto === 11 ? '0' : resto === 10 ? 'K' : String(resto);

  return dv === dvEsperado;
}

// Formatea mientras se escribe: 222222222 -> 22.222.222-2. Trabaja sobre
// los caracteres válidos (dígitos + K final) e ignora el resto, así que
// pegar o seguir tipeando nunca deja el campo en un estado raro.
function formatearRut(valor: string): string {
  const limpio = valor.replace(/[.\s-]/g, '').toUpperCase().replace(/[^0-9K]/g, '');
  const recortado = limpio.slice(0, 9); // 8 dígitos de cuerpo + 1 dígito verificador
  if (recortado.length <= 1) return recortado;

  const cuerpo = recortado.slice(0, -1);
  const dv = recortado.slice(-1);
  const cuerpoConPuntos = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  return `${cuerpoConPuntos}-${dv}`;
}

// Formatea mientras se escribe: 987654321 -> 9 8765 4321 (celular
// chileno: 1 + 4 + 4 dígitos, sin el +56 que ya se asume).
function formatearTelefono(valor: string): string {
  const digitos = valor.replace(/\D/g, '').slice(0, 9);
  const p1 = digitos.slice(0, 1);
  const p2 = digitos.slice(1, 5);
  const p3 = digitos.slice(5, 9);

  return [p1, p2, p3].filter(Boolean).join(' ');
}

export default function AuthModal({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<Tab>('entrar');
  const [tieneTexto, setTieneTexto] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<Element | null>(null);

  // Click en el fondo pierde todo lo tipeado sin avisar — con un
  // formulario a medio llenar es frustrante. Si hay texto, el click
  // fuera no hace nada; sigue pudiendo cerrar con el botón × o Escape.
  function handleOverlayClick() {
    if (!tieneTexto) onClose();
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // La página de atrás no debe poder scrollear mientras el modal está
  // abierto: se restaura el overflow previo del body al cerrar, por si
  // algo más lo hubiera fijado.
  useEffect(() => {
    const previo = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previo;
    };
  }, []);

  // Guarda el elemento que abrió el modal una sola vez (no en cada
  // cambio de tab) y le devuelve el foco al cerrar — sin esto, un
  // usuario de teclado pierde su lugar en la página.
  useEffect(() => {
    triggerRef.current = document.activeElement;
    return () => {
      if (triggerRef.current instanceof HTMLElement) triggerRef.current.focus();
    };
  }, []);

  // Mueve el foco al primer campo cada vez que se monta un formulario
  // nuevo: al abrir el modal, y también al cambiar entre Entrar/Registro
  // (EntrarForm/RegistroForm se remontan con su propio `key`, así que sin
  // esto el foco queda en el botón ya desmontado del formulario anterior).
  useEffect(() => {
    const first = dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    first?.focus();
  }, [tab]);

  // Focus trap: Tab y Shift+Tab ciclan solo entre los elementos
  // focusables del modal, sin escapar hacia el header o la página
  // de atrás (invisible pero técnicamente alcanzable con teclado).
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key !== 'Tab' || !dialogRef.current) return;

    const focusables = Array.from(
      dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
    );
    if (focusables.length === 0) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  return createPortal(
    <div
      onClick={handleOverlayClick}
      className="fixed inset-0 z-[300] flex items-center justify-center bg-ink p-6 anim-fade"
      style={{
        backgroundImage:
          'repeating-linear-gradient(135deg, rgba(242,238,231,0.04) 0 1px, transparent 1px 18px)',
      }}
    >
      <div
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        className="relative w-full max-w-[480px] bg-paper px-10 py-14 anim-modal-in"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar y volver al inicio"
          className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center text-dim transition-colors hover:text-ink"
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
            <path d="M1 1L14 14M14 1L1 14" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </button>

        <div className="text-center">
          <span className="font-serif italic text-2xl text-ink">ink·sai</span>
        </div>

        {tab === 'entrar' ? (
          <EntrarForm
            key="entrar"
            onSwitch={() => setTab('registro')}
            onDirtyChange={setTieneTexto}
          />
        ) : (
          <RegistroForm
            key="registro"
            onSwitch={() => setTab('entrar')}
            onDirtyChange={setTieneTexto}
          />
        )}
      </div>
    </div>,
    document.body
  );
}

function Field({
  label,
  hideMargin,
  ...props
}: { label: string; hideMargin?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={`block ${hideMargin ? '' : 'mt-6'}`}>
      <span className="font-mono text-[9px] tracking-[0.22em] uppercase text-dim">{label}</span>
      <input
        {...props}
        className="mt-2 block w-full border-0 border-b border-ink/20 bg-transparent pb-[9px] text-center font-body text-base text-ink placeholder:text-[#B9AF9C] focus:border-ink focus:outline-none"
      />
    </label>
  );
}

function PasswordField({
  label,
  ...props
}: { label: string } & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="mt-6 block">
      <span className="font-mono text-[9px] tracking-[0.22em] uppercase text-dim">{label}</span>
      <span className="relative mt-2 flex items-center border-b border-ink/20 focus-within:border-ink">
        <input
          {...props}
          type={visible ? 'text' : 'password'}
          className="block w-full flex-1 border-0 bg-transparent pb-[9px] pl-6 pr-6 text-center font-body text-base text-ink placeholder:text-[#B9AF9C] outline-none"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          aria-pressed={visible}
          className="absolute right-0 bottom-2 shrink-0 text-dim transition-colors hover:text-ink"
        >
          {visible ? (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M1 8s2.7-5 7-5 7 5 7 5-2.7 5-7 5-7-5-7-5Z"
                stroke="currentColor"
                strokeWidth="1.1"
              />
              <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.1" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M1 8s2.7-5 7-5 7 5 7 5-2.7 5-7 5-7-5-7-5Z"
                stroke="currentColor"
                strokeWidth="1.1"
              />
              <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.1" />
              <path d="M2 14 14 2" stroke="currentColor" strokeWidth="1.1" />
            </svg>
          )}
        </button>
      </span>
    </label>
  );
}

// No hay rojo en la paleta: la barra de tinta al costado es la marca de error.
function Aviso({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="mt-6 border-l-2 border-ink pl-3 text-left font-mono text-[11px] leading-relaxed text-ink">
      {children}
    </p>
  );
}

function EntrarForm({
  onSwitch,
  onDirtyChange,
}: {
  onSwitch: () => void;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const { signIn } = useAuth();
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onDirtyChange(correo.length > 0 || password.length > 0);
    // Al desmontar (cambio de tab, o cierre) el modal no debe seguir
    // pensando que hay texto pendiente de este formulario.
    return () => onDirtyChange(false);
  }, [correo, password, onDirtyChange]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    const { error: err } = await signIn(correo, password);
    if (err) setError(err);
    // En caso de éxito el modal se desmonta solo: la sesión cambia y
    // quien lo montó reacciona (y muestra el toast de bienvenida).
    setEnviando(false);
  }

  return (
    <form onSubmit={handleSubmit} className="anim-fade mt-8 text-center">
      <h2 id="auth-modal-title" className="font-serif italic text-[28px] leading-[1.1] text-ink">
        Bienvenido de vuelta
      </h2>
      <p className="mt-1.5 font-mono text-[9px] tracking-[0.2em] uppercase text-dim">Estudio ink·sai</p>

      <Field
        label="Correo"
        type="email"
        placeholder="tu@correo.com"
        required
        autoComplete="email"
        value={correo}
        onChange={(e) => setCorreo(e.target.value)}
      />
      <PasswordField
        label="Contraseña"
        placeholder="········"
        required
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {error && <Aviso>{error}</Aviso>}

      <button
        type="submit"
        disabled={enviando}
        className="mt-7 w-full bg-ink py-3.5 font-mono text-[10.5px] tracking-[0.22em] uppercase text-paper transition-opacity hover:opacity-85 disabled:opacity-40"
      >
        {enviando ? 'Firmando…' : 'Entrar'}
      </button>

      <p className="mt-5">
        <a href="#" className="font-body italic text-sm text-[#7A7268] hover:text-ink">
          ¿Olvidaste tu contraseña?
        </a>
      </p>

      <p className="mt-9 border-t border-[#DED7CB] pt-6 font-body text-sm text-[#7A7268]">
        ¿No tienes cuenta?{' '}
        <button
          type="button"
          onClick={onSwitch}
          className="border-b border-ink text-ink"
        >
          Regístrate
        </button>
      </p>
    </form>
  );
}

function RegistroForm({
  onSwitch,
  onDirtyChange,
}: {
  onSwitch: () => void;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const { signUp } = useAuth();
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [rut, setRut] = useState('');
  const [telefono, setTelefono] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [aceptoTerminos, setAceptoTerminos] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registrado, setRegistrado] = useState(false);

  useEffect(() => {
    onDirtyChange(
      !registrado &&
        (nombre.length > 0 ||
          correo.length > 0 ||
          password.length > 0 ||
          rut.length > 0 ||
          telefono.length > 0 ||
          fechaNacimiento.length > 0 ||
          aceptoTerminos)
    );
    return () => onDirtyChange(false);
  }, [nombre, correo, password, rut, telefono, fechaNacimiento, aceptoTerminos, registrado, onDirtyChange]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!rutValido(rut)) {
      setError('El RUT ingresado no es válido. Revisa el número y el dígito verificador.');
      return;
    }

    setEnviando(true);
    const { error: err, necesitaConfirmar } = await signUp({
      correo,
      password,
      nombre,
      rut,
      telefono,
      fechaNacimiento,
      aceptoTerminos,
    });
    if (err) {
      setError(err);
    } else if (necesitaConfirmar) {
      setRegistrado(true);
    }
    setEnviando(false);
  }

  if (registrado) {
    // onDirtyChange ya no aplica acá: registrado desmontó los campos de
    // arriba y este formulario tiene su propio dirty-check más abajo.
    return <VerificarCodigoForm correo={correo} />;
  }

  return (
    <form onSubmit={handleSubmit} className="anim-fade mt-8 text-center">
      <h2 id="auth-modal-title" className="font-serif italic text-[28px] leading-[1.1] text-ink">
        Crea tu cuenta
      </h2>
      <p className="mt-1.5 font-mono text-[9px] tracking-[0.2em] uppercase text-dim">Estudio ink·sai</p>

      <Field
        label="Nombre"
        type="text"
        placeholder="Nombre y apellido"
        required
        autoComplete="name"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
      />

      <div className="mt-6 flex gap-5">
        <div className="flex-[1.4]">
          <Field
            label="Correo"
            type="email"
            placeholder="tu@correo.com"
            required
            autoComplete="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            hideMargin
          />
        </div>
        <div className="flex-1">
          <Field
            label="Fecha de nacimiento"
            type="date"
            required
            value={fechaNacimiento}
            onChange={(e) => setFechaNacimiento(e.target.value)}
            hideMargin
          />
        </div>
      </div>

      <div className="mt-6 flex gap-5">
        <div className="flex-1">
          <Field
            label="RUT"
            type="text"
            placeholder="12.345.678-9"
            required
            maxLength={12}
            value={rut}
            onChange={(e) => setRut(formatearRut(e.target.value))}
            hideMargin
          />
        </div>
        <div className="flex-1">
          <Field
            label="Teléfono"
            type="tel"
            placeholder="9 1234 5678"
            required
            maxLength={11}
            autoComplete="tel"
            value={telefono}
            onChange={(e) => setTelefono(formatearTelefono(e.target.value))}
            hideMargin
          />
        </div>
      </div>

      <PasswordField
        label="Contraseña"
        placeholder="········"
        required
        minLength={8}
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <label className="mt-6 flex items-start gap-2.5 text-left font-body text-[13px] leading-snug text-[#4A4030]">
        <input
          type="checkbox"
          required
          checked={aceptoTerminos}
          onChange={(e) => setAceptoTerminos(e.target.checked)}
          className="mt-0.5 accent-ink"
        />
        <span>Doy fe de que cada pieza acordada aquí es única — sin réplicas, sin copias.</span>
      </label>

      {error && <Aviso>{error}</Aviso>}

      <button
        type="submit"
        disabled={enviando}
        className="mt-7 w-full bg-ink py-3.5 font-mono text-[10.5px] tracking-[0.22em] uppercase text-paper transition-opacity hover:opacity-85 disabled:opacity-40"
      >
        {enviando ? 'Sellando…' : 'Crear cuenta'}
      </button>

      <p className="mt-9 border-t border-[#DED7CB] pt-6 font-body text-sm text-[#7A7268]">
        ¿Ya tienes cuenta?{' '}
        <button
          type="button"
          onClick={onSwitch}
          className="border-b border-ink text-ink"
        >
          Entra
        </button>
      </p>
    </form>
  );
}

// Tras el registro, Supabase manda un código de 6 dígitos al correo
// (plantilla "Confirm signup" en frontend/email-templates/) en vez de un
// enlace: más simple de probar y no depende de cómo cada cliente de
// correo trata los links.
function VerificarCodigoForm({ correo }: { correo: string }) {
  const { verifyOtp } = useAuth();
  const [codigo, setCodigo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    const { error: err } = await verifyOtp(correo, codigo.trim());
    if (err) setError(err);
    // En caso de éxito el modal se desmonta solo: la sesión cambia y
    // quien lo montó reacciona (igual que en EntrarForm).
    setEnviando(false);
  }

  return (
    <form onSubmit={handleSubmit} className="anim-fade mt-8 text-center">
      <h2 id="auth-modal-title" className="font-serif italic text-[28px] leading-[1.1] text-ink">
        Firma tu entrada
      </h2>
      <p className="mt-1.5 font-mono text-[9px] tracking-[0.2em] uppercase text-dim">
        Falta tu confirmación
      </p>
      <p className="mt-6 font-body text-[15px] leading-snug text-[#4A4030]">
        Enviamos un código a <span className="italic">{correo}</span>. Ingrésalo para activar tu
        cuenta y poder agendar.
      </p>

      <label className="mt-6 block">
        <span className="font-mono text-[9px] tracking-[0.22em] uppercase text-dim">Código</span>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="000000"
          required
          maxLength={6}
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))}
          className="mt-2 block w-full border-0 border-b border-ink/20 bg-transparent pb-[9px] text-center font-mono text-2xl tracking-[0.5em] text-ink placeholder:text-[#B9AF9C] focus:border-ink focus:outline-none"
        />
      </label>

      {error && <Aviso>{error}</Aviso>}

      <button
        type="submit"
        disabled={enviando || codigo.length !== 6}
        className="mt-7 w-full bg-ink py-3.5 font-mono text-[10.5px] tracking-[0.22em] uppercase text-paper transition-opacity hover:opacity-85 disabled:opacity-40"
      >
        {enviando ? 'Verificando…' : 'Confirmar código'}
      </button>
    </form>
  );
}
