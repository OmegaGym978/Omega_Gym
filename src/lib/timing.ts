/**
 * Utilidades de tiempo deliberadamente impuras. Se llaman desde handlers o
 * callbacks (nunca durante el render), por eso viven fuera de los componentes:
 * así el linter de pureza no las confunde con código de render.
 */

/** Marca de tiempo actual en milisegundos. */
export function nowMs(): number {
  return Date.now()
}

/**
 * Espera lo que falte para que hayan pasado al menos `minMs` desde `startMs`.
 * Si ya pasó ese tiempo, resuelve de inmediato.
 */
export async function waitAtLeast(startMs: number, minMs: number): Promise<void> {
  const elapsed = nowMs() - startMs
  if (elapsed < minMs) {
    await new Promise(resolve => setTimeout(resolve, minMs - elapsed))
  }
}
