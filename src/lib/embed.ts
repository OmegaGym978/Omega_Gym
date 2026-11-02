/**
 * Utilidades para relaciones embebidas de PostgREST.
 *
 * PostgREST devuelve las relaciones many-to-one como **objeto**, pero mientras
 * el cliente de Supabase no use tipos generados (`Database`), supabase-js las
 * infiere como **arreglo**. `one()` acepta ambas formas para que los servicios
 * no dependan de esa suposición.
 */

export type Embedded<T> = T | T[] | null

/** Normaliza una relación embebida (objeto o arreglo) a un solo registro. */
export function one<T>(value: Embedded<T> | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null
  return value ?? null
}
