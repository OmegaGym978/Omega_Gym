# Design

## Context

Ver `proposal.md` — Why. Estado antes del cambio:

- `plan_exercises` guarda una fila por ejercicio con `sets` y `reps` agregados; no hay peso ni detalle por serie.
- El builder muestra una barra compacta con `3 × 12`, flechas de orden y papelera; un `ExerciseConfigSheet` edita series, reps, notas y enlace.
- `Mi plan`, el detalle de `/training-plans` y `WorkoutSession` leen `sets`/`reps` para pintar `3 × 12` y las series a marcar.
- `import_routine_by_code` copia los ejercicios con una lista explícita de columnas; cualquier columna nueva debe añadirse allí.
- El acento es intercambiable; el default es coral y no hay azul de interfaz.

## Goals / Non-Goals

**Goals:**

- Planificar peso y reps por serie sin romper las vistas existentes.
- Mantener intactas las políticas RLS y el flujo de compartir/importar.
- Interfaz densa pero táctil: filas de 44px, inputs numéricos con teclado adecuado.

**Non-Goals:**

- Registrar entrenamientos reales (peso levantado, RPE, temporizador).
- Convertir unidades kg ⇄ lb.
- Mostrar el detalle por serie fuera del builder.
- Cambiar el modelo de asignación de planes.

## Decisions

**1. JSONB en `plan_exercises` en lugar de una tabla hija.**
Una tabla `plan_exercise_sets` obligaría a políticas RLS propias, a reescribir la copia del RPC y a more joins en todas las lecturas. El JSONB mantiene una fila por ejercicio, no toca RLS y el RPC solo añade una columna al `INSERT ... SELECT`.

**2. Los agregados siguen siendo la fuente para el resto de la app.**
En cada guardado se recalculan `sets` y `reps` desde `set_details`. Se descartó migrar todas las vistas al JSONB: multiplicaría el alcance y no aporta nada mientras solo el builder muestra el detalle.

**3. Inputs como texto, números al guardar.**
`BuilderSet` guarda `weight` y `reps` como `string` para permitir vacío, decimales en curso (`12.`) y borrar sin saltos. `parseSetNumber` convierte con coma o punto, rechaza negativos y limita a 9999.

**4. Filas vacías se descartan; peso sin reps es error.**
Una fila sin peso ni reps no se guarda. Peso con reps vacías bloquea el guardado con aviso, porque produce un dato ambiguo. Si el usuario deja todas vacías, el ejercicio queda con `sets = 0` y `reps = null` (se muestra `—`).

**5. KGS fijo.**
Decisión del proyecto: la columna se rotula `KGS` y no hay preferencia ni conversión. Menos estado y menos errores de interpretación.

**6. Una serie inicial.**
Al agregar un ejercicio se crea una serie con `reps = 12` y peso vacío; `+ Agregar serie` copia peso y reps de la última fila. Se descartó crear tres series: el usuario suele ajustar el número real y las filas vacías extra ensucian la tarjeta.

**7. El menú `⋮` absorbe el orden y el borrado.**
Mover arriba/abajo, enlace de referencia y quitar. Se eliminan las flechas y la papelera de la barra compacta. Nota y descanso quedan en sus píldoras para acceso directo.

**8. `ExerciseConfigSheet` desaparece.**
Series/reps pasan a la fila; notas, descanso y enlace a un `ExerciseMetaSheet` con modos. Mantener ambos duplicaría la edición y la validación.

**9. Sin "aplicar a todas" en esta versión.**
El chevron del encabezado `REPS` es indicativo. La acción de copiar a todas las series se evaluará si el uso lo pide; evita complejidad no solicitada.

## Risks / Trade-offs

- **JSONB sin esquema estricto** → `CHECK` de tipo arreglo + validación en el servicio (finitos, no negativos, máx. 9999).
- **RPC desincronizado entre entornos** → la migración recrea la función y se debe aplicar en DEV y PROD; verificar un import real.
- **Agregados desincronizados** → se calculan siempre desde `set_details` al guardar, nunca a mano.
- **Tarjetas altas** → filas de 44px y sin scroll interno; aceptable para 3–5 series.
- **Pérdida de datos por eliminar el sheet** → cubrir nota, descanso y enlace en `ExerciseMetaSheet` antes de borrarlo (hecho).
- **Rutinas antiguas** → se generan filas desde `sets`/`reps` y se guardan como `set_details` al editar.

## Migration Plan

1. Aplicar `20261029000002_plan_exercise_set_details.sql` en DEV.
2. Verificar la restricción y el RPC con una importación real entre dos cuentas.
3. Aplicar en PROD con el mismo SQL y recargar PostgREST.
4. Validación manual del builder y de las vistas agregadas.

## Open Questions

- Ninguna bloqueante. Queda evaluar "aplicar a todas las series" y el detalle por serie en Mi plan como mejoras posteriores.
