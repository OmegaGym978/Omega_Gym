# 21_unreleased_features_decisions.md

## Decisión: cómo se apaga una función que aún no se libera

**Fecha**: 2026-11-02
**Contexto**: Omega Gym — huella/check-in no liberados (TKT-OMEGYM-050)
**Autor**: Agente (a solicitud del dueño del proyecto)

### Problema

La huella dactilar y el check-in todavía no se publican, pero parte del feature
seguía visible en producción: el kiosko `/check-in` era una ruta pública, la
pestaña "Check-ins" de la ficha del miembro y el KPI "Visitas" de `Mi plan`
seguían existiendo, y las tres pantallas viajaban en el bundle aunque sus rutas
estuvieran gateadas con `import.meta.env.DEV`.

Un gate sólo de rutas no alcanza por dos motivos: los **consumidores** (ficha,
KPI, consultas al servicio) muestran secciones vacías o ceros permanentes que se
leen como bugs, y el **código** sigue en el bundle porque `lazy(() => import(...))`
crea un chunk aunque la rama sea inalcanzable.

### Opciones Evaluadas

#### Opción 1: Flag de build + consumidores apagados + alias a stub
**Pros**:
- ✅ Un solo punto para liberar (`FINGERPRINT_ENABLED`).
- ✅ El código de las pantallas no viaja en el bundle de producción (verificado).
- ✅ Producción no consulta `check_ins`, así que no hay peticiones ni errores por una función no liberada.
- ✅ Sin cambios de esquema ni de RLS: la base conserva lo necesario para el día de la liberación.

**Contras**:
- ❌ Hay que mantener la lista `UNRELEASED_PAGES` en `vite.config.ts` sincronizada con el flag.

#### Opción 2: Gate sólo de rutas (`import.meta.env.DEV && <Route .../>`)
**Pros**:
- ✅ Trivial de implementar.

**Contras**:
- ❌ Deja los consumidores mostrando secciones/ceros de una función no liberada.
- ❌ El bundle de producción sigue incluyendo las pantallas.
- ❌ Ya existía y fue justamente lo que dejó huecos (kiosko público, `/my-checkins` accesible).

#### Opción 3: Borrar el feature del código
**Pros**:
- ✅ Nada que gatear.

**Contras**:
- ❌ Se pierde trabajo ya probado y habría que rehacerlo al liberar.
- ❌ Obligaría a tocar tabla y RLS de `check_ins`.

### Decisión Final
**Selección**: Opción 1.

**Razones**:
1. El gate es de **build**, no de datos: `import.meta.env.DEV` es `false` en cualquier `vite build` (producción y previews de Vercel) y `true` en el servidor de desarrollo.
2. Los consumidores se apagan junto con las rutas para no mostrar features vacías.
3. El alias de Vite (`command !== 'serve'`) garantiza que el código real no entre al grafo de producción; los `import()` dinámicos en ramas muertas por sí solos **no** se eliminan (se comprobó en el primer build: emitía `Fingerprint-*.js`, `CheckIn-*.js`, `MyCheckins-*.js`).
4. No hay migración: tabla `check_ins`, servicio y RLS siguen vigentes para dev.

### Regla para el futuro

Al agregar una pantalla de una función no liberada:
1. `src/lib/features.ts` — flag nuevo (o reutilizar el existente).
2. `src/App.tsx` — `lazy()` condicional + `unreleasedElement(Page, redirect)`.
3. `src/components/layout/nav-config.ts` — entrada de menú detrás del flag.
4. Consumidores (ficha, KPIs, servicios) — apagados con el mismo flag.
5. `vite.config.ts` — agregar la ruta del módulo a `UNRELEASED_PAGES`.
6. Verificar con `npm run build` que no se emite el chunk de la pantalla.

### Aplicación
- Implementar en: TKT-OMEGYM-050
- Archivos: `src/lib/features.ts`, `src/lib/unreleased-stub.tsx`, `src/App.tsx`,
  `src/components/layout/nav-config.ts`, `src/pages/dashboard/MemberDetail.tsx`,
  `src/pages/member/MyPlan.tsx`, `src/services/sessions.service.ts`, `vite.config.ts`
