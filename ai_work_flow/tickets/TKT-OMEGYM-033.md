# TKT-OMEGYM-033: Shell único, navegación por rol y eliminación de breadcrumbs

## Metadata
- **Tipo**: Refactoring (navegación y layout)
- **Prioridad**: Alta
- **Estado**: Review
- **Módulo**: app-shell
- **Relacionado con**: `openspec/changes/mobile-native-shell/`
- **OpenSpec change**: `mobile-native-shell` → capability `app-shell`
- **Fecha apertura**: 2026-10-29
- **Fecha cierre**: —

## Descripción
Había tres layouts con lógica duplicada: rail fijo de 56px en escritorio, `Sidebar` deslizante, `BottomNav` de 5–6 ítems en móvil y breadcrumbs propios en diez pantallas. El miembro tenía como home `/my-routines` pese a que `Mi plan` es su vista de Inicio.

Se unifica en un `AppLayout` con barra inferior por rol, hoja "Más", drawer bajo demanda y `ScreenHeader` reutilizable. Se eliminan el sidebar y los breadcrumbs.

## Dependencias
- **Bloqueado por**: TKT-OMEGYM-032 (tokens y átomos)
- **Bloquea a**: TKT-OMEGYM-034 y 036

## Archivos Afectados
- `src/components/layout/AppLayout.tsx` (nuevo)
- `src/components/layout/NavigationDrawer.tsx` (nuevo)
- `src/components/layout/nav-config.ts` (nuevo)
- `src/components/ui/layout/{BottomNav,MoreSheet,ScreenHeader,PageContainer}.tsx`
- `src/components/layout/{AdminLayout,TrainerLayout,MemberLayout}.tsx` (delegan en `AppLayout`)
- `src/store/sidebar.store.ts`
- `src/App.tsx`
- Eliminados: `Sidebar.tsx`, `sidebar-config.ts`, `trainer-sidebar-config.ts`, `PageHeader.tsx`
- Las 10 páginas con breadcrumbs

## Implementación
- [x] `AppLayout` único con tabs por rol y hoja "Más"
- [x] `NavigationDrawer` con perfil, secciones y ajustes; badge de pagos pendientes
- [x] `ScreenHeader` con volver/menú, título, subtítulo y acciones
- [x] 10 breadcrumbs sustituidos
- [x] Miembro: `Inicio` = `/my-plan`; `RootRedirect` actualizado
- [x] Contenedores centrados (560px miembro/auth, 1100px staff)
- [x] Eliminados sidebar, rail y `PageHeader`

## Criterios de aceptación
- [ ] Miembro aterriza en `/my-plan` y ve `Inicio · Entrenamiento · Perfil · Más`.
- [ ] Admin ve `Inicio · Miembros · Pagos · Perfil · Más`; entrenador no ve Pagos.
- [ ] "Más" abre la hoja con Membresías, Planes, Asistencia/Huella (DEV) y Ajustes.
- [ ] El drawer se abre desde la cabecera, navega y se cierra.
- [ ] No queda ninguna barra lateral fija ni breadcrumb visible.
- [ ] La tab activa se resalta en el acento incluso en subrutas.
- [x] `npm run build` sin errores.

## Evidencia de Cierre
**Fecha**: 2026-10-29  
**Probado por**: Dev asistido por IA  
**Resultado**:
- `AppLayout` + `nav-config` reemplazan los tres layouts; wrappers `Admin/Trainer/MemberLayout` delegan.
- `BottomNav` con tabs por rol, indicador activo y píldora flotante en escritorio.
- `MoreSheet` y `NavigationDrawer` implementados; sidebar y rail eliminados.
- Breadcrumbs sustituidos por `ScreenHeader` en Dashboard, Miembros, Membresías, Pagos, Planes, Ficha, Huella, Mi plan, Mi membresía y Mi asistencia.
- `npm run build` OK.
- **Pendiente**: QA de navegación por los tres roles.

**Commit**: —
