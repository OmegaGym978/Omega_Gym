/**
 * Detecta si un error de Supabase/PostgREST se debe a una columna que aún no
 * existe (migración pendiente o caché de esquema desactualizada).
 */
export function isMissingColumnError(error: unknown, column: string): boolean {
  if (!error || typeof error !== 'object') return false
  const e = error as { code?: string; message?: string; details?: string; hint?: string }
  const text = `${e.message ?? ''} ${e.details ?? ''} ${e.hint ?? ''}`
  const isMissingCode = e.code === '42703' || e.code === 'PGRST204'
  return isMissingCode && text.includes(column)
}
