# TKT-OMEGYM-016: Autenticación — Confirmación de email con Supabase Auth

## Metadata
- **Tipo**: Feature
- **Prioridad**: Alta
- **Estado**: Review
- **Módulo**: auth
- **Relacionado con**: SPECIFICATION.md (sección 11.1 Autenticación y Roles)
- **Ticket Externo**: REQ-OMEGYM-0XX
- **Fecha apertura**: 2026-08-04
- **Fecha cierre**: (pendiente)

## Descripción
Implementar la **confirmación de email** al registrar usuarios usando la
verificación integrada de **Supabase Auth** (Opción 2 de la metodología), sin
backend propio; se usa Gmail SMTP únicamente como mailer custom de Supabase
para personalizar la plantilla/asunto del correo.

Objetivo: al registrarse con un correo, el usuario ve una pantalla
*"Revisa tu bandeja de entrada"*; completa el registro abriendo el link de
confirmación que llega por email, y luego inicia sesión. El acceso queda
**gateado automáticamente** porque, con la confirmación activa, Supabase no
emite sesión para un email sin confirmar (la RLS ya existente lo respalda).

Alcance de la confirmación:
- **Email**: se exige confirmación.
- **Teléfono**: no aplica (el flujo por teléfono sigue tal cual).

## Dependencias
- **Bloqueado por**: TKT-OMEGYM-003 (protección de rutas/roles) — cerrado
- **Bloquea a**: (ninguno)

## Configuración aplicada en Supabase (Management API)

### Proyecto DEV `jaltwjcipyrnmvjkdqdp` (`.env.development`)
- `mailer_autoconfirm=false` → confirmación de email **activada**.
- `site_url=http://localhost:5173`
- `uri_allow_list=http://localhost:5173/**`

### Proyecto PROD `xlawavqceyprraeyrmtm` (`.env`, Vercel)
- `mailer_autoconfirm=false` → confirmación **ya activa** (se mantiene).
- **Dominio actualizado (2026-08-22)**: el deploy de Vercel migró a
  `https://omegagym.vercel.app` — **aplicado vía Management API** y verificado
  con lectura posterior:
  - `site_url=https://omegagym.vercel.app`
  - `uri_allow_list=https://omegagym.vercel.app/**,https://omega-gym-eight.vercel.app/**,http://localhost:5173/**`
    (se conserva el dominio viejo durante la transición por emails ya enviados;
    localhost agregado para previews locales contra PROD).
- Configuración anterior (histórico):
  - `site_url=https://omega-gym-eight.vercel.app`
  - `uri_allow_list=https://omega-gym-eight.vercel.app/**`
- Nota: el frontend no requirió cambios — `emailRedirectTo`/`redirectTo` usan
  `${window.location.origin}/auth/callback` (dinámico). El login por
  email+password no depende de la allow-list; el cambio afecta únicamente a
  confirmación de registro y recuperación de contraseña.

### SMTP custom (Gmail) + plantilla personalizada (aplicado en DEV y PROD)
- Configurado `smtp_host=smtp.gmail.com`, `smtp_port=465`, remitente
  **"Omega Gym"** (`omegagym6@gmail.com`). Credenciales de la app password
  **solo en `.env.local`** (gitignored, nunca versionadas).
- Al conectar SMTP custom se desbloqueo la personalización en free tier:
  - `mailer_subjects_confirmation="Confirma tu correo - Omega Gym"`
  - `mailer_templates_confirmation_content` = plantilla HTML custom con
    branding "Omega Gym" en español.
- Las credenciales SMTP se aplicaron vía Management API **sin imprimirse** en
  logs (se leyeron de `.env.local`).

Notas:
- `emailRedirectTo` en el frontend apunta a `${origin}/auth/callback`; el
  origen debe estar en la allow list del proyecto para que el link funcione.
- La plantilla personalizada fallaba antes con
  `"Email template modification is not available for free tier projects using
  the default email provider"`; se resolvió configurando SMTP custom.

### Rate limit de envío de email (aplicado en DEV y PROD)
- Aumentado `rate_limit_email_sent` de `2` → `30` (emails/hora) en ambos
  proyectos para permitir pruebas (re-registro / reenvío) sin error `429`.
- Nota: con el **proveedor por defecto** este límite es fijo en `2/hora` y **no
  es configurable**; solo es modificable **con SMTP custom** (ya configurado).
  Con SMTP propio, el techo efectivo pasa a ser el del proveedor
  (Gmail SMTP ~500 correos/día).
- Este ajuste se aplicó **live** vía Management API (no es un valor versionado
  en el repositorio).

## Archivos Afectados
- `src/services/auth.service.ts` → `register` devuelve `{ session,
  requiresConfirmation }`, añade `emailRedirectTo` en `signUp`, nuevo método
  `resendConfirmation`.
- `src/store/auth.store.ts` → `register` propaga `requiresConfirmation` y no
  crea sesión automática cuando hay confirmación pendiente.
- `src/pages/auth/Register.tsx` → pantalla "Revisa tu bandeja" con reenvío y
  enlace de vuelta a login.
- `src/pages/auth/AuthCallback.tsx` → manejo robusto post-confirmación
  (exchange de código, redirect por rol, fallback a login).

## Estimación
0.5 día

## Implementación
- [x] Configuración Supabase aplicada (DEV + PROD) vía Management API
- [x] SMTP custom (Gmail) configurado en DEV y PROD
- [x] Plantilla y asunto de confirmación personalizados (español / branding)
- [x] Tipos TypeScript definidos (`RegisterResult`)
- [x] Servicio conectado (`auth.service.ts`)
- [x] UI de "Revisa tu bandeja" + reenvío
- [x] Callback robusto
- [x] Build pasa (`npm run build`) y typecheck (`tsc --noEmit`)
- [ ] Prueba manual end-to-end (registro de email real + link de confirmación)

## Criterios de Aceptación
- [ ] Registro con email muestra la pantalla "Revisa tu bandeja de entrada"
- [ ] El correo llega y al abrir el link se confirma la cuenta
- [ ] Tras confirmar, el usuario inicia sesión y redirige por rol
- [ ] Sin confirmar, el usuario NO obtiene sesión (acceso gateado)
- [ ] El registro por teléfono no se ve afectado
- [ ] El build de producción pasa sin errores

## Pendiente (fuera de este ticket)
- **Rotar secretos expuestos en el chat**: 2 tokens `sbp_...`, la app password
  de Gmail vieja y el email remitente `omegagym6@gmail.com` quedaron visibles
  en el chat. Revocar/regenerar lo compartido.
- **Prueba manual end-to-end** con un correo real (dev y prod) — verifica que
  el correo llega con el branding "Omega Gym" y el flujo completo.
- **(Opcional)** Reemplazar Gmail SMTP por un proveedor transaccional
  (Resend/Brevo) con dominio propio cuando haya usuarios reales, para mejor
  entregabilidad (Gmail es suficiente para esta etapa).

## Evidencia de Cierre
**Fecha**: (pendiente)
**Probado por**: (pendiente)
**Resultado**: (pendiente) — Config aplicada y verificada vía API (SMTP Gmail +
plantilla "Omega Gym"); build y typecheck OK.
**Commit**: `feat(auth): email verification via Supabase Auth (#TKT-OMEGYM-016)`