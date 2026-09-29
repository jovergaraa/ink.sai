-- 0001-agendar · disponibilidad por huecos
--
-- Implementa las decisiones D5, D7, D8, D9, D12 y D13 de
-- specs/0001-agendar/spec.md. El artista publica huecos con duración; el
-- cliente toma uno donde quepa el servicio que eligió.

-- ---------------------------------------------------------------------------
-- 1. Huecos que publica el artista
-- ---------------------------------------------------------------------------

create table if not exists public.huecos (
  id               uuid primary key default gen_random_uuid(),
  fecha            date not null,
  hora             time not null,
  -- D7: el cliente solo ve los huecos donde su servicio cabe.
  duracion_minutos int  not null check (duracion_minutos > 0),
  nota             text,
  created_at       timestamptz default now()
);

create index if not exists huecos_fecha_idx on public.huecos (fecha, hora);

alter table public.huecos enable row level security;

-- /agendar es pública (D1): cualquiera ve la disponibilidad.
drop policy if exists "cualquiera ve huecos" on public.huecos;
create policy "cualquiera ve huecos" on public.huecos
  as permissive for select to anon, authenticated
  using (true);

drop policy if exists "admin gestiona huecos" on public.huecos;
create policy "admin gestiona huecos" on public.huecos
  as permissive for all to authenticated
  using (public.es_admin()) with check (public.es_admin());

-- ---------------------------------------------------------------------------
-- 2. La reserva ocupa un hueco
-- ---------------------------------------------------------------------------

alter table public.booking
  add column if not exists hueco_id uuid references public.huecos(id) on delete restrict;

alter table public.booking
  add column if not exists referencia_path text;

-- Un hueco admite como máximo una reserva viva. Este índice implementa tres
-- reglas de una vez:
--   D9  el primero que lo pide lo toma (ya hay fila viva)
--   D8  rechazar libera: el artista pasa la reserva a 'cancelado', el índice
--       deja de aplicar y el hueco vuelve solo a huecos_libres
--   B1  dos peticiones simultáneas: la segunda recibe 23505
create unique index if not exists booking_hueco_unico
  on public.booking (hueco_id)
  where estado <> 'cancelado';

-- ---------------------------------------------------------------------------
-- 3. Qué es un hueco disponible
-- ---------------------------------------------------------------------------

-- OJO: esta versión de la vista quedó SUPERADA por la migración
-- 20260926000002, que deriva el estado a huecos.tomado. Se conserva aquí tal
-- como se aplicó, por historial. No copiar este patrón.
create or replace view public.huecos_libres as
  select h.id, h.fecha, h.hora, h.duracion_minutos, h.nota
  from public.huecos h
  where h.fecha >= current_date
    and not exists (
      select 1
      from public.booking b
      where b.hueco_id = h.id
        and b.estado <> 'cancelado'
    );

grant select on public.huecos_libres to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. Solo mayores de 18 (D13)
-- ---------------------------------------------------------------------------

-- No puede ser un CHECK: current_date no es inmutable. Va como trigger, que
-- además solo evalúa al escribir, que es lo correcto — alguien que cumple
-- años después no debe quedar en infracción.
create or replace function public.validar_mayor_de_edad()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.fecha_nacimiento is not null
     and new.fecha_nacimiento > current_date - interval '18 years'
  then
    raise exception 'Debes ser mayor de 18 años para registrarte'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke execute on function public.validar_mayor_de_edad() from public, anon, authenticated;

drop trigger if exists usuarios_mayor_de_edad on public.usuarios;
create trigger usuarios_mayor_de_edad
  before insert or update of fecha_nacimiento on public.usuarios
  for each row execute function public.validar_mayor_de_edad();

-- ---------------------------------------------------------------------------
-- 5. Imágenes de referencia (D12, obligatoria)
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('referencias', 'referencias', false)
on conflict (id) do nothing;

-- El cliente escribe y lee solo dentro de su propia carpeta {user_id}/...
drop policy if exists "cliente sube su referencia" on storage.objects;
create policy "cliente sube su referencia" on storage.objects
  as permissive for insert to authenticated
  with check (
    bucket_id = 'referencias'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "cliente ve su referencia" on storage.objects;
create policy "cliente ve su referencia" on storage.objects
  as permissive for select to authenticated
  using (
    bucket_id = 'referencias'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "admin ve las referencias" on storage.objects;
create policy "admin ve las referencias" on storage.objects
  as permissive for select to authenticated
  using (bucket_id = 'referencias' and public.es_admin());
