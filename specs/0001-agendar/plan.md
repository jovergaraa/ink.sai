# 0001 — Agendar · Plan técnico

Deriva de `spec.md`. Todas las decisiones de negocio están cerradas salvo cómo llega el comprobante de la seña, que solo afecta al último paso.

---

## 1. Modelo de datos

Una tabla nueva. El artista publica huecos con duración; el cliente toma uno donde quepa su servicio.

```sql
create table public.huecos (
  id                uuid primary key default gen_random_uuid(),
  fecha             date not null,
  hora              time not null,
  duracion_minutos  int  not null check (duracion_minutos > 0),
  nota              text,
  created_at        timestamptz default now()
);
```

`duracion_minutos` es lo que implementa D7: el cliente elige "sesión larga" (360 min) y solo ve huecos de 360 o más.

La reserva apunta al hueco que ocupa:

```sql
alter table public.booking
  add column hueco_id uuid references public.huecos(id) on delete restrict;
```

`on delete restrict` implementa B8: la base impide borrar un hueco con reserva. El artista tiene que rechazarla primero.

### Por qué así y no con horario semanal

D5 dice que el artista mantiene la agenda a mano. Con eso, `horario_semanal` + `bloqueos` + cálculo de slots sobra: tres piezas para derivar algo que el artista ya nos da explícito.

### Doble reserva y liberación (KAN-47, D8, D9)

```sql
create unique index booking_hueco_unico
  on public.booking (hueco_id)
  where estado <> 'cancelado';
```

Un hueco admite como máximo una reserva viva. Esto implementa las tres reglas de una vez:

- **D9** — la primera solicitud lo bloquea: ya existe una fila viva.
- **D8** — rechazar libera: el artista pasa la reserva a `cancelado`, el índice deja de aplicar y el hueco vuelve solo a `huecos_libres`. Sin trabajo extra.
- **B1** — dos peticiones simultáneas: la segunda recibe `23505` y el frontend traduce a "ese horario acaba de ocuparse".

**No hace falta el constraint de exclusión con `tstzrange` de KAN-47** — era para slots calculados, que ya no existen.

### Vista de huecos disponibles

```sql
create view public.huecos_libres as
  select h.*
  from public.huecos h
  where h.fecha >= current_date
    and not exists (
      select 1 from public.booking b
      where b.hueco_id = h.id and b.estado <> 'cancelado'
    );
```

Evita que el frontend reimplemente la regla y se desincronice del índice. El filtro por duración va en la consulta: `.gte('duracion_minutos', servicio.duracion_minutos)`.

### Archivos: referencia y comprobante

D12 hace la referencia obligatoria, así que hace falta Storage antes de poder reservar.

- Bucket **privado** `referencias`. El cliente sube a `{user_id}/…`; lee lo suyo; el admin lee todo.
- Columna `referencia_path text not null` en `booking`.
- Comprimir en el cliente (canvas → webp) antes de subir: una foto de celular son 8 MB.
- El comprobante de la seña espera a la decisión 1. Si se sube al sitio, mismo patrón con `comprobante_path`.

### RLS

| Tabla | Política |
|---|---|
| `huecos` | `select` para `anon` y `authenticated` (la página es pública, D1); `all` para admin vía `es_admin()` |
| `booking` | las vigentes; el `insert` ya exige `auth.uid() = cliente_id` |
| Storage `referencias` | insert/select del dueño por prefijo de carpeta; select para admin |

Aplicar con la skill `supabase-migracion`: `search_path` fijo, políticas `to authenticated` / `to anon` explícitas, y verificar como `anon` y como `authenticated` antes de darla por buena. Pasar el `auditor-supabase` antes de aplicar.

### Edad mínima (D13)

`usuarios.fecha_nacimiento` ya existe. Validar 18 años en el registro, en el cliente **y** con un check en base para que no se salte por API.

---

## 2. Frontend

| Archivo | Qué hace |
|---|---|
| `pages/Agendar.tsx` | Catálogo → huecos que calzan → referencia + comentario → confirmar |
| `pages/AdminHuecos.tsx` | CRUD de huecos para el artista |
| `types.ts` | `Servicio`, `Hueco` |

### `/agendar`

Cuatro pasos en un solo formulario:

1. **Servicio** — `services` con `activo = true`. Precio como "desde $30.000" (D14). Patrón de filas de `AdminServicios`. Estados: cargando, vacío, error.
2. **Hueco** — `huecos_libres` filtrado por `duracion_minutos >= servicio.duracion_minutos`, agrupado por fecha. Se recarga al cambiar de servicio. Vacío: mensaje que distingue "no hay horarios" de "no hay horarios de esa duración" (B3).
3. **Referencia y comentario** — imagen obligatoria con vista previa; textarea opcional.
4. **Confirmar** — sin sesión abre el `AuthModal` y guarda el borrador; con sesión sube la imagen e inserta la reserva.

**Borrador (KAN-51):** en `localStorage`, no `sessionStorage` — el correo de confirmación abre otra pestaña. Guarda `{servicioId, huecoId, comentario}` con marca de tiempo y 24 h de vigencia. El `File` de la imagen no se serializa: se mantiene en memoria y, si la pestaña se cerró, se le pide de nuevo. Al restaurar, si el hueco ya no está libre, se avisa y se pide otro (B4).

**Colisión:** capturar `23505`, mostrar el mensaje de B1 con la barra de tinta y refrescar la lista.

**Pantalla de éxito (KAN-53):** falta la aprobación del artista, política de 2 días, y los datos para transferir los $10.000.

### `/admin/huecos`

Sin huecos publicados no hay nada que probar. Mínimo: listar próximos, crear (fecha + hora + duración + nota), borrar. Marcar los tomados con quién y bloquear su borrado (B8). Reusa `AdminLayout` y el patrón de `AdminServicios`.

---

## 3. Orden de trabajo

1. Migración: `huecos`, FK, índice único, vista, RLS, bucket. Verificar con `auditor-supabase`.
2. `/admin/huecos`.
3. Cargar los cinco servicios de D14 y huecos de prueba.
4. `/agendar`: catálogo → huecos → referencia → confirmar.
5. Borrador y colisión.
6. Pantalla de éxito.

Revisar con `revisor-ui` antes del PR.

---

## 4. Qué cambia en los tickets

| Ticket | Cambio |
|---|---|
| KAN-46 | Se reduce a la tabla `huecos` con duración. Sin horario semanal ni bloqueos |
| KAN-47 | Lo resuelve el índice único parcial. El constraint de exclusión ya no aplica |
| KAN-48 | Confirmado y **obligatorio** (D12). Entra en el alcance de KAN-20 |
| KAN-49 | Se reduce a la decisión pendiente del comprobante |
| KAN-50 | Deja de ser un calendario: lista de huecos filtrada por duración |
| KAN-78 | Cerrada por D13: solo +18, validar en registro y en base |
| KAN-79 | Cerrada por D11 |
| Nuevo | `/admin/huecos` — publicar disponibilidad |

---

## 5. Fuera de alcance

Avisos por WhatsApp (Simón los pidió así; requiere API de Meta o Twilio y se evalúa aparte, KAN-43), y el paso de la seña mientras no se cierre la decisión 1.
