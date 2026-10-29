#!/usr/bin/env node
/**
 * Aplica un archivo SQL a un proyecto Supabase usando la Management API.
 *
 * Uso:
 *   node scripts/apply-migration.mjs <archivo.sql> --ref <project-ref>
 *   node scripts/apply-migration.mjs --list          (proyectos accesibles)
 *
 * Token (en este orden): SUPABASE_ACCESS_TOKEN, SP_TOKEN, o `.env`.
 * Nunca imprime el token.
 */

import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const API = 'https://api.supabase.com/v1'

function readEnvFile(path = '.env') {
  if (!existsSync(path)) return {}
  const out = {}
  for (const raw of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const i = line.indexOf('=')
    if (i === -1) continue
    out[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, '')
  }
  return out
}

function getToken() {
  const fromEnv = process.env.SUPABASE_ACCESS_TOKEN || process.env.SP_TOKEN
  if (fromEnv) return fromEnv.trim()
  const file = readEnvFile('.env')
  return (file.SUPABASE_ACCESS_TOKEN || file.SP_TOKEN || '').trim()
}

function parseArgs(argv) {
  const args = { file: null, ref: null, list: false }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--list') args.list = true
    else if (a === '--ref') args.ref = argv[++i]
    else if (!args.file && !a.startsWith('--')) args.file = a
  }
  return args
}

async function api(path, token, init = {}) {
  const res = await fetch(API + path, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  })
  const text = await res.text()
  let body
  try { body = text ? JSON.parse(text) : null } catch { body = text }
  return { status: res.status, body }
}

function fail(message) {
  console.error(`\n✖ ${message}`)
  process.exit(1)
}

const args = parseArgs(process.argv.slice(2))
const token = getToken()

if (!token) {
  fail('Falta el token. Define SUPABASE_ACCESS_TOKEN (o SP_TOKEN) en el entorno o en `.env`.')
}

if (!token.startsWith('sbp_')) {
  console.warn('⚠ El token no empieza por "sbp_"; verifica que sea un Personal Access Token de Supabase.')
}

if (args.list || !args.file) {
  const { status, body } = await api('/projects', token)
  if (status === 401) fail('Token inválido o expirado (401).')
  if (status >= 400) fail(`No se pudieron listar los proyectos (${status}): ${JSON.stringify(body)}`)
  console.log('\nProyectos accesibles con este token:')
  for (const p of body || []) console.log(`  - ${p.name}  →  ${p.id}  (${p.region})`)
  if (!args.file) {
    console.log('\nUso: node scripts/apply-migration.mjs <archivo.sql> --ref <project-ref>')
    process.exit(0)
  }
}

const sqlPath = resolve(args.file)
if (!existsSync(sqlPath)) fail(`No existe el archivo: ${sqlPath}`)

const sql = readFileSync(sqlPath, 'utf8')
if (!sql.trim()) fail('El archivo SQL está vacío.')

const projects = await api('/projects', token)
if (projects.status === 401) fail('Token inválido o expirado (401).')

const accessible = (projects.body || []).map(p => p.id)
let ref = args.ref
if (!ref) {
  if (accessible.length === 1) ref = accessible[0]
  else fail('Indica el proyecto con --ref. Usa --list para ver los accesibles.')
}
if (!accessible.includes(ref)) {
  fail(`El token no tiene acceso al proyecto ${ref}. Accesibles: ${accessible.join(', ') || 'ninguno'}.`)
}

console.log(`\n→ Aplicando ${args.file} en ${ref}…`)

const result = await api(`/projects/${ref}/database/query`, token, {
  method: 'POST',
  body: JSON.stringify({ query: sql }),
})

if (result.status === 413) {
  fail('El SQL es demasiado grande para la Management API (413). Aplícalo desde el SQL Editor.')
}
if (result.status === 401) fail('Token inválido o expirado (401).')
if (result.status === 403) fail('El token no tiene permisos sobre este proyecto (403).')
if (result.status >= 400) {
  fail(`Error ${result.status} al aplicar el SQL: ${JSON.stringify(result.body)}`)
}

console.log('✓ SQL aplicado')

const reload = await api(`/projects/${ref}/database/query`, token, {
  method: 'POST',
  body: JSON.stringify({ query: "NOTIFY pgrst, 'reload schema';" }),
})
if (reload.status >= 400) {
  console.warn(`⚠ No se pudo recargar PostgREST: ${JSON.stringify(reload.body)}`)
} else {
  console.log('✓ Caché de PostgREST recargada')
}

if (/set_details/.test(sql)) {
  const check = await api(`/projects/${ref}/database/query`, token, {
    method: 'POST',
    body: JSON.stringify({
      query: "select column_name, data_type from information_schema.columns where table_schema = 'public' and table_name = 'plan_exercises' and column_name = 'set_details';",
    }),
  })
  const rows = Array.isArray(check.body) ? check.body : []
  if (rows.length > 0) console.log(`✓ Verificado: ${rows[0].column_name} (${rows[0].data_type})`)
  else console.warn('⚠ No se encontró la columna set_details después de aplicar el SQL.')
}

console.log('\nListo. Recuerda: el valor del token nunca se guarda en el repositorio.\n')
