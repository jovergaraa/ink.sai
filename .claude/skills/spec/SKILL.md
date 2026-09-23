---
name: spec
description: Escribir la especificación de una feature de ink·sai antes de implementarla (spec-driven development). Usar cuando una feature tiene ambigüedad de negocio real, antes de partirla en tickets o tocar código.
---

# Especificar antes de implementar

La spec es la fuente de verdad del **comportamiento**; el código es su implementación. Se itera sobre la spec, no sobre el código.

## Cuándo usar esto

**Sí**, cuando hay ambigüedad de negocio: `/agendar`, panel admin, notificaciones, pagos. Señal clara: al leer el ticket tienes que preguntarle algo al artista.

**No**, cuando el comportamiento es obvio: header responsive, meta tags, anclas de sección, arreglar un enlace roto. Ahí el ticket de Jira ya basta y una spec es puro papeleo.

## Reparto de responsabilidades

Hay tres lugares y **ninguno repite al otro**:

| Dónde | Qué guarda |
|---|---|
| `CLAUDE.md` | Reglas permanentes del proyecto (no cambian por feature) |
| `specs/NNNN-slug/spec.md` | **Qué** hace la feature y **por qué**. Sin tecnología |
| `specs/NNNN-slug/plan.md` | **Cómo**: tablas, componentes, decisiones técnicas |
| Jira | **Estado**: quién la tiene, en qué va. Enlaza a la spec, no la copia |

El ticket dice "implementa §3.2 de `specs/0001-agendar/spec.md`". Si el comportamiento cambia, **el PR cambia la spec también**.

## Numeración

`specs/NNNN-slug/` correlativo desde `0001`. Slug corto en español: `0001-agendar`, `0002-panel-admin`.

## Estructura de spec.md

1. **Objetivo** — una o dos frases. Qué problema del negocio resuelve.
2. **Actores** — quién la usa y con qué permisos (visitante, cliente, admin).
3. **Decisiones tomadas** — lo ya acordado, con fecha y quién lo decidió.
4. **Decisiones pendientes** — lo más importante del documento. Ver abajo.
5. **Flujo principal** — paso a paso, en lenguaje de usuario.
6. **Casos borde** — qué pasa cuando algo sale mal o raro.
7. **Criterios de aceptación** — verificables, con datos concretos.
8. **Fuera de alcance** — lo que explícitamente NO hace, para que nadie lo asuma.
9. **Tickets** — los KAN que la implementan.

## La regla que hace que esto funcione

**Nunca inventes una decisión de negocio que no se ha tomado.** Márcala:

```markdown
> **[NECESITA DECISIÓN 3]** ¿Se cobra seña para confirmar?
> - **a)** Sin seña — reserva queda pendiente, el artista confirma a mano. Simple, más no-shows.
> - **b)** Transferencia + comprobante — sin integración, pero manual.
> - **c)** Pago en línea — confirmación automática, requiere backend (KAN-25).
> **Bloquea:** §5 paso 4, §7 criterio 6. **Ticket:** KAN-49.
```

Cada decisión pendiente lleva: opciones reales con su costo, qué parte de la spec bloquea, y el ticket. Así la conversación con el artista es una lista cerrada de preguntas, no un "cuéntame qué quieres".

Una spec con huecos marcados es útil. Una spec con huecos rellenados a ojo es peligrosa: alguien la implementa y hay que rehacerlo.

## Criterios de aceptación

Concretos y con datos, no genéricos. Mal: *"el cliente ve los horarios disponibles"*. Bien:

> Dado un servicio de 120 min, horario 10:00–18:00 y una reserva existente a las 14:00,
> cuando el cliente abre el selector para ese día,
> entonces ve exactamente los slots 10:00, 12:00 y 16:00.

Si un criterio no se puede verificar mirando la pantalla o corriendo una query, está mal escrito.

## Flujo de trabajo

1. Escribir `spec.md` con todo lo que se sabe y los huecos marcados.
2. **Llevar las decisiones pendientes al artista** y cerrarlas. Actualizar la spec con la fecha.
3. Escribir `plan.md`: esquema, migraciones, componentes. Aquí sí entra la tecnología y aplican las reglas de `CLAUDE.md` y la skill `supabase-migracion`.
4. Crear o actualizar los tickets en Jira enlazando a las secciones.
5. Implementar. Cada PR que cambie el comportamiento actualiza la spec en el mismo commit.

Mientras queden decisiones pendientes que bloqueen, **no se implementa esa parte** — se implementa lo que no dependa de ellas.
