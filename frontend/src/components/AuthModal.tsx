import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

type Tab = 'entrar' | 'registro';

export default function AuthModal({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<Tab>('entrar');

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[300] flex items-center justify-center bg-[#141210] p-6 anim-fade"
      style={{
        backgroundImage:
          'radial-gradient(rgba(242,238,231,0.05) 1px, transparent 1px)',
        backgroundSize: '14px 14px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex w-full max-w-[540px] anim-modal-in"
      >
        <div className="relative flex-1 bg-paper px-10 py-12 md:px-14 md:py-14">
          <span className="absolute left-10 top-10 font-serif italic text-2xl text-dim md:left-14">
            S
          </span>

          <div className="mt-10 font-mono text-[10px] tracking-[0.3em] uppercase text-dim">
            Estudio ink·sai — Ficha de admisión
          </div>

          {tab === 'entrar' ? (
            <EntrarForm key="entrar" />
          ) : (
            <RegistroForm key="registro" />
          )}
        </div>

        <div className="flex flex-col">
          <button
            onClick={() => setTab('entrar')}
            className={`flex-1 px-2.5 py-6 font-mono text-[10px] tracking-[0.3em] uppercase [writing-mode:vertical-rl] transition-colors ${
              tab === 'entrar'
                ? 'bg-ink text-paper'
                : 'bg-[#E4DED2] text-dim hover:text-ink'
            }`}
          >
            Entrar
          </button>
          <button
            onClick={() => setTab('registro')}
            className={`flex-1 px-2.5 py-6 font-mono text-[10px] tracking-[0.3em] uppercase [writing-mode:vertical-rl] transition-colors ${
              tab === 'registro'
                ? 'bg-ink text-paper'
                : 'bg-[#E4DED2] text-dim hover:text-ink'
            }`}
          >
            Registro
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function Field({ n, label, ...props }: { n: string; label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="mt-8 block">
      <span className="font-mono text-[10px] tracking-[0.28em] uppercase text-dim">
        {n} — {label}
      </span>
      <input
        {...props}
        className="mt-3 w-full border-0 border-b border-dashed border-[#C9C0AE] bg-transparent pb-2 font-body text-lg text-ink placeholder:text-[#B9AF9C] focus:border-ink focus:outline-none"
      />
    </label>
  );
}

function EntrarForm() {
  return (
    <div className="anim-fade">
      <h2 className="mt-4 font-serif text-4xl leading-[1.05] text-ink md:text-[42px]">
        Retoma tu ficha.
      </h2>
      <p className="mt-3 font-body italic text-[15px] text-[#6B635A]">
        Firma para entrar al registro del estudio.
      </p>

      <Field n="01" label="Correo de contacto" type="email" placeholder="tu@correo.com" />
      <Field n="02" label="Firma / contraseña" type="password" placeholder="········" />

      <div className="mt-10 flex items-center justify-between gap-6">
        <button className="bg-ink px-7 py-3.5 font-mono text-[11px] tracking-[0.24em] uppercase text-paper transition-opacity hover:opacity-85">
          Firmar entrada
        </button>
        <a href="#" className="font-body italic text-sm text-[#6B635A] hover:text-ink">
          ¿Perdiste tu ficha?
        </a>
      </div>
    </div>
  );
}

function RegistroForm() {
  return (
    <div className="anim-fade">
      <h2 className="mt-4 font-serif text-4xl leading-[1.05] text-ink md:text-[42px]">
        Abre tu ficha.
      </h2>
      <p className="mt-3 font-body italic text-[15px] text-[#6B635A]">
        Cada admisión se archiva a mano, una sola vez.
      </p>

      <Field n="01" label="Nombre completo" type="text" placeholder="Nombre y apellido" />
      <Field n="02" label="Correo de contacto" type="email" placeholder="tu@correo.com" />
      <Field n="03" label="Firma / contraseña" type="password" placeholder="········" />

      <label className="mt-8 flex items-start gap-3 font-body text-[13px] leading-snug text-[#4A4030]">
        <input type="checkbox" className="mt-0.5 accent-ink" />
        <span>Doy fe de que cada pieza acordada aquí es única — sin réplicas, sin copias.</span>
      </label>

      <button className="mt-8 bg-ink px-7 py-3.5 font-mono text-[11px] tracking-[0.24em] uppercase text-paper transition-opacity hover:opacity-85">
        Sellar admisión
      </button>
    </div>
  );
}
