-- 0001-agendar · bloqueo manual de horas por el artista
--
-- El artista marca un rango de un día (o el día completo) como no
-- disponible — vacaciones, una reunión, lo que sea — sin tener que abrir
-- huecos ahí. Es independiente de `huecos`: no reemplaza ni transforma
-- huecos existentes, solo es información que /agendar (y el panel admin)
-- deben cruzar para no ofrecer ni dejar publicar en ese rango.
--
-- "Todo el día" se guarda como 00:00–23:59, no como un caso aparte: así el
-- resto del sistema (comparar rangos) no necesita una rama especial.

create table if not exists public.bloqueos (
  id          uuid primary key default gen_random_uuid(),
  fecha       date not null,
  hora_inicio time not null,
  hora_fin    time not null,
  motivo      text,
  created_at  timestamptz default now(),
  constraint bloqueos_rango_valido check (hora_fin > hora_inicio)
);

create index if not exists bloqueos_fecha_idx on public.bloqueos (fecha);

alter table public.bloqueos enable row level security;

-- /agendar es pública (D1, igual que huecos): cualquiera necesita saber qué
-- rangos están bloqueados para no ofrecerlos como disponibles.
drop policy if exists "cualquiera ve bloqueos" on public.bloqueos;
create policy "cualquiera ve bloqueos" on public.bloqueos
  as permissive for select to anon, authenticated
  using (true);

drop policy if exists "admin gestiona bloqueos" on public.bloqueos;
create policy "admin gestiona bloqueos" on public.bloqueos
  as permissive for all to authenticated
  using (public.es_admin()) with check (public.es_admin());
