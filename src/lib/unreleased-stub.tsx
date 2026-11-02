/**
 * Reemplazo en build de producción para las pantallas que aún no se liberan.
 *
 * `vite.config.ts` aliasa `@/pages/dashboard/Fingerprint`, `@/pages/kiosk/CheckIn`
 * y `@/pages/member/MyCheckins` a este módulo cuando corre `vite build`, así que
 * su código no viaja en el bundle. En `vite` (dev) se usan las pantallas reales.
 *
 * Ver: src/lib/features.ts
 */
export default function UnreleasedPage() {
  return null
}
