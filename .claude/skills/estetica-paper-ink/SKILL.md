---
name: estetica-paper-ink
description: Sistema visual de ink·sai — paleta, tipografías, patrones de componentes (labels, inputs, botones, errores, overlays) y animaciones. Usar al crear o modificar cualquier componente de UI.
---

# Estética paper / ink

Portafolio de tatuador. Papel y tinta, tipografía editorial, mucho aire. Nada de UI genérica: sin bordes redondeados, sin sombras, sin rojo, sin spinners.

## Tokens (tailwind.config.js)

| Token | Valor | Uso |
|---|---|---|
| `paper` | `#F2EEE7` | fondo base |
| `ink` | `#1B1815` | texto, botones sólidos, bordes activos |
| `dim` | `#A79F92` | etiquetas, metadatos, estado inactivo. **Contraste bajo (~2.3:1)** — no usarlo para texto que deba leerse sí o sí (KAN-76). Para eso, `#7A7268` |

Fondos secundarios por sección, en hex directo: `#EDE7DD` (lienzo), `#F4F0E9` (artista), `#EAE4DA` / `#E7E1D6` (placeholders), `#141210` (overlays oscuros).

## Tipografías

- `font-serif` (Instrument Serif) — títulos. Casi siempre `italic` y grande: `text-3xl` en páginas, `text-[64px]`–`text-[110px]` en secciones.
- `font-body` (EB Garamond) — párrafos y valores de inputs, `text-lg`.
- `font-mono` (JetBrains Mono) — etiquetas, eyebrows, navegación, botones. **Siempre** `uppercase` + `tracking-[0.26em]`–`[0.3em]` + tamaño chico (`text-[9px]`–`[11px]`).

## Patrones

**Eyebrow de sección**
```
font-mono text-[9.5px] tracking-[0.3em] uppercase text-dim
§ 02 — Galería de tatuajes · 2023–2026
```

**Label de campo**
```
font-mono text-[9px] tracking-[0.26em] uppercase text-dim
```

**Input** — línea inferior, nada más:
```
w-full bg-transparent border-b border-ink/20 focus:border-ink outline-none font-body text-lg py-2
```
En el modal de auth la línea es `border-dashed border-[#C9C0AE]`.

**Botón primario**
```
bg-ink text-paper font-mono text-[10px] tracking-[0.26em] uppercase py-4 px-7 disabled:opacity-40
```
Repetir `font-mono` en `<button>` aunque el padre ya lo tenga: el reset de Tailwind no hereda la fuente en botones.

**Enlace de texto / acción secundaria**
```
font-mono text-[9.5px] tracking-[0.26em] uppercase border-b border-ink pb-1
```

**Pestañas / toggle** — el activo `border-b border-ink`, el inactivo `text-dim`.

**Error** — no hay rojo. Barra de tinta al costado:
```
<p role="alert" className="font-mono text-[11px] leading-relaxed border-l-2 border-ink pl-3">
```

**Placeholder de imagen** — rayado diagonal, se queda de fondo mientras carga:
```
style={{ backgroundImage: 'repeating-linear-gradient(135deg, #E4DED2 0 1px, transparent 1px 15px)' }}
```

**Estado vacío / carga** — mismo rayado, texto serif itálico. Nunca un spinner.

## Overlays (modal, lightbox, menú)

- Siempre `createPortal(..., document.body)` con `z-[300]` o más. El header usa `mix-blend-difference` y sin portal el overlay queda ilegible.
- Fondo `bg-[#141210]` con el patrón de puntos: `radial-gradient(rgba(242,238,231,0.05) 1px, transparent 1px)`, `backgroundSize: 14px 14px`.
- Bloquear scroll del body mientras está abierto (ver `Lightbox.tsx`).
- `Escape` cierra. Click fuera cierra (con `stopPropagation` en el contenido).

## Animaciones (index.css)

| Clase | Uso |
|---|---|
| `anim-fade` | entrada suave de cualquier bloque (260 ms) |
| `anim-modal-in` | entrada del modal (420 ms, con leve escala) |
| `anim-out` | salida del intro |
| `anim-canvas-featured` | crossfade de la obra protagonista |

Todas respetan `prefers-reduced-motion`. Al agregar una nueva, añadirla al bloque `@media (prefers-reduced-motion: reduce)`.

## Voz

Copy en español, tono de taller: "ficha", "sellar admisión", "firmar entrada", "retoma tu ficha". Sin exclamaciones. Los mensajes de error son cortos y en la misma voz.

## Responsive

Mobile-first en teoría, pero hoy el header no colapsa (KAN-33) y la galería usa alturas en px (KAN-61). Al crear algo nuevo, verificar a 375px con `resize_window` antes de cerrar.
