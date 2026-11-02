import { useEffect, useRef } from 'react'

/**
 * Lleva el scroll al inicio de la vista cuando cambia la página de una lista.
 *
 * El layout no usa un contenedor con `overflow-y`: el scroll es de `window`.
 * No dispara en el montaje inicial (no salta al entrar ni al volver atrás) y
 * respeta `prefers-reduced-motion`.
 */
export function useScrollTopOnPageChange(page: number): void {
  const prevPageRef = useRef(page)

  useEffect(() => {
    if (prevPageRef.current === page) return
    prevPageRef.current = page
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' })
  }, [page])
}
