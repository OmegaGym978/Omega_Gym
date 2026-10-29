# 11_plan_schedule_and_sessions_decisions.md

## Decisión: programación semanal por plan y registro de sesiones

**Fecha**: 2026-10-29  
**Contexto**: Omega Gym — Inicio "Resumen de Hoy" (TKT-OMEGYM-040/041)  
**Autor**: Dev asistido por IA, aprobado por el dueño del proyecto

### Problema

`Inicio` duplicaba la biblioteca de `Entrenamiento`. No existía forma de saber "qué toca hoy" porque en TKT-029 se eliminó el reparto por días a nivel de ejercicio. Además, el shell de entrenamiento no guardaba nada: no había historial, racha ni volumen real.

### Opciones Evaluadas

#### Programación
1. **Días por plan (`training_plans.scheduled_days`)**: una rutina se programa como unidad; no contradice la eliminación del día por ejercicio.
2. **Selección manual diaria en `localStorage`**: sin migración, pero no hay nada programado hasta que el miembro elige y no se sincroniza.
3. **Rotación automática por día**: sin configuración, pero arbitraria.
4. **Plan asignado siempre**: simple, pero ignora rutinas propias y días.

#### Sesiones
1. **Persistir sesiones y series** (`workout_sessions` + `workout_sets`): permite volumen real, racha e historial.
2. **Solo UI**: cero datos, pero las estadísticas serían ficticias.

### Decisión Final

- **Programación**: opción 1. `scheduled_days` vive en `training_plans`; `plan_exercises.day` sigue legacy.
- **Sesiones**: opción 1. Se guardan al finalizar; no se crea nada si se cierra antes.
- **Privacidad**: RLS solo para el miembro dueño; el staff no accede a las sesiones.
- **Inicio**: solo Resumen de Hoy; la biblioteca permanece en Entrenamiento. El detalle del plan se consulta en una hoja temporal.

### Aplicación

- Migración `20261029000003_plan_schedule_and_sessions.sql`.
- `services/sessions.service.ts`, `lib/dates.ts`, `components/schedule/ScheduleSheet.tsx`.
- `MyPlan` reescrito; `WorkoutSession` con peso/reps y guardado.
- Programación en Entrenamiento (miembro) y Planes (staff).

### Consecuencia conocida

Una sesión cerrada sin finalizar no deja registro (decisión consciente para evitar filas huérfanas). El historial detallado por sesión queda para un cambio posterior; hoy solo se muestran agregados semanales.
