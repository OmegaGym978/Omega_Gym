# Tasks

## 1. Datos y servicio

- [x] 1.1 Extender `routinesService.getMine` para incluir los nombres de ejercicios ordenados por `order_index` en la misma consulta
- [x] 1.2 Propagar un estado de error con reintento en la pantalla (sin pantalla en blanco)

## 2. Pantalla Entrenamiento

- [x] 2.1 Reescribir `MyRoutines.tsx`: tarjetas `rounded-2xl`, título en negrita y resumen de ejercicios en una línea
- [x] 2.2 Botón `Empezar rutina` de ancho completo en acento, estilo píldora
- [x] 2.3 Menú `⋯` con editar, compartir, visibilidad en Mi plan y eliminar en dos pasos
- [x] 2.4 Mantener la sección de rutinas asignadas por el entrenador con el mismo lenguaje visual

## 3. Shell de sesión

- [x] 3.1 Crear `src/components/workout/WorkoutSession.tsx` (overlay, marca de series, progreso, finalizar)
- [x] 3.2 Mostrar aviso explícito de que la sesión no se guarda
- [x] 3.3 Conectar el botón `Empezar rutina` de rutinas propias y asignadas

## 4. Navegación

- [x] 4.1 Reestilizar `BottomNav` (base `--bg`, activo en acento, indicador y truncado)
- [x] 4.2 Renombrar `Mis rutinas` a `Entrenamiento` con icono de mancuerna en `MemberLayout`
- [x] 4.3 Cambiar `RootRedirect` del miembro a `/my-routines`

## 5. Verificación

- [x] 5.1 Comprobar la barra inferior en 360 px y en escritorio, con los 4–5 ítems
- [x] 5.2 Recorrer el shell de sesión con una rutina de varios ejercicios
- [x] 5.3 Verificar que editar, compartir, importar, cambiar visibilidad y eliminar siguen funcionando
- [x] 5.4 Ejecutar `npm run build` sin errores

## 6. Cierre

- [x] 6.1 Registrar el ticket `TKT-OMEGYM-030`
- [ ] 6.2 Validación manual del dueño del proyecto antes de cerrar el ticket
