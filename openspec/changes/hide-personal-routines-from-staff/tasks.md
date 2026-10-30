# Tasks

## 1. Migración RLS

- [x] 1.1 Escribir `supabase/migrations/20261029000001_staff_scope_training_plans.sql` con las 6 políticas (`training_plans_select/insert/update/delete`, `plan_exercises_select` y escritura) y verificar que se aplica sin error en DEV
- [x] 1.2 Verificar en `pg_policies` que la rama del staff quedó como `(kind = 'trainer' AND is_trainer_or_admin())` y que las políticas `members_personal_*` no cambiaron
- [x] 1.3 Registrar la versión `20261029000001` en `supabase_migrations.schema_migrations` y verificar que `supabase db push` no la reporte como pendiente

## 2. Servicio y UI

- [x] 2.1 Añadir `.eq('kind', 'trainer')` en `trainingService.getAll()` y verificar que el panel solo pide planes de entrenamiento
- [x] 2.2 Fijar `kind: 'trainer'` en `trainingService.duplicate()` y verificar que la copia se crea como plan de entrenamiento
- [x] 2.3 Ajustar el texto de cabecera de `/training-plans` y verificar que no promete gestionar rutinas de miembros
- [x] 2.4 Ejecutar `npm run build` y verificar que tsc + vite terminan sin errores

## 3. Verificación de comportamiento

- [x] 3.1 Verificar con JWT simulado (`set_config('request.jwt.claims')` + `set local role authenticated`) que un admin ve solo `kind='trainer'` y ninguna rutina personal
- [x] 3.2 Verificar que un admin obtiene 0 ejercicios al consultar una rutina personal por identificador
- [x] 3.3 Verificar que `UPDATE`/`DELETE` de una rutina personal y `UPDATE` de sus ejercicios afectan 0 filas como admin, usando datos desechables
- [x] 3.4 Verificar que el miembro dueño sigue leyendo su rutina personal y sus ejercicios sin cambios
- [x] 3.5 Verificar regresión del flujo staff (crear plan → insertar/actualizar ejercicio → borrar plan) y que no quedan datos de prueba

## 4. Documentación

- [x] 4.1 Registrar el ticket `TKT-OMEGYM-027` con la evidencia de DEV y la decisión en `knowledge/local/09_staff_plan_scope_decisions.md`
- [x] 4.2 Actualizar `incremental/SPEC_001_member_shared_routines.md` (regla 5 y criterio de aceptación) y la nota de `data/supabase/DATABASE_CONFIG.yaml`

## 5. Despliegue y cierre

- [ ] 5.1 Aplicar la migración en PROD con la credencial de la cuenta dueña, ejecutar `NOTIFY pgrst, 'reload schema'` y verificar las mismas comprobaciones de 3.1–3.4
- [ ] 5.2 Validación manual por el dueño: admin/entrenador no ven rutinas personales en `/training-plans`; el miembro conserva "Mis rutinas" y "Mi plan"
- [ ] 5.3 Cerrar `TKT-OMEGYM-027` con la evidencia de PROD y de la validación manual

## Workflow follow-up

- Archivar este change cuando el ticket esté cerrado y las comprobaciones de PROD documentadas.
- Verificar el resultado con `openspec validate hide-personal-routines-from-staff --strict` antes de archivar.
