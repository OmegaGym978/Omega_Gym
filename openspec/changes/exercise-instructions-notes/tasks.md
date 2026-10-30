# Tasks

## 1. Instrucciones

- [x] 1.1 `lib/instructions.ts` con líneas, numeración inline y fin de oración
- [x] 1.2 Fusionar fragmentos cortos sin puntuación final
- [x] 1.3 Lista numerada con números en acento, `space-y-5` y colores por token
- [x] 1.4 Estado vacío de instrucciones

## 2. Composición del detalle

- [x] 2.1 Imagen/GIF y título sobre las pestañas (común a las tres)
- [x] 2.2 `Resumen` comienza en la tarjeta de progreso
- [x] 2.3 Carga en paralelo de ejercicio y estadísticas
- [x] 2.4 Reemplazar colores literales (`zinc-200/400`) por tokens del tema

## 3. Reversión de notas

- [x] 3.1 Quitar la sección de notas de `ExerciseDetail`
- [x] 3.2 Eliminar `ExerciseNoteSheet.tsx` y `exerciseNotes.service.ts`
- [x] 3.3 Documentar la tabla `exercise_notes` como no usada

## 4. Verificación

- [x] 4.1 `npm run build` sin errores
- [x] 4.2 `openspec validate --strict`
- [x] 4.3 Sin referencias a `exerciseNotes` ni `ExerciseNoteSheet`
- [ ] 4.4 QA visual de las tres pestañas en tema claro y oscuro
- [ ] 4.5 Validación del dueño
