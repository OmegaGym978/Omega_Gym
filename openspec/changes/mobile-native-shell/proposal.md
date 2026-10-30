# Proposal

## Why

La aplicación sigue teniendo un esqueleto de panel web: barra lateral fija en escritorio, breadcrumbs en diez pantallas, tarjetas con esquinas poco redondeadas, botones rectangulares e inputs con borde marcado. En móvil eso se traduce en paddings laterales excesivos, navegación duplicada (rail + barra inferior) y una jerarquía visual que no se siente nativa.

Los tickets 028–031 resolvieron el área del miembro (rutinas, builder, buscador y perfil). Este cambio extiende ese lenguaje al resto de la app: shell único, tokens nuevos, navegación por rol y pantallas de staff.

## What Changes

- **Sistema de diseño**: fondo negro puro en modo oscuro, escala neutra completa (`surface` 1-4, `text` 1-4, bordes), radios semánticos y **acento intercambiable** (`data-accent`) con seis presets; el rojo/coral sigue siendo el valor por defecto. Se elimina el azul del tema y se sustituye por acento/teal/gris.
- **Átomos**: botones primarios en píldora con `--accent-contrast` (necesario para acentos claros), inputs nativos sin borde agresivo y texto 16px en móvil, badges/chips redondeados, tarjetas de métrica `rounded-2xl`.
- **Shell único** (`AppLayout`): barra inferior por rol, hoja "Más" para secciones secundarias y **drawer bajo demanda** que reemplaza la barra lateral fija. Sin breadcrumbs.
- **Navegación por rol**: miembro `Inicio (/my-plan) · Entrenamiento · Perfil · Más`; admin `Inicio · Miembros · Pagos · Perfil · Más`; entrenador `Inicio · Miembros · Membresías · Perfil · Más`.
- **Pantallas de staff**: `ResponsiveTable` con tarjetas móviles redondeadas, Dashboard/Miembros/Membresías/Pagos/Ficha/Huella con `ScreenHeader` y contenedores centrados hasta 1100px.
- **Planes de entrenamiento**: se elimina `styles/training-plans.css` (690 líneas, 12 colores hex, master-detail de escritorio) y se reconstruye con tokens: lista apilada, detalle a pantalla completa y modales redondeados.
- **Auth y kiosko**: login/registro/recuperación con look nativo; kiosko de check-in sobre negro puro.
- **BREAKING (visual)**: desaparecen la barra lateral fija, los breadcrumbs y el azul como color de interfaz.
- **Fuera de alcance**: nuevas funcionalidades de negocio, cambios de esquema/RLS y persistencia de sesiones de entrenamiento.

## Capabilities

### New Capabilities

- `app-shell`: estructura de navegación global (barra inferior por rol, hoja "Más", drawer y cabecera de pantalla) sin barras laterales fijas ni breadcrumbs.
- `design-system`: tokens de color, radios, tipografía y variantes de átomos, incluido el acento intercambiable y la eliminación del azul.
- `staff-screens`: presentación móvil de las pantallas de gestión (dashboard, miembros, membresías, pagos, ficha, huella y planes).

### Modified Capabilities

<!-- `member-training-hub` se ajusta en su propio change (Inicio = /my-plan); no se modifica aquí. -->

## Impact

- **Código**: `src/index.css`, `src/store/accent.store.ts` (nuevo), átomos y moléculas de `components/ui`, `components/layout/*` (`AppLayout`, `NavigationDrawer`, `nav-config`), `components/ui/layout/*` (`BottomNav`, `MoreSheet`, `ScreenHeader`), las 10 páginas con breadcrumbs, `pages/dashboard/TrainingPlans.tsx` y `pages/auth/*`.
- **Eliminado**: `components/layout/Sidebar.tsx`, `sidebar-config.ts`, `trainer-sidebar-config.ts`, `components/ui/molecules/PageHeader.tsx`, `src/styles/training-plans.css`.
- **Base de datos**: sin cambios.
- **Tema claro**: se mantiene; solo cambian los neutros. El negro puro aplica al modo oscuro.
- **Accesibilidad**: `aria-current`, `aria-pressed`, `aria-label` en iconos y foco visible en acento.
- **Riesgo**: la eliminación del sidebar obliga a que "Más" y el drawer cubran las 7 secciones del staff; se valida por rol.
