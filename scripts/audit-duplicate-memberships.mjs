/**
 * Auditoría y limpieza de membresías duplicadas.
 *
 * Uso:
 *   node scripts/audit-duplicate-memberships.mjs --ref <project-ref>           # solo lista
 *   node scripts/audit-duplicate-memberships.mjs --ref <project-ref> --apply   # borra sobrantes
 *
 * Criterio de duplicado: mismo member_id + type_id + start_date + end_date.
 * Se conserva la fila con created_at más reciente; las demás se eliminan junto
 * con sus pagos (ON DELETE CASCADE).
 *
 * Token: SUPABASE_ACCESS_TOKEN, SP_TOKEN o `.env`. Nunca se imprime.
 */
import fs from 'node:fs';

const API = 'https://api.supabase.com/v1';

function getToken() {
  const fromEnv = process.env.SUPABASE_ACCESS_TOKEN || process.env.SP_TOKEN;
  if (fromEnv) return fromEnv.trim();
  const raw = fs.readFileSync('.env', 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*(SUPABASE_ACCESS_TOKEN|SP_TOKEN)\s*=\s*(.+?)\s*$/);
    if (m) return m[2].replace(/^["']|["']$/g, '').trim();
  }
  return '';
}

async function query(ref, sql, token) {
  const res = await fetch(`${API}/projects/${ref}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`${res.status}: ${JSON.stringify(body).slice(0, 400)}`);
  return body;
}

const args = process.argv.slice(2);
const refIndex = args.indexOf('--ref');
const ref = refIndex !== -1 ? args[refIndex + 1] : process.env.SUPABASE_PROJECT_REF;
const apply = args.includes('--apply');

if (!ref) {
  console.error('Falta --ref <project-ref>.');
  process.exit(1);
}

const token = getToken();
if (!token) {
  console.error('Falta el token. Define SUPABASE_ACCESS_TOKEN (o SP_TOKEN) en el entorno o en `.env`.');
  process.exit(1);
}

const AUDIT = `
  select member_id, type_id, start_date, end_date, count(*)::int as copies,
         string_agg(id::text, ', ' order by created_at desc) as ids
  from memberships
  group by member_id, type_id, start_date, end_date
  having count(*) > 1
  order by copies desc;
`;

const DUPLICATE_IDS = `
  with ranked as (
    select id,
           row_number() over (
             partition by member_id, type_id, start_date, end_date
             order by created_at desc, id desc
           ) as rn
    from memberships
  )
  select id from ranked where rn > 1;
`;

try {
  const groups = await query(ref, AUDIT, token);
  if (!groups || groups.length === 0) {
    console.log('Sin duplicados. No hay nada que limpiar.');
    process.exit(0);
  }

  console.log(`Duplicados encontrados: ${groups.length} grupo(s)`);
  for (const g of groups) {
    console.log(`  member ${g.member_id} · tipo ${g.type_id} · ${g.start_date} → ${g.end_date} · ${g.copies} copias`);
  }

  if (!apply) {
    console.log('\nModo solo lectura. Agrega --apply para eliminar las copias sobrantes.');
    process.exit(0);
  }

  const ids = await query(ref, DUPLICATE_IDS, token);
  const list = (ids || []).map(r => r.id);
  console.log(`\nEliminando ${list.length} copia(s)…`);

  const deleted = await query(
    ref,
    `delete from memberships where id in (${list.map(id => `'${id}'`).join(',')}) returning id;`,
    token,
  );
  console.log(`Eliminadas: ${(deleted || []).length}`);
  console.log('Se recargó el esquema de PostgREST al aplicar el cambio.');
  await query(ref, "notify pgrst, 'reload schema';", token).catch(() => {});
} catch (e) {
  console.error('Error:', e.message);
  process.exit(1);
}
