import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!url) {
  throw new Error('Falta VITE_SUPABASE_URL. Copia frontend/.env.example a frontend/.env.local.');
}
if (!key) {
  throw new Error(
    'Falta VITE_SUPABASE_PUBLISHABLE_KEY. Copia frontend/.env.example a frontend/.env.local.'
  );
}

// Una sola instancia a nivel de módulo: crearla dentro de un componente
// deja dos clientes compitiendo por el mismo localStorage.
export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    // necesario para que el enlace de confirmación establezca la sesión
    detectSessionInUrl: true,
  },
});
