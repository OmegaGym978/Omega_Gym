# Design

## Context

Ver `proposal.md` — Why. Estado antes del cambio:

- `@theme` define superficies grises (#0f0f0f/#181818), radios pequeños y un azul (`--color-blue`) usado en KPIs, badges y avatares; `bg-surface3` y `text-text-4` se usaban sin existir en el tema.
- `AdminLayout` y `TrainerLayout` montaban un rail fijo de 56px en `lg`, un `Sidebar` deslizante y una `BottomNav` de 5–6 ítems para móvil.
- Diez páginas dibujaban su propio `<header>` con breadcrumb y `bg-surface2`.
- `TrainingPlans` dependía de `src/styles/training-plans.css` con layout master-detail, medidas en px y 12 colores hexadecimales.
- El tema claro existe y se alterna desde `SettingsModal`.

## Goals / Non-Goals

**Goals:**

- Un solo shell para los tres roles, con navegación inferior y drawer bajo demanda.
- Tokens completos y consistentes; ningún color de interfaz fuera del tema.
- Acento intercambiable en tiempo real sin recargar.
- Pantallas centradas y legibles en 360 px, con degradación ordenada en escritorio.

**Non-Goals:**

- Cambiar lógica de negocio, permisos o RLS.
- Persistir sesiones de entrenamiento.
- Rehacer la captura de huella o el escáner del kiosko.
- Introducir una librería de componentes o de gráficos.

## Decisions

**1. Acento como token con presets, no como constante.**
Los utilities de Tailwind v4 referencian `var(--color-accent)`, así que `[data-accent="lime"]` recolorea toda la app. Se añade `--accent-contrast` porque lima/ámbar/violeta/teal necesitan texto oscuro sobre el botón primario. Se eliminaron los 19 hex de acento hardcodeados (`MetricCard.glow`, selección de miembros, modales de planes).

**2. Un `AppLayout` único en lugar de tres layouts.**
Admin, entrenador y miembro comparten shell; lo que cambia es la configuración de navegación (`getRoleNav`). Elimina duplicación y garantiza que un cambio de navegación aplique a todos.

**3. Drawer + "Más" en vez de sidebar fija.**
El staff tiene siete secciones. La barra inferior muestra cuatro (Inicio, Miembros, Pagos/Membresías, Perfil) y "Más" abre una hoja con el resto; el drawer da acceso completo desde la cabecera y conserva el badge de pagos pendientes.

**4. `ScreenHeader` reemplaza breadcrumbs.**
Título, subtítulo, botón de volver o menú, y acciones. En staff el botón de menú aparece por defecto; en miembro no. El detalle de miembro vuelve a `/members`.

**5. Radios por token, no por barrido ciego.**
`--radius` (16px) y `--radius-sm` (12px) suben globalmente, y los contenedores pasan explícitamente a `rounded-2xl/3xl`. Los controles pequeños usan `rounded-full`. Así los 90 `rounded-sm` heredan un radio razonable sin revisar uno por uno.

**6. Inputs globales nativos.**
El átomo `Input/Textarea/Select` pasa a fondo `surface2`, borde suave, 15–16px y foco en acento. Regla CSS de 16px en móvil para evitar el zoom de iOS. Las páginas que usan inputs crudos se alinearon con la misma forma.

**7. `TrainingPlans` reconstruido, no parcheado.**
El CSS propio era incompatible con el shell (medidas fijas, dos paneles). Se reescribió con Tailwind y un detalle a pantalla completa; se conservaron todos los flujos (asignar, quitar, duplicar, editar, eliminar, ver ejercicio).

**8. Tablas híbridas.**
`ResponsiveTable` mantiene la tabla en `lg` (staff trabaja con datos) y en móvil renderiza tarjetas `rounded-2xl` separadas por gap, no filas con `divide-y`.

**9. Tema claro intacto.**
El negro puro se aplica solo a los tokens oscuros; `[data-theme="light"]` redefine neutros y conserva el acento elegido.

## Risks / Trade-offs

- **Acento claro con texto blanco** → `--accent-contrast` por preset; auditoría de botones/chips.
- **Pérdida de accesos al quitar el sidebar** → tabs + "Más" + drawer; validación por rol.
- **Regresión en planes** → checklist de asignar/quitar/duplicar/eliminar antes de borrar el CSS.
- **Barrido de radios** → regla contenedor/control; revisión visual por pantalla.
- **Sin breadcrumbs en detalles** → back explícito en `ScreenHeader`.
- **Zoom de iOS** → 16px forzado en inputs dentro de móvil.

## Migration Plan

1. Tokens, acento y átomos (032).
2. Shell, navegación y eliminación de breadcrumbs (033).
3. Pantallas de staff y tablas (034).
4. Planes (035).
5. Auth, kiosko, modales y barrido (036).
6. QA 360/390/768/1280, claro/oscuro, build y validación OpenSpec.

## Open Questions

- Ninguna bloqueante. Queda como deuda la persistencia de sesiones para alimentar los gráficos del perfil.
