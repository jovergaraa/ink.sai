import type { ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

const TABS = [
  { to: '/admin', label: 'Reservas', end: true },
  { to: '/admin/horarios', label: 'Horarios' },
  { to: '/admin/servicios', label: 'Servicios' },
  { to: '/admin/usuarios', label: 'Usuarios' },
  { to: '/admin/opiniones', label: 'Opiniones' },
  { to: '/admin/fotos', label: 'Fotos' },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-paper text-ink font-body">
      <div className="flex gap-8 md:gap-10 px-6 md:px-14 h-[52px] items-center border-b border-dim/40 pt-24 overflow-x-auto">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `shrink-0 font-mono text-[10.5px] tracking-[0.24em] uppercase pb-[17px] -mb-px border-b-2 ${
                isActive ? 'text-ink border-ink' : 'text-dim border-transparent'
              }`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </div>
      {/* key={pathname}: fuerza el remount al cambiar de pestaña, para que
          la animación de aparición se dispare de nuevo en cada sección. */}
      <main key={pathname} className="px-6 md:px-14 py-10 flex flex-col gap-7 anim-fade">
        {children}
      </main>
    </div>
  );
}
