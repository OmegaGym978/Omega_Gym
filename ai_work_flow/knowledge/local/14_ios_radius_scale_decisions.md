# 14_ios_radius_scale_decisions.md

## Decisión: escala de radios iOS con tokens semánticos

**Fecha**: 2026-10-29
**Contexto**: Omega Gym — rediseño visual móvil nativo
**Autor**: Desarrollador asistido por IA

### Problema

Las tarjetas usaban radios mezclados (`rounded-2xl` = 16 px en la mayoría,
`rounded-3xl` = 24 px en algunas) y las hojas inferiores 24 px. La UI se percibía
rígida frente al lenguaje visual de iOS, pero subir `rounded-2xl` de forma global
habría deformado inputs, chips y avatares (en un control de 40 px un radio de
28 px se satura y el control se vuelve píldora).

### Opciones evaluadas

#### Opción 1: subir los tokens de Tailwind (`--radius-2xl`, `--radius-3xl`)
**Pros**: un solo cambio, efecto inmediato en toda la app.
**Contras**: afecta controles pequeños; los inputs de auth y de filtros perdían
su forma; imposible revertir por tipo de elemento.

#### Opción 2: tokens semánticos por tipo de contenedor
**Pros**: separa tarjeta, tile interno y hoja; cada pantalla mantiene coherencia;
los controles pequeños conservan su radio.
**Contras**: obliga a un barrido de clases en las pantallas.

### Decisión Final

**Selección**: Opción 2 — tokens semánticos en `src/index.css`:

```css
--radius-tile: 1.25rem;   /* 20px — chips, badges, tiles internos */
--radius-card: 1.75rem;   /* 28px — tarjetas */
--radius-sheet: 2rem;     /* 32px — hojas inferiores */
```

Que generan las utilidades `rounded-tile`, `rounded-card` y `rounded-t-sheet`.

### Reglas de aplicación

1. Contenedor con `bg-surface` → `rounded-card`.
2. Contenido sobre superficie secundaria (`bg-surface2/3/4`) → `rounded-tile`.
3. Hojas inferiores (`BottomSheet`, y por herencia `Modal`) → `rounded-t-sheet`.
4. Controles de formulario (`Input`, `SearchInput`, selects y textareas) →
   `rounded-2xl` (16 px), alineados con el átomo `Input`.
5. `Chip`, avatares e iconos circulares → sin cambios.
6. Skeletons que sustituyen tarjetas → `rounded-card`; los de fila → `rounded-tile`.

### Aplicación

- `src/index.css` — tokens.
- Componentes compartidos: `Card`, `MetricCard`, `ListGroup`, `ResponsiveTable`,
  `BottomSheet`, `NavigationDrawer`, `SettingsModal`, `SegmentedControl`.
- Pantallas: member (`MyPlan`, `MyMembership`, `MyRoutines`, `MyProfile`,
  `MyCheckins`, `MyExercises`, `ExerciseDetail`), staff (`Dashboard`, `Members`,
  `MemberDetail`, `Memberships`, `Payments`, `TrainingPlans`), auth
  (`Login`, `Register`, `ForgotPassword`, `ResetPassword`), kiosk (`CheckIn`).
- `BottomNav`: se retiró el indicador superior de 2 px y la cápsula
  `bg-accent-dim` del icono activo; el estado activo queda solo por color
  (icono + label en acento), como el tab bar de iOS.

### Consecuencia conocida

Los radios de 28 px son mayores que el máximo de la escala por defecto de
Tailwind (`rounded-3xl` = 24 px), por eso se expresan con tokens y no con
utilidades numéricas. Si se necesita un cuarto nivel (por ejemplo, tarjeta
destacada), se agrega otro token en lugar de un valor arbitrario.

### Addendum (2026-10-29): excepción de autenticación

Las tarjetas de `Login`, `Register`, `ForgotPassword` y `ResetPassword` usan
`rounded-[32px]` en lugar de `rounded-card` (28 px). Es una excepción deliberada:
son pantallas de entrada, sin barra inferior ni navegación, y el radio más
pronunciado las separa del resto de la app. No se creó token porque es el único
caso y ya coincide con el valor de `--radius-sheet` (2rem).

Además, los campos de esas pantallas usan `bg-surface2` sin borde: antes eran
`bg-surface` dentro de una tarjeta `bg-surface`, es decir, invisibles. La regla
general queda: campo de formulario = `bg-surface2` + `rounded-2xl` + sin borde.

### Addendum (2026-10-29): Inset Grouped global

Reglas aplicadas a toda la app para eliminar el aspecto de "caja web":

1. **Header fusionado.** `ScreenHeader` (y los headers de `MyProfile`,
   `RoutineBuilder`, `WorkoutSession` y las barras del kiosco) pierden
   `border-b`. Queda `bg-bg/85 backdrop-blur-xl` sobre el mismo `bg-bg` del
   cuerpo, sin costura. Es el equivalente a la barra translúcida de iOS.
2. **Contenedor único.** `PageContainer` es el contenedor oficial de página:
   `mx-auto w-full px-4 sm:px-5 py-4` + `max-w-[560px]`/`[1100px]`. Las ocho
   pantallas que lo hacían a mano (`MyPlan`, `MyProfile`, `MyRoutines`,
   `MyMembership`, `MyCheckins`, `MyExercises`, `ExerciseDetail`) ya lo usan.
3. **Padding interno.** Tarjetas de contenido en `p-5`. Las celdas de
   `ListGroup`/`ListTile`/`ResponsiveTable` siguen en 16 px porque son celdas.
4. **Sin bordes en contenedores.** Si el contenedor tiene fondo, el borde se
   elimina y la separación la hace el tinte (`bg-surface`, `bg-accent-dim`,
   `bg-amber-bg`, `bg-red-bg`, `bg-green-bg`). Se conservan los bordes de
   controles (inputs, chips, icon buttons, pills) porque en tema oscuro
   definen el área táctil, y los separadores `divide-divider` de listas.
5. **Cabeceras internas de tarjeta** sin `border-b`: el agrupado ya separa.
   Las filas de tabla/listas conservan su separador.

Las sombras se limitan a elementos flotantes (menú desplegable, banner PWA,
pill de la tab bar en escritorio); ninguna tarjeta lleva sombra.


