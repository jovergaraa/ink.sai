-- 0001-agendar · el estado "tomado" se deriva a una columna
--
-- La vista huecos_libres original preguntaba por booking para saber si un
-- hueco estaba ocupado. Eso obligaba a SECURITY DEFINER: con
-- security_invoker, un visitante anonimo no ve ninguna reserva (RLS de
-- booking las filtra) y todos los huecos apareceran libres.
--
-- El advisor de Supabase marca esas vistas como ERROR, y ahi esta el
-- problema real: invita a "arreglarlo" añadiendo security_invoker, lo que
-- rompe la disponibilidad sin que nada falle visiblemente.
--
-- Se deriva el estado a huecos.tomado, mantenido por un trigger. La vista
-- pasa a leer solo huecos, puede ser security_invoker, y el advisor queda
-- limpio. El indice unico parcial sobre booking sigue siendo la garantia
-- dura; esta columna es una proyeccion para consultar rapido.

alter table public.huecos add column if not exists tomado boolean not null default false;

create or replace function public.sincronizar_hueco_tomado()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  ids uuid[];
begin
  -- Un UPDATE puede mover la reserva de hueco (reprogramar, D11): hay que
  -- recalcular el de origen y el de destino.
  ids := array_remove(array[
    case when tg_op in ('UPDATE','DELETE') then old.hueco_id end,
    case when tg_op in ('INSERT','UPDATE') then new.hueco_id end
  ], null);

  -- AFTER trigger: la fila ya esta escrita, asi que el exists ve la verdad.
  update public.huecos h
  set tomado = exists (
    select 1 from public.booking b
    where b.hueco_id = h.id and b.estado <> 'cancelado'
  )
  where h.id = any(ids);

  return null;
end;
$$;

revoke execute on function public.sincronizar_hueco_tomado() from public, anon, authenticated;

drop trigger if exists booking_sincroniza_hueco on public.booking;
create trigger booking_sincroniza_hueco
  after insert or update or delete on public.booking
  for each row execute function public.sincronizar_hueco_tomado();

update public.huecos h
set tomado = exists (
  select 1 from public.booking b
  where b.hueco_id = h.id and b.estado <> 'cancelado'
);

drop view if exists public.huecos_libres;
create view public.huecos_libres
with (security_invoker = true) as
  select id, fecha, hora, duracion_minutos, nota
  from public.huecos
  where not tomado
    and fecha >= current_date;

grant select on public.huecos_libres to anon, authenticated;
