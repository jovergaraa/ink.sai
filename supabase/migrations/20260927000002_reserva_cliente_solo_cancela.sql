-- La politica "cliente actualiza su reserva" permite cualquier UPDATE sobre
-- la fila propia: no restringe columnas ni valores. Un cliente podia correr
--
--   update booking set estado = 'confirmado' where id = <la suya>
--
-- y aprobarse la reserva solo, saltandose al artista (D6). Tambien podia
-- moverse de fecha, hora o hueco sin que nadie lo supiera.
--
-- Comprobado contra la base antes de escribir esto: la reserva quedo en
-- 'confirmado' desde una sesion de cliente comun.
--
-- RLS no sabe de columnas, asi que el limite va en un trigger. Se eligio
-- trigger y no `grant update (estado)` para no amarrarle las manos al admin,
-- que mas adelante va a necesitar mover fecha y hora al reprogramar (D11).
--
-- El cliente solo puede cancelar. Nada mas de la fila puede cambiar.

create or replace function public.proteger_reserva()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  -- Sin JWT no hay request de PostgREST: es el service_role o una consulta
  -- directa contra la base. Esos contextos ya son de confianza.
  if auth.uid() is null or public.es_admin() then
    return new;
  end if;

  if new.estado is distinct from 'cancelado' then
    raise exception 'Solo el estudio puede cambiar el estado de una reserva'
      using errcode = '42501';
  end if;

  if new.cliente_id      is distinct from old.cliente_id
     or new.service_id      is distinct from old.service_id
     or new.hueco_id        is distinct from old.hueco_id
     or new.fecha           is distinct from old.fecha
     or new.hora            is distinct from old.hora
     or new.referencia_path is distinct from old.referencia_path
     or new.comentario      is distinct from old.comentario
     or new.created_at      is distinct from old.created_at then
    raise exception 'Una reserva solo se puede cancelar, no modificar'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

-- Las funciones-trigger no las ejecuta nadie a mano.
revoke execute on function public.proteger_reserva() from public, anon, authenticated;

drop trigger if exists proteger_reserva on public.booking;
create trigger proteger_reserva
  before update on public.booking
  for each row
  execute function public.proteger_reserva();
