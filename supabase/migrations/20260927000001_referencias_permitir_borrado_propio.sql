-- Faltaba la politica de DELETE sobre el bucket referencias.
--
-- Sin ella, cuando la reserva falla despues de subir la imagen -- el caso
-- tipico es que otro cliente tomara el hueco primero (B1) -- el
-- storage.remove() del frontend no borra nada y no devuelve un error
-- visible, asi que la imagen queda huerfana en el bucket para siempre.
--
-- Se detecto probando la colision de dos clientes sobre el mismo hueco: la
-- reserva se rechazo correctamente con 23505, pero la imagen quedo.

drop policy if exists "cliente borra su referencia" on storage.objects;
create policy "cliente borra su referencia" on storage.objects
  as permissive for delete to authenticated
  using (
    bucket_id = 'referencias'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
