# Tasks

## 1. Datos

- [x] 1.1 Migración `20261029000003_plan_schedule_and_sessions.sql` (scheduled_days + CHECK + GIN)
- [x] 1.2 Tablas `workout_sessions` y `workout_sets` con índices
- [x] 1.3 RLS de sesiones y series (solo el miembro dueño)
- [x] 1.4 Aplicar en DEV y registrar la versión en `schema_migrations`
- [x] 1.5 Verificar RLS con JWT simulado (dueño, otro miembro, admin)
- [ ] 1.6 Aplicar en PROD (token actual solo expone DEV)

## 2. Tipos y servicios

- [x] 2.1 `scheduled_days` en `TrainingPlan`, `PlanListItem` y `RoutineListItem`
- [x] 2.2 `trainingService.setSchedule`, copia de días en `duplicate` y creación/edición
- [x] 2.3 `sessions.service`: `saveSession` y `getWeeklyStats` (racha, visitas, volumen)
- [x] 2.4 `lib/dates.ts` (día local, lunes de la semana, formato de días)

## 3. Programación

- [x] 3.1 `ScheduleSheet` con 7 días y guardado
- [x] 3.2 Menú "Programar días" en Entrenamiento (rutinas propias)
- [x] 3.3 Acción "Programar días" en el detalle de Planes (staff)
- [x] 3.4 Etiqueta de días en tarjetas de rutina y plan

## 4. Inicio

- [x] 4.1 Reescribir `MyPlan` como Resumen de Hoy
- [x] 4.2 Hero con rutina programada + `Empezar rutina` + `Ver rutina`
- [x] 4.3 Estado de descanso con racha, visitas y volumen
- [x] 4.4 Selector "Otra rutina de hoy"
- [x] 4.5 Estado sin rutinas con acceso a Entrenamiento

## 5. Sesión

- [x] 5.1 `WorkoutSession` con peso/reps editables prellenados desde `set_details`
- [x] 5.2 Marcar series, progreso y validación de reps
- [x] 5.3 Guardado al finalizar con volumen y series
- [x] 5.4 No guardar si se cierra sin finalizar o sin series marcadas
- [x] 5.5 Recargar estadísticas tras guardar

## 6. Verificación

- [x] 6.1 `npm run build` sin errores
- [x] 6.2 `openspec validate --strict`
- [ ] 6.3 QA funcional: programar → Inicio → entrenar → guardar → racha/volumen
- [ ] 6.4 QA visual en móvil y escritorio
- [ ] 6.5 Validación del dueño y cierre de TKT-040/041
