# Verificación de migraciones

Consultas a correr **después** de aplicar una migración, antes de darla por buena.
Todas son de solo lectura. Ver la skill `supabase-migracion`.

## 20260926000001 + 000002 — huecos y reservas

**Aplicadas y verificadas el 2026-09-26.** Todas las pruebas de abajo pasaron.

### 1. Un anónimo ve la disponibilidad, pero no quién reservó

```sql
begin;
  select set_config('role', 'anon', true),
         set_config('request.jwt.claims', '{"role":"anon"}', true);

  select count(*) as huecos_visibles   from public.huecos;        -- sin error
  select count(*) as libres_visibles   from public.huecos_libres; -- sin error
  select count(*) as reservas_visibles from public.booking;       -- debe dar 0
rollback;
```

`libres_visibles` tiene que **excluir** los huecos ya tomados, y `reservas_visibles`
dar 0. Verificado: con un hueco reservado de dos futuros, el anónimo vio 1 libre y
0 reservas.

### 1b. La columna derivada sigue a la reserva

El estado `huecos.tomado` lo mantiene un trigger. Cinco transiciones a comprobar
tras cualquier cambio en ese trigger:

| Acción sobre la reserva | `huecos_libres` |
|---|---|
| Hueco recién creado | aparece |
| Se reserva | desaparece |
| Se cancela | vuelve a aparecer |
| Se reactiva a pendiente | desaparece |
| Se borra la reserva | vuelve a aparecer |

### 2. Un hueco admite una sola reserva viva

```sql
begin;
  -- tomar un hueco libre y un cliente cualquiera
  insert into public.booking (cliente_id, service_id, fecha, hora, hueco_id)
  select u.id, s.id, h.fecha, h.hora, h.id
  from public.huecos_libres h, public.usuarios u, public.services s
  limit 1;

  -- la segunda debe fallar con 23505
  insert into public.booking (cliente_id, service_id, fecha, hora, hueco_id)
  select u.id, s.id, h.fecha, h.hora, h.id
  from public.huecos h, public.usuarios u, public.services s
  where h.id = (select hueco_id from public.booking order by created_at desc limit 1)
  limit 1;
rollback;
```

Se espera `duplicate key value violates unique constraint "booking_hueco_unico"`.

### 3. Rechazar libera el hueco (D8)

```sql
begin;
  -- con una reserva viva, el hueco no aparece
  select count(*) from public.huecos_libres where id = '<hueco_id>';  -- 0

  update public.booking set estado = 'cancelado' where hueco_id = '<hueco_id>';

  -- al cancelar, vuelve solo
  select count(*) from public.huecos_libres where id = '<hueco_id>';  -- 1
rollback;
```

### 4. No se puede borrar un hueco reservado (B8)

```sql
begin;
  delete from public.huecos where id = '<hueco con reserva>';
rollback;
```

Se espera `violates foreign key constraint` por el `on delete restrict`.

### 5. Menores de 18 rechazados (D13)

```sql
begin;
  update public.usuarios
  set fecha_nacimiento = current_date - interval '17 years'
  where id = (select id from public.usuarios limit 1);
rollback;
```

Se espera `Debes ser mayor de 18 años para registrarte`.

### 6. Advisors

`get_advisors` tipo `security`. Tras estas migraciones quedan dos warnings, ambos
conocidos y ninguno nuevo:

- `authenticated_security_definer_function_executable` sobre `es_admin` — intencional,
  las políticas RLS la necesitan.
- `auth_leaked_password_protection` — pendiente de activar en el dashboard (KAN-14).

**No debe aparecer `security_definer_view`.** Si vuelve, alguien recreó `huecos_libres`
leyendo `booking`: hay que volver a derivarlo por `huecos.tomado`.

## 20260930000001 — bloqueos

**Aplicada y verificada el 2026-09-30.** Todas las pruebas de abajo pasaron.

### 1. Un anónimo ve los bloqueos

```sql
begin;
  select set_config('role', 'anon', true),
         set_config('request.jwt.claims', '{"role":"anon"}', true);

  select count(*) as bloqueos_visibles from public.bloqueos;  -- sin error
rollback;
```

### 2. Solo un admin puede bloquear

```sql
begin;
  select set_config('role', 'authenticated', true),
         set_config('request.jwt.claims', '{"sub":"<admin_id>","role":"authenticated"}', true);

  insert into public.bloqueos (fecha, hora_inicio, hora_fin, motivo)
  values ('2026-10-15', '09:00', '14:00', 'Prueba');  -- funciona
rollback;

begin;
  select set_config('role', 'authenticated', true),
         set_config('request.jwt.claims', '{"sub":"<cliente_id>","role":"authenticated"}', true);

  insert into public.bloqueos (fecha, hora_inicio, hora_fin)
  values ('2026-10-16', '09:00', '14:00');  -- 42501, rechazado
rollback;
```

### 3. Rango inválido rechazado

```sql
begin;
  insert into public.bloqueos (fecha, hora_inicio, hora_fin)
  values ('2026-10-17', '14:00', '09:00');  -- 23514, check constraint
rollback;
```

### 4. Advisors

Sin cambios respecto a la sección anterior: los mismos dos warnings conocidos,
ninguno nuevo introducido por `bloqueos`.
