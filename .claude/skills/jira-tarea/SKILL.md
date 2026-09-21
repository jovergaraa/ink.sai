---
name: jira-tarea
description: Convenciones para crear, mover y cerrar tareas en el Jira de ink·sai (proyecto KAN). Usar al registrar trabajo nuevo, actualizar estado o cerrar tareas.
---

# Jira — proyecto KAN

El `cloudId` se obtiene con `getAccessibleAtlassianResources` (un solo sitio). Tablero Kanban. Tipos: **Epic**, **Historia**, **Tarea**, **Subtarea**.

## Estructura: una Epic por módulo

Toda tarea va bajo una Epic (campo `parent`). Nunca crear tareas sueltas.

| Epic | Módulo | Color |
|---|---|---|
| KAN-5 | Login y registro | morado |
| KAN-40 | Panel admin | morado oscuro |
| KAN-7 | Agendar | verde |
| KAN-39 | Mis reservas | verde oscuro |
| KAN-6 | Galería | teal |
| KAN-36 | Navegación y header | azul |
| KAN-37 | Sobre el artista | amarillo |
| KAN-38 | Contacto | naranja |
| KAN-8 | Infraestructura y tooling | gris |
| KAN-42 | Despliegue y producción | azul oscuro |
| KAN-43 | Notificaciones | naranja oscuro |
| KAN-44 | Legal y políticas del estudio | gris oscuro |
| KAN-45 | SEO, rendimiento y accesibilidad | teal oscuro |

Si hace falta una Epic nueva, ponerle color con `customfield_10017` (valores: `purple`, `blue`, `green`, `teal`, `yellow`, `orange`, `grey` y sus variantes `dark_*`).

## Antes de crear

`searchJiraIssuesUsingJql` con `project = KAN AND summary ~ "<palabra clave>"` para no duplicar. Ya pasó que se crearon tareas para trabajo que Bastian tenía hecho.

## Tipo

- **Historia** — funcionalidad de cara al usuario. Título: "Como cliente/admin, quiero …".
- **Tarea** — técnica, de configuración, o decisión de negocio. Título en imperativo: "Configurar…", "Decidir…", "Resolver…".
- **Subtarea** — solo para partir una Tarea grande ya en curso.

## Descripción (markdown)

1. **Contexto**: qué pasa hoy y por qué importa. Una o dos frases; si es un bug, cómo se reproduce.
2. **Hacer**: lista concreta. Con nombres de archivos, columnas, funciones.
3. **Depende de / Bloquea a**: referencias `KAN-NN` explícitas.
4. Si es decisión de negocio: opciones con pros/contras y qué se necesita del artista.

Todo en español. Código y rutas en backticks.

## Estados (transiciones)

| Estado | id | Cuándo |
|---|---|---|
| Por hacer | `11` | por defecto |
| En curso | `21` | alguien la tomó, o está hecha en local sin commitear |
| En revisión | `31` | en un PR abierto |
| Finalizado | `41` | mergeado, o aplicado en Supabase/dashboard |

**El estado refleja la realidad, no la intención.** Código hecho pero sin PR = En curso. PR abierto = En revisión. Solo Finalizado cuando está en `develop` o vivo en Supabase.

Se puede pasar `transition: {id}` al crear.

## Al cerrar una tarea

- Comentario corto con **qué se hizo y dónde**: PR, commit, nombre de migración. Si la hizo otra persona, decirlo.
- Si la resolvió parcialmente un cambio ajeno, **no cerrar**: comentar qué queda y recortar el alcance en la descripción.

## No tocar

KAN-1 a KAN-4 son issues previas de José. Las tareas asignadas a Bastian no se mueven de estado sin hablar con él.
