# lesson_memberships_duplicate_race.md

## Lección: membresía duplicada por concurrencia y borrado que "funcionaba" sin borrar

**Fecha**: 2026-10-30
**Contexto**: Dashboard → Membresías (DEV). El dueño creó una membresía y
aparecieron dos filas idénticas; al borrar una, la otra seguía apareciendo.

### Síntoma

Dos filas con el mismo miembro, plan y fechas, pero **avatares de distinto
color**: el color se deriva del `id`, así que eran dos registros reales, no un
duplicado de render.

### Causa 1 — carrera en el RPC

`create_membership_with_payment` validaba "sin membresía activa" con un `SELECT`
y después insertaba, sin bloquear. Dos llamadas concurrentes (doble tap en
"Guardar") pasaban ambas la validación y creaban una fila cada una. El guard de
la UI (`saving`) es estado de React y no es un candado atómico.

### Causa 2 — borrado silencioso

`membershipsService.delete()` hacía `.delete().eq('id', id)` sin `.select()`.
Supabase devuelve `error: null` con 0 filas afectadas, así que la UI mostraba
"Membresía eliminada" aunque la fila siguiera en la base. Por eso la copia
"volvía" a aparecer tras refrescar.

### Solución

**Base de datos** — `supabase/migrations/20261030000001_create_membership_serialize.sql`:

```sql
PERFORM pg_advisory_xact_lock(hashtext(p_member_id::text));
```

Al inicio del RPC, con la misma firma y grants. Serializa por miembro: la segunda
llamada ya ve la fila de la primera y falla con "El miembro ya tiene una
membresía activa".

No se usó un índice único parcial porque `Visita` también es `status='active'` y
la regla de negocio excluye ese tipo; el lock respeta la validación existente.

**Servicio**:

```ts
const { data, error } = await supabase.from('memberships').delete().eq('id', id).select('id')
if (error) throw error
if (!data?.length) throw new Error('La membresía ya no existe o no tienes permiso para eliminarla.')
```

**Pantalla**: `savingRef` (candado síncrono) + `reqRef` (descarta respuestas de
peticiones viejas) + refresco incluso cuando el borrado falla.

### Verificación realizada

Dos llamadas en paralelo al RPC con el mismo miembro: una `201 OK`, la otra
`400` con "ya tiene membresía activa"; `count(*) = 1`. Los datos de prueba se
eliminaron (los pagos caen por `ON DELETE CASCADE`).

### Aplicación

- `supabase/migrations/20261030000001_create_membership_serialize.sql`
- `src/services/memberships.service.ts`
- `src/pages/dashboard/Memberships.tsx`
- `scripts/audit-duplicate-memberships.mjs` (auditoría; `--apply` borra sobrantes
  conservando la fila más reciente)

### Regla general

Cualquier operación destructiva desde el cliente debe pedir `.select()` y
verificar filas afectadas: RLS y los ids inexistentes no generan error en
Supabase. Y cualquier "validar y luego insertar" necesita un lock o una
restricción en la base, nunca solo un estado de React.

### Addendum (2026-10-30): falso "ya tiene membresía activa"

Tras el fix, el dueño reportó que al guardar le decía "ya tiene membresía
activa" en un miembro que, según él, no tenía. La base tenía dos membresías
activas reales (Fernando y Axelito, creadas ese mismo día). El problema era el
selector: `memberList` se cargaba una sola vez al montar la página y la caché
`member_list` vive 30 s, así que seguía ofreciendo miembros que ya habían
recibido una membresía en esa sesión.

Corrección en `Memberships.tsx`:

- `loadPickerMembers()` recarga la lista cada vez que se abre el selector, con
  estado `pickerLoading`.
- Filtro doble: `!m.membership_type` (servicio) **y** `!takenMemberIds` set
  derivado de las membresías vigentes ya cargadas en la página.
- `cache.invalidate('member_list')` en alta, edición y borrado.
- Si el RPC responde "ya tiene una membresía activa", la UI refresca ambas
  listas y muestra un mensaje claro en lugar del error crudo.

Moraleja: cualquier selector que dependa de un dato mutable (quién tiene
membresía) debe recargarse al abrirse, no solo al montar la pantalla.

### Addendum 2 (2026-10-30): el lock no cubría Visita ni los reintentos

Auditoría posterior sobre DEV (TKT-OMEGYM-046). El RPC ya tenía el
`pg_advisory_xact_lock`, pero quedaban tres huecos:

1. **Visita**: la validación "sin membresía activa" excluye ese tipo
   (`AND mt.name != 'Visita'`), así que el lock no tenía nada que serializar.
   Dos envíos del mismo formulario insertaban dos filas idénticas, incluso
   secuencialmente.
   La condición `mt.name != 'Visita'` aplica al tipo de la membresía *existente*
   (una Visita vigente no bloquea vender un plan), **no** al tipo que se está
   creando. Con un plan activo, una Visita nueva sí se rechaza.
2. **Reintento tras respuesta perdida**: si el `INSERT` commitea y el cliente no
   recibe la respuesta, el reintento manual crea otra fila. El lock no ayuda
   porque la primera transacción ya terminó.
3. **Clientes sin candado síncrono**: el estado de React no es atómico.

Solución (`20261030000002_membership_idempotency.sql`):

- `memberships.request_id UUID` + índice único parcial `uq_memberships_request_id`.
- El RPC recibe `p_request_id UUID DEFAULT NULL` y, si ya existe una fila con
  esa clave, la devuelve en lugar de insertar.
- Ventana anti-duplicado de 60 s por `member_id + type_id + start_date +
  end_date` con `status <> 'cancelled'`, como respaldo para clientes viejos.
- **Orden crítico**: la idempotencia se evalúa *antes* de la validación "ya
  tiene membresía activa"; si no, el reintento recibiría el error en vez de su
  membresía.
- La firma anterior se elimina para que PostgREST no tenga dos candidatas
  ambiguas; el DEFAULT `NULL` mantiene funcionando a los clientes de 6
  argumentos.

Verificación: mismo `request_id` dos veces → mismo id; distinto `request_id`
con el mismo payload → misma fila; Visita duplicada → una sola fila; y dos
peticiones HTTP en paralelo → mismo id, 1 fila, 1 pago.

Moraleja: un lock serializa, no deduplica. La idempotencia necesita una clave
persistida con restricción única; la ventana temporal es sólo una red de
seguridad para clientes que aún no la envían.

