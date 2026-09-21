---
name: supabase-migracion
description: Cómo escribir, aplicar y verificar una migración de Supabase en ink·sai (políticas RLS, funciones SECURITY DEFINER, triggers). Usar siempre que haya que tocar la base de datos.
---

# Migraciones de Supabase en ink·sai

Proyecto `inksai`, ref `onlzelnzskqzevchnxoh`. Tablas en `public`: `usuarios`, `services`, `booking`. Todas con RLS.

## Antes de escribir

1. `list_tables` para ver el estado real — **no confiar en `schema.prisma`**, es un espejo desactualizado.
2. `select * from pg_policies where schemaname='public'` para ver las políticas vigentes.
3. Verificar que la migración no exista ya: `list_migrations`.

## Reglas para funciones

```sql
create or replace function public.mi_funcion()
returns ... language ... stable|volatile
security definer
set search_path = public, pg_temp   -- OBLIGATORIO en SECURITY DEFINER
as $$ ... $$;
```

- **`set search_path = public, pg_temp` siempre** en `SECURITY DEFINER`. Sin esto es vector de escalada de privilegios y el advisor lo marca.
- Si es una función-trigger, **revocar `EXECUTE`** para que no quede en `/rest/v1/rpc/`:
  ```sql
  revoke execute on function public.mi_trigger_fn() from public, anon, authenticated;
  ```
  Los triggers siguen funcionando (Postgres verifica el privilegio al crear el trigger, no al dispararlo).
- Si la función la usan las políticas RLS (como `es_admin()`), el rol que consulta **sí** necesita `EXECUTE`. Revocar solo a `anon` si no aplica.
- Usar `(select auth.uid())` en subselect, no `auth.uid()` a secas: Postgres lo evalúa una vez por query en vez de por fila.

## Reglas para políticas

- **Nunca** una política sobre tabla X que haga `SELECT ... FROM X` dentro de su `USING` → recursión infinita (`42P17`). Fue el bug original de `admin gestiona usuarios`. Se resuelve con una función `SECURITY DEFINER` que lea la tabla sin RLS.
- Declarar `to authenticated` o `to anon` explícito, no `to public`. Si una política `to public` llama a una función a la que `anon` no tiene `EXECUTE`, **cualquier query anónima revienta** con "permission denied for function".
- `UPDATE` siempre con `WITH CHECK` explícito, no depender del fallback.
- Las políticas de admin usan `public.es_admin()`.

## Reglas para triggers sobre auth.users

- Van con `EXCEPTION WHEN OTHERS` + `RAISE WARNING` si no deben romper el signup. Decisión tomada: el registro nunca falla; los huérfanos se auditan aparte.
- Nunca leer `rol` de `raw_user_meta_data`. Esa metadata la manda el cliente.

## Aplicar

`apply_migration` con un `name` en snake_case descriptivo. Una migración por cambio lógico, no una gigante.

## Verificar (obligatorio)

1. **Recursión y permisos**, simulando un usuario autenticado:
   ```sql
   select set_config('role','authenticated',true),
          set_config('request.jwt.claims','{"sub":"<uuid>","role":"authenticated"}',true);
   select count(*) from public.usuarios;   -- sin 42P17
   ```
2. **Acceso anónimo** a lo que debe ser público:
   ```sql
   select set_config('role','anon',true), set_config('request.jwt.claims','{"role":"anon"}',true);
   select count(*) from public.services;   -- sin "permission denied"
   ```
3. `get_advisors` tipo `security`: solo debe quedar el warning intencional de `es_admin`.
4. Si toca `auth.users`, auditar huérfanos:
   ```sql
   select u.id, u.email from auth.users u
   left join public.usuarios p on p.id = u.id where p.id is null;
   ```

## Después

- Registrar la migración en la tarea de Jira con su nombre.
- Si cambia el esquema, regenerar tipos (KAN-83) y actualizar `types.ts`.
