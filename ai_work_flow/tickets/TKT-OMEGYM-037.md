# TKT-OMEGYM-037: Registro de series por ejercicio en el builder de rutinas

## Metadata
- **Tipo**: Feature (UI + datos)
- **Prioridad**: Media
- **Estado**: Review
- **Módulo**: routine-builder / training-plans
- **Relacionado con**: `openspec/changes/exercise-set-logging/`
- **OpenSpec change**: `exercise-set-logging`
- **Ticket Externo**: — (solicitud directa del dueño del proyecto)
- **Fecha apertura**: 2026-10-29
- **Fecha cierre**: —

## Descripción
El builder mostraba cada ejercicio como una barra compacta con el resumen `3 × 12`, derivado de dos columnas agregadas (`sets`, `reps`). No era posible planificar peso ni repeticiones distintas por serie.

Se sustituye por el patrón nativo de registro por series:

- Cabecera con imagen circular, nombre y menú `⋮` (mover arriba/abajo, enlace, quitar).
- Píldoras `Descanso: --` y `Nota` (escriben `rest_seconds` y `notes`).
- Encabezado `SERIE · KGS · REPS` y filas con número de serie e inputs de peso/reps.
- `+ Agregar serie` (copia la última) y eliminación de serie (mínimo una).
- `+ Agregar ejercicio` se mantiene en píldora de acento.

Persistencia en la nueva columna `plan_exercises.set_details` (JSONB), manteniendo `sets`/`reps` agregados para Mi plan, el detalle de Planes y la sesión.

## Dependencias
- **Bloqueado por**: TKT-OMEGYM-029 (builder de una página)
- **Bloquea a**: —

## Archivos Afectados
- `supabase/migrations/20261029000002_plan_exercise_set_details.sql` (nueva)
- `src/components/routine-builder/types.ts`
- `src/components/routine-builder/RoutineBuilder.tsx`
- `src/components/routine-builder/ExerciseMetaSheet.tsx` (nuevo)
- `src/components/routine-builder/ExerciseConfigSheet.tsx` (eliminado)
- `src/services/training.service.ts`
- `src/services/routines.service.ts`
- `src/pages/member/MyRoutines.tsx` (mapeo de edición)

## Implementación
- [x] Diseño / esquema definido
- [x] Migración escrita (columna, `CHECK` y RPC de importación)
- [x] Migración aplicada en DEV (2026-10-29, verificada)
- [ ] Migración aplicada en PROD (el token solo expone DEV)
- [x] Código implementado y tipado
- [x] Servicios de Supabase actualizados
- [x] Fallback temporal si la columna no existe (evita borrar ejercicios)
- [x] `npm run build` sin errores
- [ ] Prueba manual ejecutada

## Criterios de aceptación
- [ ] Agregar un ejercicio crea una tarjeta con una serie (`KGS` vacío, `REPS` 12).
- [ ] `+ Agregar serie` copia peso/reps de la anterior y renumera.
- [ ] Editar peso/reps persiste al guardar y se recupera al reabrir.
- [ ] `Descanso` guarda segundos y la píldora los muestra; `Nota` guarda y muestra indicador.
- [ ] `⋮` reordena, edita el enlace y elimina el ejercicio.
- [ ] Peso sin repeticiones bloquea el guardado con aviso.
- [ ] Filas vacías se descartan; el resumen `sets × reps` sigue visible en Mi plan y en Planes.
- [ ] Compartir e importar una rutina conserva las series.
- [ ] Una rutina antigua abre con filas generadas desde `sets`/`reps`.
- [x] `npm run build` sin errores.
- [x] `openspec validate exercise-set-logging --strict` OK.

## Evidencia de Cierre
**Fecha**: 2026-10-29  
**Probado por**: Dev asistido por IA  
**Resultado**:
- **DEV (`jaltwjcipyrnmvjkdqdp`): migración aplicada y verificada.**
  - `set_details` existe como `jsonb`.
  - `CHECK plan_exercises_set_details_is_array` presente.
  - `import_routine_by_code` copia `set_details` (verificado con `pg_get_functiondef`).
  - Versión `20261029000002` registrada en `supabase_migrations.schema_migrations`.
  - PostgREST recargado; `GET /rest/v1/plan_exercises?select=set_details` → **200** (antes 400/42703).
- **PROD (`xlawavqceyprraeyrmtm`): pendiente.** El token de Management API disponible solo expone `Omega_Gym` (DEV); se requiere un token de la cuenta dueña. También queda pendiente allí `20261029000001` (TKT-027).
- `PlanSet` en `training.service.ts`; `set_details` persistido en `upsertExercises`, `saveExercises` y `duplicate`.
- `RoutineBuilder` reescrito con tarjetas por ejercicio, píldoras, tabla de series y menú; `ExerciseMetaSheet` reemplaza a `ExerciseConfigSheet`.
- Una serie inicial (`reps` 12); `+ Agregar serie` copia la anterior; agregados recalculados al guardar.
- Fallback: si PostgREST responde 42703/PGRST204 por `set_details`, el guardado reintenta sin la columna en vez de dejar el plan sin ejercicios.
- Script reutilizable `scripts/apply-migration.mjs` (Management API, no imprime el token).
- `npm run build` OK (142 módulos).
- `openspec validate` OK.
- **Pendiente**: aplicar en PROD, verificar importación por código entre dos cuentas y QA visual.

**Commit**: —
