# TKT-OMEGYM-038: Tokens y átomos con apariencia iOS

## Metadata
- **Tipo**: Refactoring (sistema de diseño)
- **Prioridad**: Alta
- **Estado**: Review
- **Módulo**: design-system
- **Relacionado con**: `openspec/changes/ios-native-components/`
- **OpenSpec change**: `ios-native-components` → capability `ios-components`
- **Fecha apertura**: 2026-10-29
- **Fecha cierre**: —

## Descripción
Los átomos reutilizables aún tenían medidas y estados de escritorio: botones de 40 px con `hover`, inputs con borde, tarjetas con borde y sombra, un switch custom y checks con estilos inline.

Se sube la escala de superficies a zinc-900/800/700, se añade un token de separador y se rediseñan los átomos con objetivos táctiles, feedback por opacidad y foco en el acento.

## Dependencias
- **Bloqueado por**: —
- **Bloquea a**: TKT-OMEGYM-039

## Archivos Afectados
- `src/index.css`
- `src/components/ui/atoms/{Button,Input,IconButton,Card,Switch,Checkmark}.tsx`
- `src/lib/helpers.ts` (sin cambios funcionales)

## Implementación
- [x] Superficies zinc-900/800/700 y token `divider` (oscuro y claro)
- [x] `Button` con variantes `primary/secondary/ghost/plain/danger` y alturas `h-10/h-12/h-14`
- [x] `Input/Textarea/Select` sin borde, 17 px y foco con ring
- [x] `Card` reutilizable sin borde ni sombra
- [x] `Switch` nativo y `Checkmark` circular
- [x] `IconButton` sin borde y con feedback táctil
- [x] `npm run build` sin errores

## Criterios de aceptación
- [ ] Ningún botón primario mide menos de 48 px y todos son píldora.
- [ ] Los botones bajan la opacidad al presionar y no usan hover.
- [ ] Los inputs no tienen borde, usan zinc-900, 17 px y placeholder zinc-500.
- [ ] Las tarjetas son zinc-900, `rounded-2xl/3xl`, sin sombra.
- [ ] El switch activo se pinta con el acento y expone `role="switch"`.
- [ ] Los acentos claros mantienen texto de contraste en los botones.
- [x] `npm run build` sin errores.

## Evidencia de Cierre
**Fecha**: 2026-10-29  
**Probado por**: Dev asistido por IA  
**Resultado**:
- Tokens actualizados en `index.css` (superficies y divisor).
- Átomos reescritos: `Button`, `Input`, `IconButton`, `Card`, `Switch`, `Checkmark`.
- `npm run build` OK (147 módulos).
- **Pendiente**: QA visual de contraste y tamaños en móvil.

**Commit**: —
