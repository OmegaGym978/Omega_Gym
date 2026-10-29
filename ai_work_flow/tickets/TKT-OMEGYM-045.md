# TKT-OMEGYM-045: Notas fijadas del ejercicio

## Metadata
- **Tipo**: Feature (datos + UI)
- **Prioridad**: Media
- **Estado**: Closed (funcionalidad retirada)
- **Módulo**: exercise-notes
- **Relacionado con**: `openspec/changes/exercise-instructions-notes/`
- **OpenSpec change**: `exercise-instructions-notes`
- **Ticket Externo**: — (solicitud directa del dueño del proyecto)
- **Fecha apertura**: 2026-10-29
- **Fecha cierre**: 2026-10-29

## Descripción
Se añade una sección de notas personales al final de `Indicaciones`:

- Separador sutil, etiqueta `Notas fijadas del ejercicio` en gris y acción `Añadir nota` en acento.
- Hoja inferior con textarea (máx. 1000 caracteres).
- Listado de notas con fecha y borrado individual.
- Persistencia en `exercise_notes` con RLS privada por miembro.

## Dependencias
- **Bloqueado por**: TKT-OMEGYM-044
- **Bloquea a**: —

## Archivos Afectados
- `supabase/migrations/20261029000005_exercise_notes.sql`
- `src/services/exerciseNotes.service.ts` (nuevo)
- `src/components/exercises/ExerciseNoteSheet.tsx` (nuevo)
- `src/pages/member/ExerciseDetail.tsx`

## Implementación
- [x] Tabla `exercise_notes` con índice y CHECK de longitud
- [x] RLS de lectura/escritura solo para el dueño
- [x] Migración aplicada en DEV y registrada
- [x] RLS verificada con JWT simulado
- [x] Servicio listar/añadir/eliminar
- [x] Hoja de nota y listado con fecha
- [x] Carga de notas en paralelo con el detalle
- [ ] Migración aplicada en PROD
- [ ] Prueba manual ejecutada

## Criterios de aceptación
- [ ] `Añadir nota` guarda y la nota aparece con fecha.
- [ ] Las notas se listan de la más reciente a la más antigua.
- [ ] Borrar una nota la elimina de la lista y de la base.
- [ ] Otro miembro y el staff no ven las notas.
- [ ] Sin notas: aviso discreto.
- [x] `npm run build` y `openspec validate` OK.

## Evidencia de Cierre
**Fecha**: 2026-10-29  
**Probado por**: Dev asistido por IA (JWT simulado vía Management API)  
**Resultado**:

| Verificación RLS | Resultado |
|---|---|
| Dueño ve su nota | ✅ 1 |
| Otro miembro ve la nota | ✅ 0 |
| Admin ve la nota | ✅ 0 |
| Otro miembro inserta a nombre del dueño | ✅ rechazado (42501) |
| Dueño elimina su nota | ✅ 0 restantes |
| Limpieza de datos de prueba | ✅ 0 |

- Migración `20261029000005` aplicada en DEV y registrada.
- Tabla con 4 políticas y RLS habilitada.
- `npm run build` OK (158 módulos) y `openspec validate` OK.
- **Pendiente**: PROD y QA funcional de notas.

**Commit**: —

## Reversión (2026-10-29)

El dueño del proyecto solicitó retirar toda la sección de notas del detalle. Se eliminó:
- el bloque de UI (divisor, etiqueta, `Añadir nota` y listado),
- `src/components/exercises/ExerciseNoteSheet.tsx`,
- `src/services/exerciseNotes.service.ts`.

La tabla `exercise_notes` se conserva en DEV (vacía) y se documenta como no usada; PROD nunca la tuvo. La funcionalidad de instrucciones por pasos del TKT-OMEGYM-044 se mantiene intacta.
