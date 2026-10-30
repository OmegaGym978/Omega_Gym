# Design

## Context

Ver `proposal.md` — Why. Estado relevante del sistema antes del cambio:

- `training_plans` distingue planes del staff (`kind = 'trainer'`, DEFAULT retrocompatible) de rutinas personales de miembros (`kind = 'personal'`, creadas en `/my-routines`).
- Las políticas de lectura (`training_plans_select`, `plan_exercises_select`) se construyeron por capas: traducción `auth_user_id → profiles.id` (cuentas vinculadas), soporte many-to-many vía `plan_assignments` y una rama final `is_trainer_or_admin()` sin condición de tipo.
- `is_admin()` / `is_trainer_or_admin()` son funciones `SECURITY DEFINER` sobre `profiles`, por lo que no generan recursión de RLS.
- Las rutinas personales nunca entran en `plan_assignments`, así que "asignaciones" y la ficha del miembro no dependen de ellas.
- El proyecto tiene dos proyectos Supabase: DEV (`jaltwjcipyrnmvjkdqdp`, con historial `supabase_migrations`) y PROD (`xlawavqceyprraeyrmtm`, sin historial de migraciones; se aplica SQL por Management API).

## Goals / Non-Goals

**Goals:**

- Que la restricción viva en la base de datos, no en la UI, de modo que aplique también a REST/PostgREST.
- Cero cambios de comportamiento para el rol `member`.
- Cero migración de datos y cero columnas nuevas.

**Non-Goals:**

- Moderación o inspección de rutinas personales por parte del staff (si algún día se necesita, se hará con un RPC `SECURITY DEFINER` explícito y auditado, nunca abriendo el `SELECT`).
- Cambiar el modelo de datos, `share_code`, `show_in_plan` o `plan_assignments.visible`.
- Reorganizar las políticas `members_personal_*`.

## Decisions

**1. Enforcement en RLS, no solo en el frontend.**
Alternativa descartada: filtrar únicamente en `trainingService.getAll()`. Se descartó porque deja la lectura abierta por API directa con el JWT del staff y contradice el criterio ya escrito en `SPEC_001` (aislamiento por RLS).

**2. El alcance del staff es `kind = 'trainer'`, no `created_by = yo`.**
Alternativa descartada: que cada usuario del staff vea solo lo que él creó. Rompe la colaboración admin↔entrenador y obliga a reescribir `duplicate()` (que copia `created_by` del original) para que la copia no desaparezca de la vista de quien la creó. Decisión confirmada con el dueño del proyecto.

**3. Se restringen también las escrituras del staff.**
Si el staff ya no puede leer una rutina personal, permitir su `UPDATE`/`DELETE` por identificador sería incoherente y peligroso. Las políticas de escritura del staff pasan a exigir `kind = 'trainer'`.

**4. Se modifica solo la rama del staff dentro de cada política.**
`OR (kind = 'trainer' AND is_trainer_or_admin())` sustituye a `OR is_trainer_or_admin()`, conservando las ramas de miembro (`created_by` propio, `assigned_to` legacy, `plan_assignments`). Así no se tocan las políticas `members_personal_*` y un miembro vinculado sigue funcionando igual. Beneficio colateral: el staff sigue pudiendo editar sus **propias** rutinas personales por la rama `created_by`, aunque no aparezcan en el panel.

**5. Se corrige la traducción `auth.uid() → profiles.id` en las políticas de escritura de `plan_exercises`.**
Las versiones previas comparaban `tp.created_by = auth.uid()`, roto para cuentas vinculadas. Al reescribir esas políticas se aplicó el patrón ya usado en lectura.

**6. Defensa en profundidad en el cliente.**
`trainingService.getAll()` añade `.eq('kind','trainer')` (evita depender solo de la política y comunica la intención) y `duplicate()` fija `kind: 'trainer'` en la copia.

**7. Aplicación en entornos con historial dispar.**
DEV usa historial de migraciones: la migración se aplicó por Management API en 4 bloques (el endpoint rechaza payloads grandes con 413) y luego se registró la versión `20261029000001` en `supabase_migrations.schema_migrations`, equivalente a `supabase migration repair --status applied`. Todas las sentencias usan `DROP POLICY IF EXISTS` + `CREATE POLICY`, por lo que reaplicar es idempotente.

## Risks / Trade-offs

- **Los KPIs del panel bajan** (dejan de contar rutinas personales) → es el comportamiento esperado; queda documentado en el ticket y en la spec.
- **Un admin/entrenador con rutinas personales propias** no las verá en `/training-plans` (sí en `/my-routines`) → aceptado: el panel es de gestión de planes de entrenamiento.
- **Subconsultas `EXISTS` extra por fila** en las políticas de lectura → tablas pequeñas; el índice `idx_training_plans_created_by_kind` cubre la rama propia y la de tipo. Sin impacto medible esperado.
- **Caché de PostgREST** puede servir el esquema previo tras el cambio → se ejecuta `NOTIFY pgrst, 'reload schema'` al terminar.
- **Rollback**: recrear las políticas tal como están en `20260704000001_rls_plan_assignments.sql` (SELECT) y `20260525000004_security_definer_rls.sql` (escritura). Documentado en la cabecera de la migración.
- **PROD pendiente**: el proyecto de producción no aparece en la cuenta del token de Management API disponible → requiere credencial de la cuenta dueña; el SQL es el mismo y es idempotente.

## Migration Plan

1. Aplicar `supabase/migrations/20261029000001_staff_scope_training_plans.sql` en DEV.
2. Registrar la versión en `supabase_migrations.schema_migrations` para que `supabase db push` no la considere pendiente.
3. Verificar con JWT simulado (`set_config('request.jwt.claims')` + `set local role authenticated`) que admin/entrenador solo ven `kind='trainer'` y que el dueño de una rutina personal no pierde acceso.
4. Regresión del flujo staff con datos desechables (crear plan → ejercicios → borrar).
5. Repetir 1–4 en PROD con la credencial correspondiente y recargar PostgREST.
6. Validación manual de UI por el dueño del proyecto antes de cerrar el ticket.

## Open Questions

- Ninguna que afecte al diseño. Queda operativo: obtener credencial de la cuenta dueña del proyecto de PROD para completar el paso 5.
