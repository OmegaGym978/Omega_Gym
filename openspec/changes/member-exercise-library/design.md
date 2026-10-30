# Design

## Context

Ver `proposal.md` — Why. Estado antes del cambio:

- `exercises` es un catálogo global (`is_active`, sin dueño) con RLS "todos leen, admin escribe".
- El Perfil tiene una cuadrícula 2×2 con "Ejercicios" como placeholder.
- `ExerciseMultiPicker` ya resolvía búsqueda y filtros con `getEquipment`/`getMuscleGroups`.
- `workout_sets` guarda `exercise_id`, peso y reps; `workout_sessions` la fecha.
- `plan_exercises.exercise_id` referencia `exercises` sin acción de borrado.

## Goals / Non-Goals

**Goals:**

- Explorar el catálogo con el lenguaje visual del resto de la app.
- Permitir ejercicios personales sin romper la FK de rutinas y sesiones.
- Mostrar progreso real por ejercicio con estados vacíos honestos.
- Reutilizar filtros y componentes en lugar de duplicarlos.

**Non-Goals:**

- Editar ejercicios del catálogo global.
- Subir archivos a Storage (el GIF se ingresa por URL).
- Historial con detalle de cada serie (solo agregados por sesión).
- Que el staff vea ejercicios personales de miembros.

## Decisions

**1. Los ejercicios personales viven en `exercises` con `created_by`.**
Una tabla aparte rompería las FKs de `plan_exercises` y `workout_sets`. Se añade la columna y se reemplaza la política de lectura por "global o propio".

**2. RLS: el staff no ve ejercicios personales.**
La política de lectura exige `created_by IS NULL` o ser el dueño; el admin conserva su política `FOR ALL`. Los planes guardan `exercise_name` denormalizado, así que el staff no necesita leer el ejercicio para mostrar la rutina.

**3. Borrado seguro con `ON DELETE SET NULL`.**
El FK de `plan_exercises` no tenía acción y bloqueaba el borrado. Se recrea con `SET NULL`; `workout_sets` ya lo tenía.

**4. Título centrado como prop de `ScreenHeader`.**
Se añade `centerTitle` en lugar de crear cabeceras nuevas. El título se centra con posición absoluta y las acciones quedan a los lados.

**5. Filtros compartidos.**
`ExerciseFilterSheet` se extrae y lo usan tanto la lista como el selector de rutinas, evitando dos implementaciones del mismo filtro.

**6. Detalle con tabs y estados vacíos.**
`Resumen` muestra el GIF, el músculo, el progreso y los récords; `Historial` lista sesiones; `Indicaciones` muestra `instructions_es`. Si no hay datos, cada sección tiene su estado vacío.

**7. Estadísticas calculadas en cliente.**
Se consultan sesiones propias (máx. 200) y las series del ejercicio, y se agrega por sesión. Con el volumen actual no se justifica un RPC; si crece, se moverá a SQL.

**8. 1RM con Epley.**
`peso × (1 + reps/30)`. Se descartó Brzycki por simplicidad y comportamiento razonable en rangos altos.

**9. Acciones del menú.**
Agregar a una rutina propia (con 1 serie de 12), ver historial y eliminar si es propio. Compartir va en su propio icono.

## Risks / Trade-offs

- **Política de lectura del catálogo**: probada con JWT simulado (dueño, otro miembro, admin).
- **Ejercicio personal referenciado**: FK `SET NULL` evita el bloqueo; el historial conserva el nombre denormalizado.
- **Gráfico con pocas sesiones**: se muestran hasta 8 puntos; con uno solo sigue siendo legible.
- **Límite de 200 sesiones**: suficiente para el historial actual; documentado.
- **Migración pendiente en PROD**: la lista sigue funcionando con la política anterior; crear ejercicios fallará hasta aplicarla.

## Migration Plan

1. Aplicar `20261029000004_custom_exercises.sql` en DEV.
2. Verificar columna, políticas y FK `SET NULL`.
3. Probar RLS con JWT simulado y limpiar datos de prueba.
4. Repetir en PROD cuando haya credencial.
5. QA funcional de lista, creación, detalle y estadísticas.
