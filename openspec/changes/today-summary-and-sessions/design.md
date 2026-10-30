# Design

## Context

Ver `proposal.md` — Why. Estado antes del cambio:

- `plan_exercises.day` es legacy desde TKT-029; no hay calendario a nivel de plan.
- `Inicio` (`/my-plan`) renderiza la lista plana del plan activo con tabs de plan, igual que `Entrenamiento`.
- `WorkoutSession` marca series en memoria, sin peso editable ni persistencia.
- `check_ins` es la única fuente real de actividad.
- El proyecto ya tiene RLS por miembro con traducción `profiles.auth_user_id → profiles.id`.

## Goals / Non-Goals

**Goals:**

- Responder "¿qué toca hoy?" con una acción inmediata.
- Programar rutinas por día sin reintroducir días por ejercicio.
- Guardar series con peso/reps y derivar racha y volumen.
- Mantener `Entrenamiento` como biblioteca intacta.

**Non-Goals:**

- Calendario mensual o reprogramación automática.
- RPE, tempo, descansos reales o temporizador.
- Acceso del staff a las sesiones.
- Historial detallado de sesiones (solo agregados por ahora).

## Decisions

**1. Programación a nivel plan, no por ejercicio.**
`plan_exercises.day` sigue muerto; `scheduled_days` vive en `training_plans`. Así una rutina se programa como unidad, que es como se usa en el gym, y no se contradice TKT-029.

**2. Prioridad cuando hay varias rutinas hoy.**
Asignadas primero, luego propias, luego por orden de carga (más reciente primero). Se ofrece "Otra rutina de hoy" en lugar de esconder las demás.

**3. Inicio no conserva la lista de ejercicios.**
Se muestra en un sheet temporal ("Ver rutina") y la biblioteca completa vive en Entrenamiento. Evita la duplicación que motivó el cambio.

**4. Sesión se guarda solo al finalizar.**
Se descartó crear la sesión al abrir: dejaría filas huérfanas si el usuario cierra. Al finalizar se inserta encabezado + series en dos llamadas y se calcula el volumen en el cliente y en el servidor (columna).

**5. Peso y reps editables en la sesión.**
La sesión prellena desde `set_details` y permite corregir. Sin esto el volumen no sería real. Las series sin reps se rechazan antes de guardar.

**6. RLS solo para el miembro.**
`workout_sessions` y `workout_sets` usan `auth_user_id` y pertenencia a la sesión. Se descartó dar lectura al staff para reducir superficie; si se necesita seguimiento, se añadirá con una política explícita.

**7. Estadísticas honestas.**
Racha y entrenos salen de sesiones; visitas de `check_ins`; volumen real de `workout_sets`, con el planeado como respaldo cuando aún no hay sesiones. Se etiqueta cada caso.

**8. Fechas locales.**
Semana de lunes a domingo en hora local del dispositivo; las consultas usan el lunes local convertido a ISO.

## Risks / Trade-offs

- **Sin rutina programada, Inicio no sugiere nada**: se resuelve con el estado de descanso y el acceso a Entrenamiento.
- **Sesiones huérfanas**: evitadas al insertar solo al finalizar.
- **Volumen planeado vs real**: etiquetas explícitas ("Levantado" / "Planeado").
- **RLS mal traducida en cuentas vinculadas**: se usa el patrón `auth_user_id` y se verificó con JWT simulado.
- **Migración pendiente en PROD**: mismo script; el token actual solo ve DEV.
- **Programación compartida**: `duplicate` copia `scheduled_days`; al importar una rutina no se copia (decisión: el import no programa).

## Migration Plan

1. Aplicar `20261029000003_plan_schedule_and_sessions.sql` en DEV.
2. Registrar la versión y verificar columna, tablas, índices y políticas.
3. Verificar RLS con JWT simulado (dueño, otro miembro, admin).
4. Repetir en PROD cuando haya credencial.
5. QA funcional: programar, aparecer en Inicio, entrenar y guardar.

## Open Questions

- Evaluar un historial de sesiones y un calendario mensual en un cambio posterior.
