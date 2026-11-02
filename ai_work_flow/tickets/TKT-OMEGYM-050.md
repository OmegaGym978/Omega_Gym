# TKT-OMEGYM-050: Dejar la huella/check-in fuera de producción

## Metadata
- **Tipo**: Mejora (release gating)
- **Prioridad**: Alta
- **Estado**: Review
- **Módulo**: fingerprint / check-ins
- **Relacionado con**: `SPECIFICATION.md` (§11.2 Gestión de Miembros, §14 Componentes)
- **Ticket Externo**: — (solicitud directa del dueño del proyecto: "la pantalla de huella déjala fuera de prod, aún no está liberada")
- **Fecha apertura**: 2026-11-02
- **Fecha cierre**: —

## Descripción

La huella/check-in aún no se libera al público. El registro de huella ya estaba
gateado (`/fingerprint` con `import.meta.env.DEV` y sus entradas de menú), pero
quedaban tres huecos:

1. El kiosko `/check-in` ("Check-in con huella dactilar") era **público en producción**: cualquiera con la URL abría la pantalla (los `INSERT` en `check_ins` sí estaban protegidos por RLS).
2. `/my-checkins` ("Mi asistencia") seguía existiendo como ruta en producción, aunque sin enlace en el menú.
3. La ficha del miembro mostraba pestaña, KPI, tarjeta de "Actividad reciente" y consultaba `check_ins`, y `Mi plan` mostraba el KPI "Visitas". En producción eso se ve como un 0 permanente o como una sección vacía de una función no liberada.

Además, aunque las rutas estuvieran gateadas, `Fingerprint.tsx`, `CheckIn.tsx` y
`MyCheckins.tsx` se importaban estáticamente y **viajaban en el bundle de producción**.

## Alcance

**Dentro**
- Flag único `FINGERPRINT_ENABLED` en `src/lib/features.ts`.
- Rutas, menú y consumidores apagados en producción.
- Pantallas fuera del bundle de producción (stub vía alias de Vite en `vite build`).
- Redirecciones en producción: `/fingerprint` → `/dashboard`, `/check-in` → `/`, `/my-checkins` → `/my-profile`.

**Fuera**
- Borrar las pantallas, el servicio o la tabla `check_ins` (se quedan para dev y para cuando se libere).
- Cambios de esquema, RLS o datos: **no hay migración**.
- El feed de actividad del Dashboard (`dashboard.service.ts`): es data-driven y en producción no hay filas de `check_ins`, así que no muestra nada.

## Dependencias
- **Bloqueado por**: —
- **Bloquea a**: la liberación de la huella (mismo ticket al revertir el flag).

## Archivos Afectados
- `src/lib/features.ts` (nuevo)
- `src/lib/unreleased-stub.tsx` (nuevo)
- `src/App.tsx`
- `src/components/layout/nav-config.ts`
- `src/pages/dashboard/MemberDetail.tsx`
- `src/pages/member/MyPlan.tsx`
- `src/services/sessions.service.ts`
- `vite.config.ts`

## Implementación
- [x] Flag único `FINGERPRINT_ENABLED = import.meta.env.DEV`
- [x] Rutas con `lazy()` condicional y `unreleasedElement()` (redirección en prod)
- [x] `<Suspense>` envolviendo `<Routes>`
- [x] Menú (hoja "Más" y sección "Gestión") leyendo el flag
- [x] Ficha del miembro: sin pestaña, sin KPI, sin tarjeta de actividad y sin consultar `check_ins` en prod
- [x] `Mi plan`: sin KPI "Visitas"; `getWeeklyStats` no consulta `check_ins` en prod
- [x] Alias de Vite a `unreleased-stub.tsx` en `vite build` (código fuera del bundle)

## Criterios de Aceptación
- [x] `npm run build` **no** emite chunks de `Fingerprint`, `CheckIn` ni `MyCheckins`; sólo `unreleased-stub`.
- [x] `dist/assets/*.js` no contiene "Registro de Huella Dactilar", "Check-in con huella", "Tus visitas al gym" ni "Check-ins en el período".
- [x] `npm run build` y `npm run lint` pasan sin errores ni warnings.
- [x] En `npm run dev` las tres pantallas siguen sirviéndose reales (`/src/pages/dashboard/Fingerprint.tsx` → 200) y el menú muestra "Huella".
- [ ] En build de producción (`npm run preview`): `/fingerprint` → `/dashboard`, `/check-in` → `/`, `/my-checkins` → `/my-profile`; sin "Huella" en el menú; ficha sin pestaña Check-ins; sin peticiones a `check_ins`.

## Evidencia de Cierre
**Fecha**: 2026-11-02 (parcial — falta la pasada manual sobre `npm run preview`)
**Probado por**: Agente (build/lint/dev) — validación visual pendiente del dueño
**Resultado**:
- `npm run build` ✓ 9.5 s. Assets emitidos: sin `Fingerprint-*`, `CheckIn-*`, `MyCheckins-*`; se emite `unreleased-stub-D2q4tZvh.js`.
- Búsqueda de marcadores de texto de las tres pantallas en `dist/assets/*.js` y `dist/sw.js`: sin coincidencias (los únicos "fingerprint" restantes son el literal del enum `method` de `check_ins`).
- `npm run lint` (`eslint . --max-warnings 0`) ✓ sin salida.
- Servidor de desarrollo (puerto 5288): `/src/App.tsx` → 200 con `import("/src/pages/dashboard/Fingerprint.tsx")` intacto (el alias no aplica en `serve`) y `/src/pages/dashboard/Fingerprint.tsx` → 200.
**Commit**: `feat(fingerprint): dejar huella/check-in fuera de producción (#TKT-OMEGYM-050)`

## Notas de liberación (cuando se decida publicar)
1. Cambiar `FINGERPRINT_ENABLED` a `true` en `src/lib/features.ts`.
2. Verificar el alta de huella (`/fingerprint`) y el kiosko `/check-in`.
3. Validar el `INSERT` en `check_ins` con sesión de `trainer`/`admin` (política `check_ins_insert`).
4. Revisar que `Mi plan` vuelva a mostrar "Visitas" y la ficha la pestaña Check-ins.
