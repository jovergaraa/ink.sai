# 0001 — Agendar una sesión

**Estado:** decisiones cerradas, listo para implementar · **Epic:** KAN-7 · **Última revisión:** 2026-09-26

---

## 1. Objetivo

Que un cliente pueda reservar una sesión con el artista desde el sitio, sin pasar por Instagram ni WhatsApp, y que el artista reciba esa solicitud con toda la información que necesita para aceptarla.

Hoy `/agendar` es un placeholder. Todo el valor del producto está detrás de esta feature.

## 2. Actores

| Actor | Puede |
|---|---|
| **Visitante** (sin sesión) | Ver el catálogo de servicios y los horarios disponibles. No puede reservar |
| **Cliente** (`rol = 'cliente'`) | Todo lo anterior, más solicitar una sesión a su nombre |
| **Admin** (el artista) | Publicar horarios, aprobar y rechazar solicitudes (ver `0002-panel-admin`) |

## 3. Decisiones tomadas

Las marcadas 2026-09-26 vienen del cuestionario respondido por Simón Vargas Cáceres (`specs/preguntas-cliente.docx`).

| # | Decisión | Cuándo |
|---|---|---|
| D1 | `/agendar` es **pública**. El login se pide solo al confirmar, para no perder al visitante que está evaluando | sept 2026 |
| D2 | El registro exige **confirmación por correo**. Un cliente nuevo no completa la reserva sin pasar por su bandeja | sept 2026 |
| D3 | Una reserva nace con `estado = 'pendiente'` | implícito en el esquema |
| D4 | El catálogo lo lee cualquiera, pero solo los servicios con `activo = true` | política RLS vigente |
| D5 | **La disponibilidad son huecos que abre el artista.** No hay horario semanal ni cálculo de slots: publica los huecos concretos en los que puede atender | 2026-09-23 |
| D6 | **La reserva la aprueba el artista.** Tomar un hueco no confirma nada | 2026-09-23 |
| D7 | **Cada hueco lleva una duración.** El artista abre huecos de distinto largo; el cliente elige un servicio y solo ve los huecos donde ese servicio cabe | 2026-09-26 |
| D8 | **Rechazar una solicitud libera el hueco automáticamente**: vuelve a la lista pública sin intervención del artista | 2026-09-26 |
| D9 | **El hueco se bloquea con la primera solicitud.** El primero que lo pide lo toma; los demás dejan de verlo mientras el artista decide | 2026-09-26 |
| D10 | **Seña de $10.000 por transferencia**, con comprobante. No hay pago en línea | 2026-09-26 |
| D11 | **Cancelación con 2 días de anticipación.** Con menos, o si no llega, pierde el abono. Puede reprogramar **una vez**. Si cancela el estudio, el cliente elige otra fecha o recupera el abono | 2026-09-26 |
| D12 | ~~La imagen de referencia es obligatoria al reservar~~ → **opcional por ahora.** Simón la había pedido obligatoria, pero exigirla antes de enviar corta a quien todavía no tiene una idea a mano. Se envía sin imagen y se coordina después; `booking.referencia_path` queda en null. **Revisar con Simón** si vuelve a ser obligatoria | 2026-09-26, revertida 2026-09-27 |
| D13 | **Solo mayores de 18.** No se atiende a menores ni con autorización | 2026-09-26 |
| D14 | **Catálogo inicial**: sesión corta (1–2 h, $30.000), media (3–4 h, $50.000), larga (5–6 h, $70.000), tatuaje pequeño hasta 5 cm (1 h, $30.000), retoque (gratis, garantía 2 meses). Precios **semifijos**: se muestran como "desde", varían por tamaño y dificultad | 2026-09-26 |

## 4. Decisiones pendientes

> **[NECESITA DECISIÓN 1] — Cuándo y cómo llega el comprobante de la seña**
> Simón dijo "por transferencia, el cliente me manda el comprobante", pero no si lo sube al sitio o se lo manda por WhatsApp. Y el orden importa:
> - **a)** El cliente reserva → sube el comprobante en el sitio → el artista aprueba viendo el pago.
> - **b)** El cliente reserva → el artista aprueba → recién entonces el cliente transfiere.
> - **c)** El comprobante va por WhatsApp, fuera del sitio. El sitio solo muestra los datos bancarios.
> La **a)** protege al artista de no-shows pero mete un paso más antes de tener respuesta. La **c)** es la más barata de construir.
> **Bloquea:** §6 paso 6, §8 criterio 7. **Ticket:** KAN-49.

## 5. Restricciones conocidas

Vienen del esquema y las políticas ya aplicadas en Supabase. El detalle técnico va en `plan.md`.

- `booking` guarda `cliente_id`, `service_id`, `fecha`, `hora`, `estado`, `comentario`.
- `estado` solo admite `pendiente`, `confirmado`, `cancelado`.
- RLS: un cliente solo puede insertar reservas con `cliente_id = auth.uid()`, y solo ve las suyas. **Un visitante sin sesión no puede insertar nada** — de ahí D1.
- Las horas son `time without time zone`. Artista y clientes están en Santiago; KAN-52 sigue abierta para cuando deje de ser cierto.
- `usuarios` ya guarda `fecha_nacimiento`, lo que permite aplicar D13 sin cambios de esquema.

## 6. Flujo principal

1. El visitante entra a `/agendar` y ve el catálogo de servicios activos con su duración y precio "desde".
2. Elige un servicio.
3. Ve los **huecos publicados donde ese servicio cabe** (D7): solo futuros, solo los que nadie haya tomado (D9). Agrupados por fecha.
4. Elige un hueco.
5. Puede subir una **imagen de referencia** (opcional, D12) y escribir un comentario opcional.
6. Confirma.
   - **Si no tiene sesión:** se abre el modal de registro/login. Al volver, **el borrador sigue ahí** (KAN-51). Si es cuenta nueva, tiene que confirmar el correo — el borrador debe sobrevivir a que cierre la pestaña.
   - **Si tiene sesión:** se crea la reserva tomando ese hueco, con `estado = 'pendiente'` (D6). *(El paso de la seña depende de la decisión 1)*
7. Ve una pantalla que deja claro que **el artista todavía tiene que aprobarla**, con las condiciones de cancelación (D11) y los datos para transferir la seña (D10).

## 7. Casos borde

| | Situación | Comportamiento esperado |
|---|---|---|
| B1 | Dos clientes toman el mismo hueco a la vez | Solo uno lo obtiene (D9). El otro ve "ese horario acaba de ocuparse, elige otro" — no un error genérico. Se garantiza en la base: un hueco admite como máximo una reserva viva (KAN-47) |
| B2 | El hueco se ocupa mientras el cliente llenaba el formulario | Igual que B1, al confirmar |
| B3 | El artista no tiene huecos abiertos, o ninguno donde quepa el servicio elegido | Estado vacío explícito, con el Instagram del estudio como alternativa. Si el problema es la duración, decirlo: "no hay horarios largos disponibles" |
| B4 | El cliente abandona tras el registro y vuelve al día siguiente | El borrador se recupera si el hueco sigue libre; si no, se avisa y se pide elegir otro. Vigencia 24 h |
| B5 | El artista rechaza la solicitud | El hueco vuelve solo a la lista pública (D8) y el cliente recibe aviso |
| B6 | Un menor de 18 intenta registrarse o reservar | Se bloquea en el registro, validando `fecha_nacimiento` (D13) |
| B7 | El servicio elegido se desactiva entre que lo eligió y confirma | Avisar y pedir que elija otro |
| B8 | El artista borra un hueco que ya tiene una solicitud pendiente | No se puede borrar sin más: avisar y obligarlo a rechazar la solicitud primero |

## 8. Criterios de aceptación

1. Un visitante sin sesión ve los cinco servicios activos con su duración y precio "desde".
2. Elegido "sesión larga" (5–6 h), la lista muestra **solo** huecos de 5 h o más; los de 1 h no aparecen.
3. Dados tres huecos que calzan —uno ayer, uno mañana a las 15:00 y uno ya solicitado— el cliente ve **solo** el de mañana a las 15:00.
4. Sin huecos que calcen, la página muestra el estado vacío con el enlace a Instagram, no una lista en blanco.
5. Se puede confirmar sin imagen de referencia: la reserva queda con `referencia_path` en null.
6. Un visitante que confirma sin sesión ve el modal de login y, al autenticarse, vuelve al formulario **con servicio, hueco, referencia y comentario intactos**.
7. Al crear la reserva, queda con `cliente_id = auth.uid()`, el hueco elegido y `estado = 'pendiente'`.
8. Dos peticiones simultáneas al mismo hueco resultan en exactamente una fila viva en `booking`; la segunda recibe un mensaje claro y el hueco desaparece de su lista.
9. La pantalla de éxito dice que falta la aprobación del artista, muestra la política de cancelación de 2 días y los datos para transferir los $10.000.
10. Si el artista rechaza la solicitud, el hueco vuelve a aparecer para otros clientes.

## 9. Fuera de alcance

- Publicar y gestionar huecos, aprobar y rechazar solicitudes → `0002-panel-admin` (KAN-22, KAN-54, KAN-55).
- Ver, cancelar y reprogramar reservas propias → `0003-mis-reservas` (KAN-21, KAN-58).
- Correos y avisos → Epic KAN-43. **Simón pidió los avisos por WhatsApp**, que requiere API de Meta o Twilio; se evalúa aparte.
- Cotización o presupuesto de la pieza. Esta feature agenda una cita, no cierra un precio.

## 10. Tickets

KAN-19 · KAN-20 · KAN-46 · KAN-47 · KAN-48 · KAN-49 · KAN-50 · KAN-51 · KAN-52 · KAN-53
