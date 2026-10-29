# TKT-OMEGYM-032: Fundación móvil: tokens, acento intercambiable y átomos

## Metadata
- **Tipo**: Refactoring (sistema de diseño)
- **Prioridad**: Alta
- **Estado**: Review
- **Módulo**: design-system
- **Relacionado con**: `openspec/changes/mobile-native-shell/`
- **OpenSpec change**: `mobile-native-shell` → capability `design-system`
- **Fecha apertura**: 2026-10-29
- **Fecha cierre**: —

## Descripción
La app usaba un esqueleto de panel web: fondo `#0f0f0f`, radios pequeños, botones rectangulares, inputs con borde marcado y un azul de interfaz. Faltaban tokens que sí se usaban en el código (`bg-surface3`, `text-text-4`), y el acento estaba fijado en 19 hexadecimales repartidos entre CSS y TSX.

Este ticket construye la base: escala neutra nueva, radios semánticos, **acento intercambiable** con presets (coral por defecto), contraste por preset y átomos rediseñados.

## Dependencias
- **Bloqueado por**: —
- **Bloquea a**: TKT-OMEGYM-033, 034, 035 y 036

## Archivos Afectados
- `src/index.css` (reescrito)
- `src/store/accent.store.ts` (nuevo)
- `src/main.tsx`
- `src/components/ui/atoms/{Button,Input,Badge,Chip,MetricCard}.tsx`
- `src/pages/settings/SettingsModal.tsx`
- `src/lib/helpers.ts`
- `src/lib/exercise-labels.ts` (sin cambios funcionales)

## Implementación
- [x] Escala neutra y radios en `@theme`; `--bg` negro puro en oscuro
- [x] Presets de acento (`coral`, `ember`, `violet`, `teal`, `lime`, `amber`) con `--accent-rgb` y `--accent-contrast`
- [x] Store de acento persistido y aplicado por `data-accent`
- [x] Selector de swatches en Ajustes
- [x] Azul eliminado del tema y de sus usos (badges, KPIs, avatares, métodos de pago)
- [x] Hex de acento migrados a `rgba(var(--accent-rgb), α)`
- [x] Átomos: botón píldora con contraste, inputs nativos (16px en móvil), badges/chips redondeados, MetricCard `rounded-2xl`

## Criterios de aceptación
- [ ] Al cambiar el acento en Ajustes, toda la interfaz se recolorea sin recargar y persiste tras refrescar.
- [ ] Con acentos claros (lima/ámbar) el texto del botón primario es oscuro y legible.
- [ ] No queda ningún color azul de interfaz ni hex de acento suelto.
- [ ] Los campos de texto no provocan zoom en móvil.
- [ ] Tema claro y oscuro siguen funcionando.
- [x] `npm run build` sin errores.

## Evidencia de Cierre
**Fecha**: 2026-10-29  
**Probado por**: Dev asistido por IA  
**Resultado**:
- `src/index.css` reescrito con escala neutra completa y presets de acento.
- `accent.store.ts` aplica `data-accent` al documento y persiste en `localStorage`.
- `SettingsModal` incluye selector de 6 acentos; roles sin azul.
- Átomos actualizados; `--radius`/`--radius-sm` suben a 16/12px.
- `npm run build` OK (141 módulos).
- **Pendiente**: QA visual en móvil y tema claro.

**Commit**: —
