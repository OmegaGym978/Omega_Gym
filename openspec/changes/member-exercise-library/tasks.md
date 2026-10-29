# Tasks

## 1. Datos

- [x] 1.1 `created_by` en `exercises` + índice + `COMMENT`
- [x] 1.2 RLS: lectura global/propia, insert/update/delete propios
- [x] 1.3 FK `plan_exercises.exercise_id` a `ON DELETE SET NULL`
- [x] 1.4 Aplicar en DEV y registrar la versión
- [x] 1.5 Verificar RLS con JWT simulado (propio, otro miembro, admin) y limpiar
- [ ] 1.6 Aplicar en PROD

## 2. Servicios y navegación

- [x] 2.1 `exercisesService.createCustom` y `deleteCustom`; `created_by` en el tipo
- [x] 2.2 `exerciseStatsService.getForExercise` (sesiones, PR, 1RM, volumen, historial)
- [x] 2.3 `ScreenHeader` con `centerTitle`
- [x] 2.4 Rutas `/my-profile/exercises` y `/my-profile/exercises/:id`
- [x] 2.5 Acceso desde la cuadrícula del Perfil
- [x] 2.6 `ExerciseFilterSheet` compartido y reutilizado por el picker

## 3. Lista

- [x] 3.1 Buscador, filtros y paginación
- [x] 3.2 Celdas con imagen circular, nombre/músculo, chevron y divisor
- [x] 3.3 `CreateExerciseSheet` y recarga tras crear
- [x] 3.4 Estados de carga, error y vacío

## 4. Detalle

- [x] 4.1 Tabs `Resumen`, `Historial`, `Indicaciones`
- [x] 4.2 GIF, título, músculo y tarjeta de progreso con estado vacío
- [x] 4.3 Píldoras `Mayor Peso`, `1RM`, `Mejor Volumen` y gráfico
- [x] 4.4 Récords personales e historial real
- [x] 4.5 Compartir y menú (agregar a rutina, ver historial, eliminar)
- [x] 4.6 Eliminar ejercicio propio con confirmación

## 5. Verificación

- [x] 5.1 `npm run build` sin errores
- [x] 5.2 `openspec validate --strict`
- [ ] 5.3 QA funcional: crear → listar → detalle → agregar a rutina → eliminar
- [ ] 5.4 QA visual en móvil y escritorio
- [ ] 5.5 Validación del dueño y cierre de TKT-042/043
