# TKT-OMEGYM-042: Lista de ejercicios y ejercicios personales

## Metadata
- **Tipo**: Feature (UI + datos)
- **Prioridad**: Alta
- **Estado**: Review
- **Módulo**: exercise-library
- **Relacionado con**: `openspec/changes/member-exercise-library/`
- **OpenSpec change**: `member-exercise-library` → capability `exercise-library`
- **Ticket Externo**: — (solicitud directa del dueño del proyecto)
- **Fecha apertura**: 2026-10-29
- **Fecha cierre**: —

## Descripción
El acceso "Ejercicios" del Perfil solo mostraba un aviso. Se implementa la primera pantalla del flujo:

- Ruta `/my-profile/exercises` con volver, título centrado y `Crear`.
- Buscador y filtros `Todo el Equipamiento` / `Todos los Músculos`.
- Celdas nativas con imagen circular, nombre/músculo, chevron y divisor.
- Creación de ejercicios personales (solo visibles para su dueño) mediante una hoja inferior.

## Dependencias
- **Bloqueado por**: TKT-OMEGYM-032/033 (átomos y shell), TKT-OMEGYM-041 (`workout_sets` para el detalle)
- **Bloquea a**: TKT-OMEGYM-043

## Archivos Afectados
- `supabase/migrations/20261029000004_custom_exercises.sql`
- `src/pages/member/MyExercises.tsx`
- `src/components/exercises/CreateExerciseSheet.tsx`
- `src/components/exercises/ExerciseFilterSheet.tsx`
- `src/services/exercises.service.ts`
- `src/App.tsx`, `src/pages/member/MyProfile.tsx`
- `src/components/routine-builder/ExerciseMultiPicker.tsx` (filtro compartido)

## Implementación
- [x] `created_by` en `exercises` con índice
- [x] RLS de lectura global/propia y escritura propia
- [x] FK `plan_exercises.exercise_id` a `ON DELETE SET NULL`
- [x] Migración aplicada en DEV y registrada
- [x] RLS verificada con JWT simulado
- [x] Lista con búsqueda, filtros, paginación y estados
- [x] Creación de ejercicio personal
- [x] Rutas y acceso desde el Perfil
- [ ] Migración aplicada en PROD
- [ ] Prueba manual de UI ejecutada

## Criterios de aceptación
- [ ] "Ejercicios" abre la lista; buscar y filtrar actualiza los resultados.
- [ ] Las filas muestran imagen, nombre, músculo, chevron y separador.
- [ ] Crear un ejercicio lo muestra en la lista y en el selector de rutinas.
- [ ] El ejercicio personal solo lo ve su dueño; otro miembro no.
- [ ] Eliminar un ejercicio propio no rompe rutinas (FK `SET NULL`).
- [x] `npm run build` y `openspec validate` OK.

## Evidencia de Cierre
**Fecha**: 2026-10-29  
**Probado por**: Dev asistido por IA (JWT simulado vía Management API)  
**Resultado**:

| Verificación RLS | Resultado |
|---|---|
| Dueño ve su ejercicio personal | ✅ 1 |
| Otro miembro lo ve | ✅ 0 |
| Admin lo ve | ✅ 1 |
| Catálogo global visible para otro miembro | ✅ 1324 |
| Dueño actualiza su ejercicio | ✅ 1 |
| Otro miembro actualiza el ajeno | ✅ 0 |
| Miembro inserta un ejercicio global | ✅ rechazado (42501) |
| FK `plan_exercises → exercises` | ✅ `ON DELETE SET NULL` |
| Limpieza de datos de prueba | ✅ 0 |

- Migración `20261029000004` aplicada en DEV y registrada en `schema_migrations`.
- `npm run build` OK (155 módulos) y `openspec validate` OK.
- **Pendiente**: PROD y QA visual.

**Commit**: —
