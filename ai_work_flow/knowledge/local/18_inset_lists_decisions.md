# 18_inset_lists_decisions.md

## Decisión: listados agrupados en las vistas de staff

**Fecha**: 2026-10-29
**Contexto**: Omega Gym — Miembros, Membresías, Planes y Pagos
**Autor**: Desarrollador asistido por IA

### Problema

Las vistas de staff usaban `ResponsiveTable`: una tabla de escritorio (muchas
columnas tipográficas pequeñas) y, por separado, tarjetas individuales en móvil.
El resultado se leía como panel web y duplicaba la lógica de presentación.

### Decisión Final

`ResponsiveTable` se reescribió como **listado agrupado**:

- Una sola tarjeta `bg-surface rounded-[32px]` contiene todas las filas.
- Cada fila: avatar/icono a la izquierda, título blanco y subtítulo gris al
  centro, acciones o valores a la derecha.
- Separador `border-b border-divider` con `last:border-b-0`.
- Los dos primeros `cardFields` se ven en móvil; el resto usa
  `hidden md:inline-flex`, así las columnas secundarias reaparecen en escritorio.
- El parámetro `columns` sigue en la interfaz por compatibilidad, pero ya no
  se renderiza: **no quedan tablas en la app**.
- `columns` se marcó opcional para no obligar a los llamadores nuevos a definirla.

Los llamadores (`Members`, `Memberships`, `Payments`, `MemberDetail`) dejaron de
envolver el componente en un `div` con `bg-surface`, que creaba doble tarjeta.

### Complementos

- `MetricCard`: `rounded-[24px]` y `p-5` (KPI cards de todas las pantallas).
- `SearchInput`: `rounded-full`, `bg-surface2`, borde ninguno, placeholder
  `text-text-2`.
- `Pagination`: pasó de barra `bg-surface2` con `border-t` a tarjeta
  `bg-surface rounded-[24px]` separada del listado.
- `TrainingPlans`: su rejilla de tarjetas 1/2 columnas se convirtió en listado
  agrupado con icono, nombre, detalle, badge y avatares de miembros.
- KPIs: `grid-cols-2` en móvil, `lg:grid-cols-4` cuando hay cuatro tarjetas
  (Miembros); 2 columnas para Membresías, Pagos y Planes.

### Consecuencia conocida

Al ocultar los campos a partir del tercero en móvil, un dato secundario (por
ejemplo "Ref. interna" o "Teléfono") solo aparece desde `md`. Si se necesita en
móvil, basta reordenar `cardFields`: los dos primeros siempre se muestran.
