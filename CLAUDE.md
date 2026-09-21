# ink·sai

Sitio y sistema de reservas de un estudio de tatuajes. Landing pública (galería, artista, contacto) + flujo de clientes (registro, agendar, mis reservas) + panel admin. Español en UI, código y commits.

## Estructura

Monorepo con npm workspaces. **La raíz es este directorio**; los comandos van desde aquí.

```
frontend/   React 18 + Vite 5 + TypeScript + Tailwind 3 + react-router-dom 7
backend/    Express + Prisma — solo GET /health. Su rol está por decidir (KAN-25)
.claude/    launch.json, skills/, agents/ — compartidos con el equipo
```

Supabase es la base de datos y la autenticación. Proyecto `inksai`, ref `onlzelnzskqzevchnxoh`, región `us-east-2`. El frontend habla directo con Supabase; la autorización la hace RLS, no Express.

## Comandos

```bash
npm run dev:frontend        # Vite en http://localhost:3000  (3000, NO 5173)
npm run build:frontend      # tsc -b && vite build — es el typecheck; correrlo antes de commitear
npm install <pkg> --workspace frontend
```

`launch.json` ya tiene el server `frontend` configurado para el panel de navegador.

## Reglas que rompen cosas si se ignoran

**TypeScript**: `strict` + `noUnusedLocals` + `noUnusedParameters`. Un import sin usar o un `catch (e)` sin usar `e` **rompe el build**. Sin ESLint todavía (KAN-81).

**Supabase — migraciones**: funciones, triggers y políticas RLS **no se versionan con Prisma** y `prisma db pull` no las trae. Hoy viven solo en Supabase (`list_migrations`). **No usar `prisma migrate`** contra esta base: intentaría "corregir" la deriva y rompería las políticas. Está pendiente pasar a `supabase/migrations/` (KAN-82). Cómo escribir una migración segura: skill `supabase-migracion`.

**Supabase — auth**:
- El `rol` de un usuario **nunca** se lee de `raw_user_meta_data` ni de nada que controle el cliente. Lo fija el trigger `handle_new_user` a `'cliente'` y solo un admin lo cambia (trigger `proteger_rol`).
- **Nada async de Supabase dentro del callback de `onAuthStateChange`**: el cliente mantiene un lock y un `await supabase.from(...)` ahí dentro deadlockea. El perfil se resuelve en un efecto aparte (`AuthContext.tsx`).
- `es_admin()` es `SECURITY DEFINER`; es intencional que `authenticated` pueda ejecutarla. Las funciones-trigger tienen `EXECUTE` revocado.
- Registro con confirmación por correo. Tras `signUp()` **no hay sesión** hasta confirmar.

**Header**: usa `mix-blend-difference` sobre el hero y pasa a fondo sólido al hacer scroll. Cualquier overlay (modal, lightbox) va por `createPortal` a `document.body` con `z-[300]+`, o el blend lo vuelve ilegible.

**Estética**: paleta `paper` / `ink` / `dim`, **sin rojo** — los errores se marcan con una barra de tinta (`border-l-2 border-ink pl-3`). Detalle completo en la skill `estetica-paper-ink`.

## Flujo de trabajo

- Ramas `feature/*` o `fix/*` → PR contra `develop` → merge. `main` es producción.
- Cada tarea tiene ticket en Jira ([proyecto KAN](https://igntatto.atlassian.net/jira/software/projects/KAN/boards/1)), agrupado por Epic = módulo. Convenciones en la skill `jira-tarea`.
- Equipo: José (jovergaraa) y Bastian Orellana. **Antes de tomar una tarea de galería o UI, revisar si Bastian ya la hizo** — ya pasó una vez (PR #4).
- Commits en español, imperativo, sin tilde en el título por compatibilidad. Cuerpo explica el *por qué*.

## Estado (sept 2026)

Hecho: landing, galería con imágenes reales, login/registro completo, RLS correcto.
Sin hacer: `/agendar`, `/mis-reservas`, `/admin` son placeholders. `services` está vacía. No hay disponibilidad horaria modelada (KAN-46, bloqueante). No hay deploy.

## Archivos que no se tocan a la ligera

- `frontend/src/context/AuthContext.tsx` — el orden de los efectos y el cálculo de `loading` evitan bugs sutiles; leer los comentarios antes de cambiar.
- `backend/prisma/schema.prisma` — es un espejo generado, no la fuente de verdad.
- `frontend/.env.local` y `backend/.env` — ignorados por git; las plantillas son `.env.example`.
