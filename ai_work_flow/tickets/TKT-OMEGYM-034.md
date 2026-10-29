# TKT-OMEGYM-034: Pantallas de staff en lenguaje móvil

## Metadata
- **Tipo**: Feature (rediseño UI)
- **Prioridad**: Media
- **Estado**: Review
- **Módulo**: staff-screens
- **Relacionado con**: `openspec/changes/mobile-native-shell/`
- **OpenSpec change**: `mobile-native-shell` → capability `staff-screens`
- **Fecha apertura**: 2026-10-29
- **Fecha cierre**: —

## Descripción
Las pantallas de gestión (Dashboard, Miembros, Membresías, Pagos, Ficha del miembro y Huella) usaban tarjetas con esquinas poco redondeadas, héroes con gradiente, paddings de escritorio y tablas con filas planas en móvil. Se adaptan al lenguaje móvil: cabecera única, contenedor centrado, KPIs redondeados y tarjetas apiladas en móvil.

## Dependencias
- **Bloqueado por**: TKT-OMEGYM-032 y 033
- **Bloquea a**: —

## Archivos Afectados
- `src/components/ui/molecules/ResponsiveTable.tsx`
- `src/pages/dashboard/{Dashboard,Members,Memberships,Payments,MemberDetail,Fingerprint}.tsx`
- `src/pages/member/{MyMembership,MyCheckins,MyPlan}.tsx` (ajuste de cabecera y anchos)

## Implementación
- [x] `ResponsiveTable`: tarjetas `rounded-2xl` en móvil y tabla en contenedor redondeado
- [x] Dashboard: KPIs 2×2, hero sin gradiente ni caja
- [x] Cabeceras con `ScreenHeader` y contenedores `max-w-[1100px]`
- [x] Radios normalizados y badges de rol sin azul
- [x] Métodos de pago con teal en lugar de azul
- [x] Vistas de miembro centradas a 560px

## Criterios de aceptación
- [ ] En 390px, miembros/membresías/pagos se ven como tarjetas independientes y legibles.
- [ ] En 1280px, los listados conservan la tabla dentro de un contenedor redondeado.
- [ ] El dashboard muestra los KPIs en 2×2 y las secciones apiladas.
- [ ] La ficha del miembro vuelve al listado desde la cabecera.
- [ ] No hay elementos azules ni paddings laterales excesivos en móvil.
- [x] `npm run build` sin errores.

## Evidencia de Cierre
**Fecha**: 2026-10-29  
**Probado por**: Dev asistido por IA  
**Resultado**:
- `ResponsiveTable` con tarjetas móviles redondeadas y tabla enmarcada.
- Las seis pantallas de staff usan `ScreenHeader` y contenedores centrados.
- Badges de rol migrados a acento/teal/gris; métodos de pago sin azul.
- `npm run build` OK.
- **Pendiente**: QA visual en 390px y 1280px.

**Commit**: —
