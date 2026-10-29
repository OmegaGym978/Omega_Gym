# 09_staff_plan_scope_decisions.md

## Decisión: Alcance del staff sobre los planes de entrenamiento

**Fecha**: 2026-10-29  
**Contexto**: Omega Gym — módulo `training-plans` (TKT-OMEGYM-027)  
**Autor**: Dev asistido por IA

### Problema
SPEC_001 (regla 5) establece que las rutinas personales de los miembros (`training_plans.kind='personal'`) nunca deben aparecer en las vistas de entrenador/admin. En la práctica sí aparecían: la página `/training-plans` las listaba y el staff podía abrirlas, editarlas y eliminarlas.

No era un problema de UI: `training_plans_select` y `plan_exercises_select` incluían `is_trainer_or_admin()` sin condicionar `kind`, por lo que el acceso existía también por API directa con el JWT del staff.

### Opciones Evaluadas

#### Opción 1: Filtrar solo en el frontend
**Pros**: cambio de una línea en `trainingService.getAll()`.
**Contras**: no es seguridad, solo ocultamiento; cualquier llamada REST con el JWT de admin sigue leyendo rutinas personales.
**Contras**: contradice el criterio de aceptación ya escrito en SPEC_001 ("un miembro NO puede leer rutinas personales ajenas vía API directa (RLS)").

#### Opción 2: Restringir el staff a `kind='trainer'` en RLS + filtro en frontend ✅
**Pros**: la BD es la fuente de verdad; cubre REST, Realtime y PostgREST.
**Pros**: no toca las políticas de miembros (`members_personal_*`), que siguen intactas.
**Pros**: las rutinas personales del propio staff siguen editables por la rama `created_by`.
**Contras**: requiere migración en DEV y PROD.

#### Opción 3: Staff solo ve los planes que él mismo creó (`created_by = yo`)
**Pros**: interpretación literal de "solo los que él creó".
**Contras**: rompe la colaboración admin↔entrenador (el admin deja de ver los planes del entrenador) y obliga a reescribir `duplicate()` para no perder visibilidad de la copia.
**Descartada** por decisión del dueño del proyecto.

### Decisión Final
**Selección**: Opción 2.

**Razones**:
1. Cumple la regla 5 de SPEC_001 con enforcement real (no cosmético).
2. El staff conserva todo el flujo operativo: crear, editar, duplicar y asignar planes `kind='trainer'` de cualquier autor.
3. Cero impacto en la experiencia del miembro.

### Detalle implementado
- `training_plans_select`: se conservan `created_by`, `assigned_to`, `plan_assignments`; la rama del staff pasa a `(kind = 'trainer' AND is_trainer_or_admin())`.
- `training_plans_insert/update/delete`: rama staff con `AND kind = 'trainer'` (el staff no puede modificar por API una rutina personal que ya no puede leer).
- `plan_exercises_select/insert/update/delete`: mismo criterio. Además se tradujo `auth.uid() → profiles.id` en las políticas de escritura (antes comparaban `created_by = auth.uid()`, roto para cuentas vinculadas).
- `trainingService.getAll()` añade `.eq('kind','trainer')` como defensa en profundidad (la RLS ya lo garantiza).
- `trainingService.duplicate()` fija `kind: 'trainer'` explícitamente.

### Consecuencias
- Los KPIs "Planes totales" y "Asignados" del panel admin ya no cuentan rutinas personales (comportamiento esperado).
- Las rutinas personales no pasan por `plan_assignments`, por lo que `/members/:id`, "Asignar plan" y `getByMemberAll` no se ven afectados.
- Si en el futuro el staff necesitara moderar rutinas personales, deberá hacerse con un RPC `SECURITY DEFINER` explícito y auditado, nunca abriendo el SELECT.

### Aplicación
- Migración: `supabase/migrations/20261029000001_staff_scope_training_plans.sql`
- Aplicada en DEV (2026-10-29) vía Management API; verificado con JWT simulado que el staff ya no lee ni modifica rutinas personales y que el flujo de planes `kind='trainer'` sigue intacto.
- Ticket: TKT-OMEGYM-027
- Spec: `incremental/SPEC_001_member_shared_routines.md`
