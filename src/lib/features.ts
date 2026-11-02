/**
 * Features que todavía no se liberan al público.
 *
 * `import.meta.env.DEV` lo reemplaza Vite en build: `true` en `npm run dev` y
 * `false` en `npm run build` (producción y previews de Vercel). El gate es de
 * build, no de datos: la base de datos conserva sus tablas, pero la app de
 * producción no expone las pantallas ni consulta sus datos.
 *
 * Para liberar la huella/check-in: cambiar esta constante a `true`, verificar
 * el alta de huella y validar el INSERT en `check_ins` con sesión de staff.
 *
 * Ver: ai_work_flow/knowledge/local/21_unreleased_features_decisions.md
 */
export const FINGERPRINT_ENABLED = import.meta.env.DEV
