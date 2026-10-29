# 13_exercise_notes_decisions.md

## Decisión: instrucciones por pasos y notas privadas por ejercicio

**Fecha**: 2026-10-29  
**Contexto**: Omega Gym — detalle de ejercicio, pestaña Indicaciones (TKT-OMEGYM-044/045)  
**Autor**: Dev asistido por IA, aprobado por el dueño del proyecto

### Problema

Las indicaciones del catálogo llegan como un párrafo único con oraciones separadas por punto. En la pestaña se mostraban como una tarjeta de texto, difícil de leer en móvil. Además, la imagen y el título solo estaban en `Resumen`, y no había forma de anotar nada sobre un ejercicio.

### Opciones Evaluadas

#### Instrucciones
1. **Parsear en cliente**: dividir por líneas, numeración inline o fin de oración. Sin migración y funciona con el catálogo actual.
2. **Estructurar en el backend**: agregar columnas o una tabla de pasos y migrar 1.300 ejercicios. Correcto a largo plazo, pero desproporcionado para el cambio.

#### Notas
1. **Tabla `exercise_notes`**: varias notas, sincronizadas, borrado individual y RLS privada.
2. **Una nota por ejercicio**: menos filas, pero sin historial de anotaciones.
3. **`localStorage`**: sin migración, pero no se sincroniza ni sobrevive al cambio de dispositivo.

### Decisión Final

- **Instrucciones**: opción 1. El parser (`lib/instructions.ts`) tolera párrafos, líneas y numeración inline; fusiona fragmentos cortos sin puntuación final y limita a 20 pasos.
- **Composición**: imagen/GIF y título pasan por encima de las pestañas, visibles en las tres. Se elimina el bloque duplicado de `Resumen`.
- **Notas**: opción 1. Tabla `exercise_notes` (miembro, ejercicio, texto, fecha) con RLS solo para el dueño. El staff no accede.
- **Borrado de notas**: directo, sin confirmación; son datos ligeros y de feedback inmediato.

### Aplicación

- Migración `20261029000005_exercise_notes.sql`.
- `services/exerciseNotes.service.ts`, `components/exercises/ExerciseNoteSheet.tsx`, `lib/instructions.ts`.
- `ExerciseDetail` carga ejercicio, estadísticas y notas en paralelo con `Promise.allSettled`.

### Consecuencia conocida

El parser no es perfecto con abreviaturas atípicas; se mitiga con la fusión de fragmentos y el límite de pasos. Si el catálogo se estructura en el futuro, se reemplaza el parser por los datos estructurados sin tocar la UI.

### Addendum (2026-10-29): reversión de notas

La sección de notas personales se retiró a solicitud del dueño el mismo día. Se eliminaron la UI, `ExerciseNoteSheet.tsx` y `exerciseNotes.service.ts`. La tabla `exercise_notes` se conserva en DEV sin uso (nunca se aplicó en PROD). Las instrucciones por pasos y el área superior común se mantienen.
