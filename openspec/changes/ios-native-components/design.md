# Design

## Context

Ver `proposal.md` — Why. Estado antes del cambio:

- Tokens: `surface` #101012, `surface2` #18181b, `surface3` #27272a; sin token de divisor.
- `Button` píldora pero ~40–44 px, con `hover:brightness`; `Input` con borde y 15 px; `IconButton` con borde.
- `Modal` centrado (26 usos) y `BottomSheet` sin drag handle.
- `ResponsiveTable` con tarjetas separadas; menús y ajustes con divs ad-hoc.
- Un único switch custom y varios checks con estilos inline (algunos con acento hardcodeado).
- 105 usos de `hover` y 8 sombras.

## Goals / Non-Goals

**Goals:**

- Objetivos táctiles de 44–56 px y feedback por opacidad al presionar.
- Jerarquía por contraste (zinc-900 sobre negro), no por bordes ni sombras.
- Un solo patrón de hoja inferior para todo lo que era modal.
- Componentes reutilizables para listas, switches y checks.

**Non-Goals:**

- Cambiar lógica, datos o rutas.
- Introducir una librería de componentes.
- Rehacer el contenido de las pantallas.
- Convertir tablas de datos en celdas agrupadas.

## Decisions

**1. Subir la escala de superficies en lugar de tocar 76 tarjetas.**
Cambiar tres tokens propaga el look iOS a toda la app y evita un barrido propenso a errores. Se añade `divider` para separadores de listas.

**2. `Modal` como wrapper de `BottomSheet`.**
Los 26 usos comparten API (`open`, `onClose`, `title`, `icon`, `compact`). Reescribir la implementación convierte todo a hoja inferior sin editar páginas y mantiene una sola forma de presentar diálogos.

**3. Sin `hover`, salvo tablas de escritorio.**
Se eliminan 87 usos. Las filas de `ResponsiveTable` conservan `lg:hover` porque el staff usa ratón en escritorio; el resto usa `active:opacity-70`.

**4. Cabeceras como texto plano.**
"Cancelar", "Guardar", "Nuevo" y "Nueva" usan la variante `plain` (texto acento). Se descartó mantener píldoras en la cabecera para respetar el patrón de navegación de iOS.

**5. Listas agrupadas solo donde aportan.**
`ListGroup`/`ListTile` para Ajustes, "Más" y el selector de ejercicios (celdas con divisor y chevron). Las tablas de Miembros/Membresías/Pagos siguen como tarjetas: agruparlas en una sola celda dificulta escanear registros y separar acciones.

**6. Inputs de 17 px.**
Se descartó `text-lg` (18 px) por ser demasiado grande para formularios densos; 17 px es el tamaño de iOS y evita el zoom (junto con la regla de 16 px mínimo en móvil).

**7. `Switch` y `Checkmark` presentacionales.**
El check es un `span` (no un botón) para poder anidarse dentro de filas-botón sin HTML inválido; el switch sí es interactivo con `role="switch"`.

**8. Contraste sobre zinc-900.**
Se mantiene `text-3` (#71717a) para placeholders y secundarios; las etiquetas críticas usan `text-2`. QA de contraste pendiente.

## Risks / Trade-offs

- **Contraste**: zinc-900 con `text-3` ronda 4:1 → revisar en QA; subir a `text-2` donde haga falta.
- **Hojas con formularios largos**: scroll interno y máximo 90vh; los footers deben quedar visibles.
- **Sin bordes**: la separación depende del contraste; en tema claro se ajustan los neutros.
- **Barrido de hover**: se verificó que ningún estilo de estado quedara aplicado permanentemente (búsqueda de duplicados y revisión manual).
- **Cabeceras sin CTA destacado**: la acción es texto; se mantiene el icono `+` para dar pistas.

## Migration Plan

1. Tokens y átomos.
2. BottomSheet + Modal wrapper + Ajustes/Más.
3. Adopción (headers, checks, picker, inputs de auth, TabBar, IconButton).
4. Barrido de hover/sombras/bordes y reparación de estados.
5. QA visual y cierre.

## Open Questions

- Evaluar en QA si conviene subir `text-3` a zinc-400 en modo oscuro.
