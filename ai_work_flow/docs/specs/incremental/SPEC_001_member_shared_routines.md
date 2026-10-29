# SPEC_001 — Rutinas Personales de Miembros con Compartición por Código

**Versión**: 1.0
**Fecha**: 2026-08-21
**Base**: SPECIFICATION.md (principal) — módulo training-plans extendido
**Estado**: Aprobada (diseño confirmado por dueño del proyecto)

---

## 1. Descripción General

Extensión del módulo de planes de entrenamiento para que los **miembros** puedan crear, gestionar y compartir sus propias rutinas ("rutinas personales") mediante un **código de compartición**. Quien recibe el código obtiene una **copia independiente** de la rutina: cualquier edición posterior de la copia no afecta al original ni viceversa.

## 2. Usuarios Impactados

| Rol | Cambio |
|---|---|
| `member` | Nuevo: CRUD de rutinas propias + generar/revocar código + importar por código |
| `trainer` / `admin` | Sin cambios en esta fase; siguen viendo/gestionando planes `kind='trainer'` como hoy |

## 3. Alcance

### Incluye
- Columna `kind` (`'trainer'` \| `'personal'`) y `share_code` en `training_plans`.
- RLS: miembros pueden INSERT/UPDATE/DELETE únicamente sus rutinas personales y sus ejercicios.
- RPCs SECURITY DEFINER: `generate_share_code`, `revoke_share_code`, `import_routine_by_code`.
- Página "Mis Rutinas" para el rol miembro (`/my-routines`) reutilizando `RoutineBuilder` y `ExercisePicker`.
- Modal de compartir (mostrar/copiar/regenerar/revocar código) e importación por código.

### No incluye (v1)
- Galería pública o descubrimiento entre miembros.
- Favoritos/likes, historial de importaciones, estadísticas de uso.
- Moderación/aprobación de rutinas.
- Compartir rutinas personales hacia entrenadores/admin.

### Extensión aprobada (2026-08-21, TKT-OMEGYM-023)
- Mi plan muestra pestañas fusionadas: planes asignados + rutinas propias (asignadas primero), con insignia de origen y acceso directo a edición (`/my-routines?edit=<id>`).
- Mis rutinas incluye sección de solo lectura "Asignadas por tu entrenador".
- Las rutinas personales siguen SIN aparecer en las vistas de entrenador/admin ni afectan `plan_assignments`.

### Extensión aprobada (2026-08-21, TKT-OMEGYM-024)
- Columna `training_plans.show_in_plan BOOLEAN NOT NULL DEFAULT true` (solo relevante para kind=personal).
- Switch "En Mi plan" por rutina propia en Mis rutinas (actualización optimista).
- Mi plan solo fusiona las personales con `show_in_plan = true`; las asignadas siempre visibles.
- Migración 20260821120000 aplicada SOLO en DEV; producción pendiente junto al resto de SPEC_001.

### Extensión aprobada (2026-08-21, TKT-OMEGYM-025)
- El toggle "En Mi plan" aplica también a planes asignados por entrenadores.
- Columna `plan_assignments.visible BOOLEAN NOT NULL DEFAULT true`: preferencia POR MIEMBRO (un plan compartido entre varios miembros se oculta solo para quien lo decide).
- RPC `set_assignment_visibility` SECURITY DEFINER con fallback legacy vía `training_plans.show_in_plan` para asignaciones `assigned_to` sin fila.
- Mis rutinas deja de ser "solo lectura" en asignadas: único control permitido al miembro es su visibilidad (sin editar/eliminar/compartir).
- Migración 20260821130000 aplicada SOLO en DEV; producción pendiente junto al resto de SPEC_001.

### Extensión aprobada (2026-10-29, TKT-OMEGYM-027)
- La regla 5 pasa de declarativa a **aplicada por RLS**: `training_plans_select` y `plan_exercises_select` limitan al staff (`admin`/`trainer`) a filas `kind='trainer'`.
- La escritura del staff (`insert`/`update`/`delete` en `training_plans` y `plan_exercises`) también queda limitada a `kind='trainer'`; sus propias rutinas personales siguen editables vía las políticas `members_personal_*`.
- `trainingService.getAll()` filtra `kind='trainer'` como defensa en profundidad; `duplicate()` fija `kind='trainer'`.
- Migración `20261029000001_staff_scope_training_plans.sql`.

## 4. Reglas de Negocio

1. Una rutina personal pertenece a un solo miembro (`created_by`); solo su dueño puede editarla, eliminarla, compartirla o revocarla.
2. El código es estable mientras no se regenere o revoque. Regenerar invalida el anterior. Revocar = `share_code = NULL`.
3. Importar por código crea SIEMPRE una copia nueva e independiente (nombre sufijado `"(copia)"`); se permite importar la misma rutina varias veces.
4. Un miembro NO puede importar su propio código (error controlado).
5. Las rutinas personales nunca aparecen en las vistas de entrenador ni admin (enforce por RLS desde TKT-OMEGYM-027) ni afectan asignaciones de `plan_assignments`.
6. Los planes creados por entrenador/admin conservan `kind='trainer'` (DEFAULT retrocompatible).
7. El receptor debe ser un usuario autenticado activo con perfil existente.

## 5. Criterios de Aceptación

- [ ] Miembro crea/edita/elimina rutinas propias desde `/my-routines`.
- [ ] Generar código devuelve formato `XXXX-XXXX`; repetir la llamada devuelve el mismo código; regenerar cambia el anterior.
- [ ] Revocar deja el código inutilizable para importaciones.
- [ ] Otro miembro importa con código (mayúsculas/minúsculas o sin guion → normalizado) y recibe copia editable independiente.
- [ ] Editar la copia NO modifica la original (verificado en BD).
- [ ] Auto-import rechazado; código inválido/revokeado da mensaje claro.
- [ ] Un miembro NO puede leer/editar rutinas personales ajenas vía API directa (RLS), solo vía RPC de importación.
- [ ] El staff (admin/entrenador) NO puede leer rutinas personales ni por API directa: `GET /rest/v1/training_plans?kind=eq.personal` devuelve `[]` (TKT-OMEGYM-027).
- [ ] Flujos existentes de entrenador (crear/asignar/duplicar planes) intactos.

## 6. Tickets Relacionados

| Ticket | Contenido |
|---|---|
| TKT-OMEGYM-019 | Migración: kind, share_code, índices, RLS, RPCs |
| TKT-OMEGYM-020 | Servicio `routines.service.ts` |
| TKT-OMEGYM-021 | Página Mis Rutinas + router |
| TKT-OMEGYM-022 | Compartir/importar por código (UI + pruebas E2E del flujo) |
| TKT-OMEGYM-027 | RLS: staff limitado a `kind='trainer'` (ocultar rutinas personales) |

## 7. Fuera de Riesgo / Notas

- La migración es aditiva: DEFAULT `'trainer'`, políticas nuevas sin dropear las existentes → cero impacto en producción actual.
- Lectura de planes ajenos SOLO ocurre dentro de RPC SECURITY DEFINER con código válido (el código es la credencial).
