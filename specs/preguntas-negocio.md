# Preguntas de negocio — reunión con el artista

Guion para la reunión. Las respuestas se anotan aquí mismo y desde aquí se actualizan las specs y los tickets.

**Fecha de la reunión:** ____________  ·  **Anotó:** ____________

Orden por impacto: el bloque 1 destraba el desarrollo, el 2 define las reglas del negocio, el 3 es contenido real para la web y el 4 es operación y lanzamiento.

---

## 1 · Agendamiento — bloquea el desarrollo

Ya está decidido que **el artista publica los horarios en los que puede atender** y que **cada reserva la aprueba él a mano**. Falta cerrar lo siguiente antes de poder construir la página.

### 1.1 Catálogo de sesiones

> ¿Qué tipos de sesión ofreces? Para cada uno: cuánto dura y cuánto cuesta.

Ejemplos de cómo suele estructurarse: consulta, boceto, sesión corta, sesión larga, retoque.

| Tipo de sesión | Duración | Precio |
|---|---|---|
| | | |
| | | |
| | | |
| | | |

> ¿El precio es fijo, o es "desde" y se ajusta según la pieza?

```
```

*Sin esto la página de agendar no tiene nada que mostrar. → KAN-19*

---

### 1.2 Los horarios que publicas

> Cuando abres un horario disponible, ¿sirve para cualquier tipo de sesión, o lo abres pensando en una en particular?

- [ ] Cualquiera — yo ajusto al aprobar
- [ ] Depende: abro horarios de distinta duración y el cliente elige uno que le calce
- [ ] Lo abro para un tipo concreto ("martes 15:00, sesión corta")

```
```

> Si alguien pide un horario y tú lo rechazas, ¿ese horario vuelve a quedar disponible para otra persona?

- [ ] Sí, vuelve a la lista automáticamente
- [ ] No, lo saco yo cuando quiera

```
```

> Mientras decides si aceptas, ¿ese horario queda bloqueado para los demás, o pueden pedirlo varios y tú eliges?

- [ ] Bloqueado: el primero que lo pide lo toma
- [ ] Abierto: varios pueden pedirlo y yo decido

```
```

*Estas tres definen cómo se guarda la información. Hay que responderlas antes de tocar la base de datos.*

---

## 2 · Reglas del negocio

### 2.1 Seña

> ¿Cobras algo por adelantado para que la cita quede firme?

- [ ] No
- [ ] Sí, por transferencia — el cliente manda el comprobante
- [ ] Sí, quiero pago en línea en el sitio

```
```

> Si es que sí: ¿cuánto, y qué pasa con esa seña si la persona cancela o no aparece?

```
```

*→ KAN-49*

---

### 2.2 Cancelación y cambios

> ¿Con cuánta anticipación tiene que avisar alguien que va a cancelar?

```
```

> ¿Puede cambiar la fecha en vez de cancelar? ¿Cuántas veces?

```
```

> ¿Qué pasa si la persona simplemente no llega?

```
```

> ¿Y si eres tú quien tiene que cancelar?

```
```

*→ KAN-79*

---

### 2.3 Referencias visuales

> ¿Quieres que te manden una foto de referencia al momento de reservar?

- [ ] Sí, siempre
- [ ] Sí, pero opcional
- [ ] No, eso lo hablamos después por WhatsApp

```
```

*→ KAN-48*

---

### 2.4 Edad

> ¿Tatúas a menores de edad con autorización de los padres, o hay una edad mínima?

```
```

*El formulario de registro ya está pidiendo fecha de nacimiento; según tu respuesta se valida o se quita. → KAN-78*

---

## 3 · Contenido real del sitio

### 3.1 Cómo te contactan

Hoy **todos los enlaces de la sección Contacto están muertos** — no llevan a ninguna parte. Necesitamos los reales.

| Canal | Dato real |
|---|---|
| Instagram | |
| WhatsApp (con código de país) | |
| Correo | |
| Behance | ¿existe? |
| are.na | ¿existe? |

> ¿Cuál prefieres que sea el canal principal, el más visible?

```
```

*→ KAN-41*

---

### 3.2 El estudio

> ¿Dónde está? ¿Publicamos la dirección exacta en el sitio, o solo la comuna y la dirección se la das a quien ya tiene hora confirmada?

- [ ] Dirección completa pública
- [ ] Solo comuna o barrio; la dirección exacta va en el correo de confirmación

```
```

> ¿Qué días y en qué horario atiendes? (para mostrarlo en el sitio, aparte de los horarios que publiques para reservar)

```
```

*→ KAN-67*

---

### 3.3 Sobre ti

La sección "Sobre el artista" tiene texto y cifras que vienen de la maqueta. Hay que confirmar si son reales.

> "Práctica desde 2018" — ¿correcto?

```
```

> "+ 240 obras" — ¿es un número real o lo ajustamos?

```
```

> "Estudio privado" — ¿así te describes?

```
```

> El texto dice: *"Sai trabaja entre la piel y el lienzo desde hace más de seis años. Blackwork de líneas finas, figuras que respiran, tinta que reposa en silencio sobre el cuerpo."* ¿Te representa, o lo reescribimos?

```
```

> ¿Cómo quieres que aparezca tu nombre en el sitio?

```
```

*→ KAN-68*

---

### 3.4 Galería

> Los títulos de las piezas los pusimos nosotros mirando las fotos ("Amapola · Sien", "Virgen · Pantorrilla", "Jinetes y naipes"...). ¿Están bien o los corriges?

```
```

> ¿Quieres poder subir obras nuevas tú mismo desde el panel, o prefieres mandárnoslas y que las subamos nosotros?

- [ ] Yo las subo
- [ ] Ustedes las suben

```
```

*Si las sube él, hay que construir esa parte del panel. → KAN-62, KAN-17*

---

## 4 · Operación y lanzamiento

### 4.1 Avisos

> Cuando alguien te pide una hora, ¿cómo quieres enterarte?

- [ ] Correo
- [ ] WhatsApp
- [ ] Ambos

```
```

> ¿A qué correo te llegan los avisos del sitio?

```
```

> ¿Quieres que al cliente le llegue un recordatorio el día antes de su sesión?

```
```

*→ KAN-43, KAN-65, KAN-66*

---

### 4.2 Dominio

> En el sitio aparece `ink-sai.art`. ¿Ese dominio existe y es tuyo, o hay que comprarlo?

```
```

> ¿Quién lo administra y lo paga?

```
```

*→ KAN-71*

---

### 4.3 Expectativas

> ¿Para cuándo te gustaría tenerlo publicado?

```
```

> ¿Cuántas reservas esperas al mes, más o menos?

```
```

> ¿El sitio reemplaza al DM de Instagram, o van a convivir?

```
```

*Esto define cuánta automatización vale la pena y si hace falta pagar el plan de base de datos.*

---

## Después de la reunión

1. Cerrar las decisiones en `specs/0001-agendar/spec.md` (sección 3, con fecha), y borrar las que dejen de estar pendientes.
2. Cargar el catálogo real en `/admin/servicios`.
3. Actualizar los tickets: KAN-19, 41, 48, 49, 62, 67, 68, 78, 79.
4. Escribir `specs/0001-agendar/plan.md` con el modelo de datos ya definido.
