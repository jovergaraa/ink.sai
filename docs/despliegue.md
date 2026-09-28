# Despliegue — Cloudflare Pages

El sitio son archivos estáticos: `vite build` genera `frontend/dist/` y eso es
todo lo que se sirve. No hay servidor propio; la base, el login y las imágenes
los da Supabase directamente desde el navegador.

Se eligió **Cloudflare Pages** y no Vercel porque el plan Hobby de Vercel
**prohíbe el uso comercial**, y ink·sai cobra por sesiones y recibe señas. En
Cloudflare el uso comercial está permitido en el plan gratuito y el ancho de
banda no se mide.

## Configuración en el panel de Cloudflare

Workers & Pages → Create → Pages → Connect to Git → `jovergaraa/ink.sai`.

| Campo | Valor |
|---|---|
| Production branch | `develop` |
| Framework preset | None |
| Build command | `npm run build:frontend` |
| Build output directory | `frontend/dist` |
| Root directory | `/` (la raíz del repo) |

El repo es un monorepo con workspaces de npm, así que el build corre desde la
raíz aunque lo que se publique esté en `frontend/dist`. No configurar
`frontend/` como root directory: el `package.json` de ahí no conoce los
workspaces.

### Variables de entorno

En Settings → Environment variables, para Production y Preview:

| Variable | De dónde sale |
|---|---|
| `VITE_SUPABASE_URL` | Supabase → Project Settings → API |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase → Project Settings → API |
| `NODE_VERSION` | `22` |

Las dos primeras **son públicas por diseño**: viajan dentro del bundle y
cualquiera puede leerlas con las herramientas del navegador. La seguridad la
dan las políticas RLS, no la clave. La que nunca se pone acá es la
`service_role`.

`NODE_VERSION` hay que fijarla porque Cloudflare usa una versión antigua por
defecto y el build falla sin decir por qué.

## Después del primer deploy: Supabase

El sitio queda en `https://<proyecto>.pages.dev`. Antes de probar el login hay
que decirle a Supabase que esa URL es legítima, o la confirmación de correo
rebota:

Supabase → Authentication → URL Configuration

- **Site URL**: la URL de producción
- **Redirect URLs**: agregar la de producción y `http://localhost:3000` para
  seguir trabajando en local

Sin esto el registro parece funcionar, pero el enlace del correo lleva a otro
lado y el usuario queda sin sesión. (KAN-71)

## Dominio propio

Custom domains → Set up a domain. Si el dominio está en NIC Chile, apuntar los
nameservers a Cloudflare; desde ahí el certificado SSL es automático.

Al cambiar de dominio hay que **volver a la configuración de Supabase de
arriba** y reemplazar la URL de producción.

## Cosas que ya están resueltas en el repo

- **`frontend/public/_redirects`** — sirve `index.html` en cualquier ruta.
  Sin esto, entrar directo a `/agendar` o recargar estando ahí da 404, porque
  esas rutas las resuelve react-router en el navegador y no existen como
  archivo.
- **`frontend/public/_headers`** — cabeceras de seguridad básicas. A propósito
  **sin** `Content-Security-Policy`: el sitio habla con Supabase y con su
  bucket de imágenes, y una CSP mal armada rompe el login sin dejar rastro
  visible. Va en su propio ticket.

Vite copia `public/` tal cual a `dist/`, así que los dos archivos quedan en la
raíz del sitio publicado, que es donde Cloudflare los busca.

## Lo que este despliegue no resuelve

- **Supabase pausa el proyecto tras una semana sin actividad** en el plan
  gratuito. El sitio sigue cargando, pero el login y las reservas dejan de
  funcionar hasta despausarlo a mano. Es KAN-72.
- No hay CI: nada impide publicar un commit que no compila. Es KAN-81.
