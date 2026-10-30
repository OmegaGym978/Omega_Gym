# TKT-OMEGYM-036: Auth, kiosko, modales y cierre del rediseño móvil

## Metadata
- **Tipo**: Feature (rediseño UI) + QA
- **Prioridad**: Media
- **Estado**: Review
- **Módulo**: app-shell / design-system
- **Relacionado con**: `openspec/changes/mobile-native-shell/`
- **OpenSpec change**: `mobile-native-shell`
- **Fecha apertura**: 2026-10-29
- **Fecha cierre**: —

## Descripción
Cierra el rediseño: autenticación con campos nativos y botón píldora, kiosko de check-in sobre negro puro, modales redondeados y barrido de radios en el resto de pantallas y componentes.

## Dependencias
- **Bloqueado por**: TKT-OMEGYM-032 y 033
- **Bloquea a**: —

## Archivos Afectados
- `src/components/layout/AuthLayout.tsx`
- `src/pages/auth/{Login,Register,ForgotPassword,ResetPassword}.tsx`
- `src/pages/kiosk/CheckIn.tsx`
- `src/components/ui/molecules/{Modal,SearchInput,TabBar,Pagination}.tsx`
- `src/components/ui/atoms/{IconButton,GoogleButton,LoadingSpinner}.tsx`
- `src/components/layout/PwaUpdateBanner.tsx`

## Implementación
- [x] Auth: tarjetas `rounded-3xl`, inputs `rounded-2xl` de 15px, botón píldora con contraste
- [x] AuthLayout centrado con `min-h-dvh`
- [x] Kiosko sobre negro puro y controles redondeados
- [x] Modal `rounded-3xl`, cierre circular
- [x] Barrido de radios en páginas y componentes
- [x] Banner PWA y avisos sin azul
- [x] `npm run build` sin errores

## Criterios de aceptación
- [ ] Login, registro y recuperación se ven nativos en móvil y no hacen zoom al enfocar.
- [ ] El botón primario de auth respeta el contraste del acento elegido.
- [ ] El kiosko mantiene su funcionamiento y el sensor sobre negro puro.
- [ ] Los modales tienen esquinas muy redondeadas y cierre accesible.
- [ ] No quedan `rounded-sm` en contenedores ni colores de interfaz fuera del tema.
- [ ] QA 360/390/768/1280 en claro y oscuro sin desbordes.
- [x] `npm run build` sin errores.

## Evidencia de Cierre
**Fecha**: 2026-10-29  
**Probado por**: Dev asistido por IA  
**Resultado**:
- Auth rediseñado; `AuthLayout` a `min-h-dvh` y toggle circular.
- Modales a `rounded-3xl`; buscadores y tab bars píldora.
- Kiosko actualizado sin cambios de lógica.
- Barrido de radios aplicado a 11 archivos.
- `npm run build` OK.
- **Pendiente**: QA visual multi-viewport y validación del dueño.

**Commit**: —
