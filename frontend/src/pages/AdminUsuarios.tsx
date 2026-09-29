import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import AdminLayout from '../components/AdminLayout';
import { useAuth } from '../context/AuthContext';
import type { Rol } from '../types';

interface UsuarioRow {
  id: string;
  nombre: string;
  correo: string;
  rol: Rol;
  created_at: string;
}

function fmtFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function AdminUsuarios() {
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState<UsuarioRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState('');
  const [cambiandoId, setCambiandoId] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;

    supabase
      .from('usuarios')
      .select('id, nombre, correo, rol, created_at')
      .order('created_at', { ascending: false })
      .then(({ data, error: err }) => {
        if (cancelado) return;
        if (err) {
          setError(true);
        } else {
          setUsuarios((data as UsuarioRow[]) ?? []);
        }
        setLoading(false);
      });

    return () => {
      cancelado = true;
    };
  }, []);

  async function toggleRol(u: UsuarioRow) {
    const nuevoRol: Rol = u.rol === 'admin' ? 'cliente' : 'admin';
    const anteriores = usuarios;
    setCambiandoId(u.id);
    setUsuarios((rows) => rows.map((r) => (r.id === u.id ? { ...r, rol: nuevoRol } : r)));

    const { error: err } = await supabase.from('usuarios').update({ rol: nuevoRol }).eq('id', u.id);
    if (err) setUsuarios(anteriores);
    setCambiandoId(null);
  }

  const q = query.trim().toLowerCase();
  const filas = usuarios.filter(
    (u) => !q || u.nombre.toLowerCase().includes(q) || u.correo.toLowerCase().includes(q)
  );

  return (
    <AdminLayout>
      <div className="flex flex-col md:flex-row md:justify-between md:items-baseline gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="font-mono text-[9.5px] tracking-[0.3em] uppercase text-dim">
            § Admin — Usuarios
          </span>
          <h1 className="font-serif text-[42px]">Usuarios</h1>
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre o correo"
          className="bg-transparent border-b border-ink/20 focus:border-ink outline-none font-mono text-[11px] py-2 md:w-[280px]"
        />
      </div>

      {error && (
        <p role="alert" className="font-mono text-[11px] leading-relaxed border-l-2 border-ink pl-3">
          No pudimos cargar los usuarios. Intenta recargar la página.
        </p>
      )}

      {loading && !error && (
        <div
          className="flex items-center justify-center h-40"
          style={{
            backgroundImage: 'repeating-linear-gradient(135deg, #E4DED2 0 1px, transparent 1px 15px)',
          }}
        >
          <p className="font-serif italic text-lg">Cargando usuarios…</p>
        </div>
      )}

      {!loading && !error && filas.length === 0 && (
        <div
          className="flex items-center justify-center h-40"
          style={{
            backgroundImage: 'repeating-linear-gradient(135deg, #E4DED2 0 1px, transparent 1px 15px)',
          }}
        >
          <p className="font-serif italic text-lg">Sin resultados para esa búsqueda.</p>
        </div>
      )}

      {!loading && !error && filas.length > 0 && (
        <div>
          <div className="hidden md:grid grid-cols-[1.6fr_1.8fr_1fr_1fr_1.2fr] gap-4 pb-3 border-b border-ink">
            <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-dim">Nombre</span>
            <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-dim">Correo</span>
            <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-dim">Registro</span>
            <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-dim">Rol</span>
            <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-dim">Acciones</span>
          </div>
          {filas.map((u) => (
            <div
              key={u.id}
              className="grid grid-cols-1 md:grid-cols-[1.6fr_1.8fr_1fr_1fr_1.2fr] gap-2 md:gap-4 py-4 border-b border-dim/30 md:items-center"
            >
              <span className="font-body text-[15px]">{u.nombre}</span>
              <span className="font-mono text-[11px] text-[#7A7268]">{u.correo}</span>
              <span className="font-mono text-[11px] text-[#7A7268]">{fmtFecha(u.created_at)}</span>
              <span
                className={`inline-block w-fit px-2.5 py-1 font-mono text-[9px] tracking-[0.18em] uppercase ${
                  u.rol === 'admin' ? 'bg-ink text-paper' : 'border border-dim text-dim'
                }`}
              >
                {u.rol === 'admin' ? 'Admin' : 'Cliente'}
              </span>
              <button
                onClick={() => toggleRol(u)}
                disabled={cambiandoId === u.id || u.id === user?.id}
                title={u.id === user?.id ? 'No puedes cambiar tu propio rol' : undefined}
                aria-label={u.id === user?.id ? 'No puedes cambiar tu propio rol' : undefined}
                className="w-fit font-mono text-[9.5px] tracking-[0.16em] uppercase border-b border-ink px-3 py-4 disabled:opacity-40"
              >
                {u.rol === 'admin' ? 'Quitar admin' : 'Promover a admin'}
              </button>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
