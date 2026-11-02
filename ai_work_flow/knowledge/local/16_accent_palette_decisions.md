# 16_accent_palette_decisions.md

## Decisión: paleta de acento vibrante y selector nativo

**Fecha**: 2026-10-29
**Contexto**: Omega Gym — Ajustes → Color de acento
**Autor**: Desarrollador asistido por IA

### Problema

La paleta anterior (`#e85d5d`, `#f4511e`, `#a78bfa`, `#2dd4bf`, `#a3e635`, `#f59e0b`)
tenía tonos apagados que se perdían sobre el fondo negro, y el selector marcaba el
color activo con un doble anillo pintado con `box-shadow` y el color del fondo, lo
que se rompía al cambiar entre tema oscuro y claro.

### Decisión Final

**Paleta (8 colores, estilo fitness sobre fondo oscuro):**

| key | label | color | contraste |
|---|---|---|---|
| `coral` | Rojo coral | `#FF4F4F` | blanco |
| `ember` | Naranja atardecer | `#FF9F0A` | oscuro |
| `lime` | Verde neón | `#32D74B` | oscuro |
| `teal` | Cian menta | `#64D2FF` | oscuro |
| `blue` | Azul eléctrico | `#0A84FF` | blanco |
| `violet` | Morado brillante | `#BF5AF2` | blanco |
| `pink` | Rosa neón | `#FF375F` | blanco |
| `amber` | Amarillo vibrante | `#FFD60A` | oscuro |

Cada preset se materializa en `index.css` con cinco variables:
`--color-accent`, `--color-accent-dim`, `--color-accent-text`,
`--color-accent-contrast` y `--accent-rgb`.

**Claves estables.** Se conservan las claves existentes (`coral`, `ember`, `lime`,
`teal`, `violet`, `amber`) y se añaden `blue` y `pink`. Quien ya tenía un acento
guardado en `localStorage` conserva la preferencia; solo cambia el tono al nuevo
valor, sin migración.

**Contraste calculado por preset.** El campo `contrast` de `AccentPreset` define
el color de la palomita. Los tonos claros (naranja, verde, cian, amarillo) usan
`#09090B`; los saturados oscuros (rojo, azul, morado, rosa) usan blanco.

### Selector

- Contenedor `bg-surface rounded-card p-5` (zinc-900 = `#18181b`), sin borde.
- `grid grid-cols-4 gap-4 place-items-center`: ocho círculos en dos filas.
- Círculos de `w-11 h-11` (44 px), el mínimo táctil de iOS.
- Activo: palomita centrada del color de contraste. Se descartó el anillo blanco
  con offset porque el color de separación depende del fondo de la tarjeta
  (`#18181b` en oscuro, `#ffffff` en claro) y se rompe al cambiar de tema.

### Aplicación

- `src/store/accent.store.ts`
- `src/index.css` (bloques `[data-accent="…"]` y default de `@theme`)
- `src/pages/settings/SettingsModal.tsx`

### Consecuencia conocida

El acento sigue siendo un token global: cualquier componente que use
`bg-accent`, `text-accent`, `bg-accent-dim` o `text-accent-contrast` se adapta
solo. El coral es el valor por defecto y es el único con `-contrast` blanco que
queda por debajo de 4.5:1 (3.05:1), igual que antes del cambio; se mantiene por
identidad visual y porque los botones usan texto en negrita.
