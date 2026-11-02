# TKT-OMEGYM-046: Membresías duplicadas — idempotencia en la creación

## Metadata
- **Tipo**: Fix (datos + UI)
- **Prioridad**: Alta
- **Estado**: Review
- **Módulo**: memberships
- **Relacionado con**: `SPECIFICATION.md` (§11.3 Membresías y Pagos)
- **Ticket Externo**: — (reporte directo del dueño del proyecto)
- **Fecha apertura**: 2026-10-30
- **Fecha cierre**: —

## Descripción

Al crear una membresía desde **Dashboard → Membresías** aparecían dos filas
idénticas en la base de datos.

La auditoría descartó las causas de frontend habituales y localizó el origen en
la base de datos:

| Verificación | Resultado |
|---|---|
| ¿`onClick` + `onSubmit` sin `preventDefault`? | ❌ No. El modal no es un `<form>`; el botón es `type="button"` con un solo `onClick` (`Memberships.tsx:820-827`). Los `<form>` de auth sí llaman `preventDefault`. |
| ¿`useEffect` que re-dispara la mutación? | ❌ No. Los efectos sólo leen (`:107-116`, `:120-151`). |
| ¿StrictMode duplica la mutación? | ❌ No. Duplica efectos en dev, nunca handlers. |
| ¿Realtime / React Query / SWR / refetch por foco? | ❌ Ninguno. |
| ¿Triggers que inserten en `memberships`? | ❌ Ninguno. El único trigger de `payments` sólo reescribe `payment_date`. |
| ¿Webhooks / edge functions? | ❌ No existe `supabase/functions/`. |
| ¿Estado de envío y `disabled`? | ✅ Existen (`saving`, `savingRef`, `disabled={... || saving}`). |
| ¿Punto único de creación? | ✅ Sólo `membershipsService.create` → RPC. |

**Causa principal** — `create_membership_with_payment` validaba "sin membresía
activa" con un `SELECT` y luego insertaba. En READ COMMITTED dos transacciones
concurrentes no ven la fila no confirmada de la otra y ambas insertan. La
migración `20261030000001` agregó `pg_advisory_xact_lock`, pero quedaron tres
huecos:

1. **Visita**: la validación excluye ese tipo (`AND mt.name != 'Visita'`), así
   que el lock no tenía nada que serializar. Dos envíos insertaban dos filas.
2. **Reintento tras respuesta perdida**: si el `INSERT` commitea y el cliente no
   recibe la respuesta, el reintento manual duplica. El lock no ayuda porque la
   transacción anterior ya terminó.
3. **Cliente sin candado síncrono**: el estado de React no es atómico.

Estado de DEV al auditar: RPC con lock, **sin idempotencia** y sin restricción
única en `memberships`.

## Dependencias
- **Bloqueado por**: TKT-OMEGYM-019 (creación de membresía con pago)
- **Bloquea a**: —

## Archivos Afectados
- `supabase/migrations/20261030000002_membership_idempotency.sql` (nuevo)
- `src/services/memberships.service.ts`
- `src/pages/dashboard/Memberships.tsx`
- `src/lib/helpers.ts`
- `data/supabase/DATABASE_CONFIG.yaml`
- `ai_work_flow/knowledge/local/lesson_memberships_duplicate_race.md`

## Implementación
- [x] Auditoría de frontend (disparadores dobles, loading, listeners)
- [x] Auditoría de backend (RPC, triggers, webhooks, RLS)
- [x] `memberships.request_id` + índice único parcial
- [x] RPC con idempotencia exacta y ventana anti-duplicado de 60 s
- [x] Idempotencia evaluada antes de la validación de membresía activa
- [x] Firma de 6 argumentos eliminada; la de 7 acepta clientes antiguos por `DEFAULT`
- [x] Clave de idempotencia por intento en el cliente (`attemptRef`)
- [x] Bloqueo de cierre del modal mientras se guarda
- [x] Candado por `ref` en edición y borrado
- [x] Migración aplicada en DEV
- [x] `npm run build` OK
- [ ] Migración aplicada en PROD
- [ ] Prueba manual en navegador (doble tap real)

## Criterios de aceptación
- [x] Dos envíos con el mismo `request_id` devuelven la misma membresía (1 fila).
- [x] Dos envíos con distinto `request_id` y mismo payload dentro de 60 s devuelven la misma fila.
- [x] Crear una **Visita** duplicada ya no genera dos filas.
- [x] La validación "ya tiene membresía activa" sigue vigente para planes.
- [x] Dos peticiones HTTP en paralelo crean 1 fila y 1 pago.
- [x] Los pagos no se duplican (sólo se insertan cuando la membresía se creó en esa llamada).
- [ ] Prueba manual en el navegador con doble tap.

## Evidencia de Cierre

**Fecha**: 2026-10-30
**Probado por**: Dev asistido por IA (Management API + REST con anon key)
**Entorno**: DEV `jaltwjcipyrnmvjkdqdp`

### Verificación lógica (transacción con ROLLBACK)

| Caso | Resultado |
|---|---|
| `a1` y `a2` con el mismo `request_id` | ✅ mismo `id` |
| `b1` y `b2` con distinto `request_id`, mismo payload | ✅ mismo `id` (ventana 60 s) |
| `c` cliente antiguo (6 argumentos) | ✅ mismo `id` |
| `d` plan que solapa una membresía activa | ✅ error "ya tiene membresía activa" |
| `e1` y `e2` Visita con distinto `request_id` | ✅ mismo `id` |
| Filas creadas (Mensual / Visita) | ✅ 1 / 1 |
| Pagos creados | ✅ 2 (uno por membresía) |

### Verificación de concurrencia real (HTTP)

Dos `POST /rest/v1/rpc/create_membership_with_payment` simultáneos con
`request_id` distintos y el mismo payload:

```
A: {"status":200,"id":"3e862872-e7ea-4ff1-a5a9-552284622715"}
B: {"status":200,"id":"3e862872-e7ea-4ff1-a5a9-552284622715"}
filas_creadas: 1 · pagos_asociados: 1
```

Datos de prueba eliminados (`restantes: 0`).

### Esquema verificado

| Elemento | Resultado |
|---|---|
| `memberships.request_id` | ✅ `uuid` |
| `uq_memberships_request_id` | ✅ existe |
| Versiones del RPC | ✅ 1 |
| Firma | ✅ 7 argumentos con `p_request_id` |
| `pg_advisory_xact_lock` | ✅ presente |
| Ventana 60 s | ✅ presente |

**Commit**: —

## Notas
- No se aplicó un índice único sobre `(member_id) WHERE status='active'` porque
  las membresías **Visita** son múltiples por diseño.
- La política RLS `memberships_insert` sigue permitiendo INSERT directo a
  trainer/admin (no lo usa la app). Queda como endurecimiento opcional.
- El RPC está otorgado a `anon` desde su creación original y es
  `SECURITY DEFINER`; conviene revisarlo en un ticket de seguridad aparte.
