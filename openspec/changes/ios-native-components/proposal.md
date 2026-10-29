# Proposal

## Why

Tras el rediseño del shell, la app ya es móvil, pero sus componentes base conservaban rasgos de panel web: botones de 40 px, efectos `hover`, inputs con borde, tarjetas con borde y sombra, modales centrados, checks ad-hoc y ninguna celda de lista agrupada. El resultado no se siente nativo al tacto y hay estilos de estado que solo tienen sentido con ratón.

## What Changes

- **Escala de superficies**: `surface` pasa a zinc-900 (#18181b), `surface2` a zinc-800 (#27272a) y `surface3` a zinc-700 (#3f3f46); nuevo token `divider`. Las tarjetas existentes (`bg-surface`) quedan en zinc-900 sin edits masivos.
- **Botones**: `primary` píldora con altura táctil (`h-12`/`h-14`), `secondary` zinc-800 `rounded-xl`, `plain` para cabeceras (texto acento), `danger`; `active:opacity-70`, sin `hover` y sin sombra.
- **Inputs**: sin borde, fondo zinc-900, `rounded-2xl`, padding generoso, 17 px, placeholder zinc-500 y foco con ring de acento.
- **Tarjetas**: `bg-surface`, `rounded-2xl/3xl`, sin borde ni sombra; se eliminan 71 bordes y las sombras de contenedores.
- **Listas**: nuevos `ListGroup` y `ListTile` (divisor `divider`, icono/avatar, título, subtítulo, chevron) para Ajustes, "Más" y el selector de ejercicios. Las tablas de datos conservan tarjetas.
- **Modales**: `BottomSheet` con `rounded-t-3xl` y drag handle; `Modal` pasa a ser un wrapper del sheet, por lo que los 26 modales existentes cambian sin tocar páginas. Nuevo `ConfirmSheet`.
- **Switches y checks**: `Switch` nativo (activo en acento) y `Checkmark` circular; Ajustes, asignación de planes, selector de miembros y picker dejan de usar implementaciones ad-hoc.
- **Interacción**: se eliminan 87 usos de `hover` (queda solo `lg:hover` en filas de tablas de escritorio) y se añade `active:opacity-70` a los controles.
- **Sin cambios**: lógica de negocio, datos, RLS, rutas y la paleta de acento (coral por defecto, sin azul).

## Capabilities

### New Capabilities

- `ios-components`: comportamiento y apariencia de los componentes base (botones, campos, tarjetas, listas agrupadas, hojas inferiores, switches y marcas) alineados con iOS y con la marca del proyecto.

### Modified Capabilities

<!-- `design-system` y `app-shell` mantienen sus contratos; este change especializa los componentes. -->

## Impact

- **Código**: `index.css`, átomos (`Button`, `Input`, `Card`, `Switch`, `Checkmark`, `IconButton`), moléculas (`BottomSheet`, `Modal`, `ListGroup`, `ListTile`, `TabBar`, `SearchInput`, `ResponsiveTable`), `SettingsModal`, `MoreSheet` y barrido en páginas.
- **Sin base de datos** ni migraciones.
- **Tema claro**: se ajustan los neutros y se conserva el acento elegido.
- **Accesibilidad**: `role="switch"`, `aria-checked`, `aria-label` en iconos y objetivos táctiles de 44–56 px.
- **Riesgo**: el cambio global de superficies reduce el contraste de textos secundarios; se revisa con QA visual.
