# TKT-OMEGYM-039: Hojas inferiores, listas agrupadas y barrido táctil

## Metadata
- **Tipo**: Refactoring (UI)
- **Prioridad**: Alta
- **Estado**: Review
- **Módulo**: design-system
- **Relacionado con**: `openspec/changes/ios-native-components/`
- **OpenSpec change**: `ios-native-components`
- **Fecha apertura**: 2026-10-29
- **Fecha cierre**: —

## Descripción
Cierra la adopción del lenguaje iOS: todos los modales pasan a hojas inferiores con indicador de arrastre, las listas de navegación/configuración usan celdas agrupadas, y se elimina el `hover` de escritorio dejando solo `lg:hover` en filas de tablas.

## Dependencias
- **Bloqueado por**: TKT-OMEGYM-038
- **Bloquea a**: —

## Archivos Afectados
- `src/components/ui/molecules/{BottomSheet,Modal,ConfirmSheet,ListGroup,ListTile,TabBar,SearchInput,ResponsiveTable}.tsx`
- `src/components/ui/layout/{MoreSheet,ScreenHeader}.tsx`
- `src/components/layout/NavigationDrawer.tsx`
- `src/pages/settings/SettingsModal.tsx`
- `src/components/routine-builder/{RoutineBuilder,ExerciseMultiPicker,ExerciseMetaSheet}.tsx`
- `src/pages/dashboard/{Members,Memberships,Payments,TrainingPlans,Dashboard}.tsx`
- `src/pages/member/{MyRoutines,MyPlan,MyProfile,MyCheckins}.tsx`
- `src/pages/auth/{Login,Register,ForgotPassword,ResetPassword}.tsx`

## Implementación
- [x] `BottomSheet` con `rounded-t-3xl`, drag handle y scroll interno
- [x] `Modal` como wrapper de `BottomSheet` (26 usos migrados sin tocar páginas)
- [x] `ConfirmSheet` y confirmación del builder migrada
- [x] `ListGroup`/`ListTile` en Ajustes, "Más" y selector de ejercicios
- [x] `Checkmark` en asignación de planes y selector de miembros
- [x] Headers de creación como texto plano en acento
- [x] Inputs de auth y `SearchInput` al estilo nativo
- [x] `TabBar` e `IconButton` sin borde
- [x] 87 `hover` eliminados; `lg:hover` solo en filas de tablas
- [x] 71 bordes de tarjetas y sombras de contenedores eliminados
- [x] Verificación de que ningún estado hover quedó aplicado permanentemente
- [x] `npm run build` sin errores

## Criterios de aceptación
- [ ] Los 26 modales abren como hoja inferior con handle y scroll.
- [ ] Ajustes usa switch nativo y celdas agrupadas.
- [ ] El selector de ejercicios usa celdas con divisor, avatar y marca circular.
- [ ] Las acciones de cabecera son texto plano en acento.
- [ ] No quedan efectos `hover` fuera de `lg:hover` en tablas.
- [ ] Las tablas de datos conservan tarjetas independientes en móvil.
- [ ] `npm run build` y `openspec validate --strict` OK.

## Evidencia de Cierre
**Fecha**: 2026-10-29  
**Probado por**: Dev asistido por IA  
**Resultado**:
- `Modal` delega en `BottomSheet`; todos los diálogos existentes se presentan como hoja.
- `SettingsModal` reescrito con `Switch`, `ListGroup` y swatches.
- `MoreSheet` y selector de ejercicios migrados a celdas agrupadas.
- `ResponsiveTable` conserva `lg:hover` en filas; el resto de la app sin hover.
- Barrido: 87 hover, 4 sombras y 71 bordes eliminados; se corrigieron los estilos de estado que quedaron permanentes tras el barrido.
- `npm run build` OK (147 módulos) y `openspec validate` OK.
- **Pendiente**: QA visual 360/390/768/1280, claro/oscuro y contraste de textos secundarios.

**Commit**: —
