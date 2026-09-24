# 0001 — Agendar una sesión

**Estado:** borrador con decisiones pendientes · **Epic:** KAN-7 · **Última revisión:** 2026-09-23

---

## 1. Objetivo

Que un cliente pueda reservar una sesión con el artista desde el sitio, sin pasar por Instagram ni WhatsApp, y que el artista reciba esa solicitud con toda la información que necesita para aceptarla.

Hoy `/agendar` es un placeholder. Todo el valor del producto está detrás de esta feature.

## 2. Actores

| Actor | Puede |
|---|---|
| **Visitante** (sin sesión) | Ver el catálogo de servicios y explorar la disponibilidad. No puede reservar |
| **Cliente** (`rol = 'cliente'`) | Todo lo anterior, más crear una reserva a su nombre |
| **Admin** (`rol = 'admin'`) | Confirmar, cancelar y ver todas las reservas (fuera del alcance de esta spec, ver `0002-panel-admin`) |

## 3. Decisiones tomadas

| # | Decisión | Cuándo |
|---|---|---|
| D1 | `/agendar` es **pública**. El login se pide solo al confirmar la reserva, para no perder al visitante que está evaluando | sept 2026 |
| D2 | El registro exige **confirmación por correo**. Un cliente nuevo no puede completar la reserva en la misma sesión sin pasar por su bandeja | sept 2026 |
| D3 | Una reserva nace con `estado = 'pendiente'` | implícito en el esquema |
| D4 | El catálogo lo lee cualquiera, pero solo los servicios con `activo = true` | política RLS vigente |

## 4. Decisiones pendientes

Esto es lo que bloquea la implementación. Cada una necesita respuesta del artista.

> **[NECESITA DECISIÓN 1] — Catálogo de servicios**
> La tabla `services` está vacía. ¿Qué tipos de sesión ofrece, con qué duración y precio?
> Ejemplos de estructura: consulta (30 min), boceto, sesión corta (2 h), sesión larga (4 h), retoque.
> ¿El precio es fijo o "desde"? Un tatuaje suele cotizarse por pieza, no por hora.
> **Bloquea:** §6 paso 1, §8 criterio 1. **Ticket:** KAN-19.

> **[NECESITA DECISIÓN 2] — Modelo de disponibilidad**
> El esquema tiene `fecha` y `hora`, pero nada que diga qué horas están libres. Sin esto el formulario acepta cualquier fecha y el artista rechaza a mano.
> - **a)** Horario semanal fijo + bloqueos puntuales (vacaciones, días libres). Los slots se calculan: horario − bloqueos − reservas.
> - **b)** El artista abre huecos manualmente; solo se puede reservar en los huecos abiertos.
> - **c)** Sin disponibilidad: el cliente propone fecha/hora y el artista acepta o contrapropone.
> Preguntas: ¿qué días y horario atiende? ¿cuántas sesiones por día como máximo? ¿deja tiempo entre sesiones?
> **Bloquea:** §6 pasos 2–3, §7 casos B1–B3, §8 criterios 2–4. **Ticket:** KAN-46.

> **[NECESITA DECISIÓN 3] — Confirmación: automática o manual**
> ¿Una reserva en un slot libre queda **confirmada al instante**, o queda **pendiente** hasta que el artista la apruebe?
> Manual da control al artista pero introduce espera; automática convierte mejor pero lo compromete.
> **Bloquea:** §6 paso 5, §9 (qué dice la pantalla de éxito). **Ticket:** KAN-20.

> **[NECESITA DECISIÓN 4] — Seña**
> ¿Se cobra algo para confirmar?
> - **a)** No. Simple, más no-shows.
> - **b)** Transferencia + comprobante que sube el cliente; el admin confirma al verlo. Sin integración, pero manual.
> - **c)** Pago en línea (Mercado Pago / Webpay). Confirmación automática, requiere backend y webhook — fuerza la decisión de KAN-25.
> **Bloquea:** §6 paso 5, §8 criterio 6. **Ticket:** KAN-49.

> **[NECESITA DECISIÓN 5] — Cancelación y reprogramación**
> ¿Hasta cuántas horas antes se puede cancelar sin costo? ¿Se puede reprogramar, cuántas veces? ¿Qué pasa con la seña si cancela tarde o no aparece? ¿Y si cancela el estudio?
> **Bloquea:** §7 caso B5, y las specs `0003-mis-reservas`. **Ticket:** KAN-79.

> **[NECESITA DECISIÓN 6] — Imagen de referencia**
> ¿El cliente puede (o debe) adjuntar una foto de referencia? Para un tatuaje suele ser lo primero que se manda.
> ¿Obligatoria para algunos servicios (tatuaje) y opcional para otros (visita al estudio)?
> **Bloquea:** §6 paso 4. **Ticket:** KAN-48.

> **[NECESITA DECISIÓN 7] — Menores de edad**
> ¿Se atiende a menores con autorización, o hay edad mínima? Cambia si el formulario pide fecha de nacimiento y si el registro debe advertirlo.
> **Bloquea:** §7 caso B6. **Ticket:** KAN-78.

## 5. Restricciones conocidas

Vienen del esquema y las políticas ya aplicadas en Supabase. El detalle técnico va en `plan.md`.

- `booking` guarda `cliente_id`, `service_id`, `fecha`, `hora`, `estado`, `comentario`.
- `estado` solo admite `pendiente`, `confirmado`, `cancelado`.
- RLS: un cliente solo puede insertar reservas con `cliente_id = auth.uid()`, y solo ve las suyas. **Un visitante sin sesión no puede insertar nada** — de ahí D1.
- Las horas hoy son `time without time zone`: funcionan mientras artista y clientes estén en la misma ciudad. Ver KAN-52.

## 6. Flujo principal

1. El visitante entra a `/agendar` y ve el catálogo de servicios activos con su duración y precio. *(Bloqueado por D1)*
2. Elige un servicio. *(Bloqueado por D2: qué días se muestran disponibles)*
3. Elige fecha y hora entre los slots libres para ese servicio. *(Bloqueado por D2)*
4. Escribe un comentario opcional describiendo la idea, y adjunta una referencia. *(Bloqueado por D6)*
5. Confirma.
   - **Si no tiene sesión:** se abre el modal de registro/login. Al volver, **el borrador sigue ahí** (KAN-51). Si es cuenta nueva, tiene que confirmar el correo antes de poder completar — el borrador debe sobrevivir a que cierre la pestaña.
   - **Si tiene sesión:** se crea la reserva. *(Bloqueado por D3 y D4: en qué estado queda y si hay que pagar)*
6. Ve una pantalla de confirmación con el resumen y qué pasa ahora (KAN-53), y recibe un correo (KAN-64).

## 7. Casos borde

| | Situación | Comportamiento esperado |
|---|---|---|
| B1 | Dos clientes reservan el mismo slot en el mismo instante | Solo uno lo obtiene. El otro ve "ese horario acaba de ocuparse, elige otro" — no un error genérico. Debe garantizarse en la base de datos, no solo en la UI (KAN-47) |
| B2 | El slot se ocupa mientras el cliente llenaba el formulario | Igual que B1, al confirmar |
| B3 | No hay ningún horario disponible en el mes | Estado vacío explícito con un canal alternativo (WhatsApp), no un calendario en blanco |
| B4 | El cliente abandona tras el registro y vuelve al día siguiente | El borrador se recupera o se descarta limpiamente. Definir vigencia (¿24 h?) |
| B5 | El cliente quiere cancelar o cambiar la fecha | *(Bloqueado por D5)* |
| B6 | Un menor intenta reservar | *(Bloqueado por D7)* |
| B7 | El servicio elegido se desactiva entre que lo eligió y confirma | Avisar y pedir que elija otro |

## 8. Criterios de aceptación

Verificables. Los marcados con 🔒 dependen de decisiones pendientes.

1. 🔒 Un visitante sin sesión ve el catálogo completo de servicios activos con nombre, duración y precio.
2. 🔒 Dado un servicio de 120 min, horario 10:00–18:00 y una reserva existente a las 14:00, el cliente ve exactamente los slots 10:00, 12:00 y 16:00.
3. 🔒 Un día bloqueado por el artista no ofrece ningún slot y se ve claramente como no disponible.
4. 🔒 No se puede seleccionar una fecha pasada ni el mismo día con menos de X horas de antelación.
5. Un visitante que confirma sin sesión ve el modal de login y, al autenticarse, vuelve al formulario **con servicio, fecha, hora y comentario intactos**.
6. 🔒 Al crear la reserva, queda en la base con `cliente_id = auth.uid()` y el estado que corresponda.
7. Dos peticiones simultáneas al mismo slot resultan en exactamente una fila en `booking`; la segunda recibe un mensaje claro.
8. Tras reservar, el cliente ve el resumen y la reserva aparece en `/mis-reservas`.

## 9. Fuera de alcance

- Gestión de la reserva por parte del artista → `0002-panel-admin` (KAN-22, KAN-54, KAN-55).
- Ver y cancelar reservas propias → `0003-mis-reservas` (KAN-21, KAN-58).
- Correos y recordatorios → Epic KAN-43.
- Cotización o presupuesto del tatuaje. Esta feature agenda una cita, no cierra un precio de la pieza.

## 10. Tickets

KAN-19 · KAN-20 · KAN-46 · KAN-47 · KAN-48 · KAN-49 · KAN-50 · KAN-51 · KAN-52 · KAN-53
