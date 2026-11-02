import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { authService } from '@/services/auth.service'
import { translateAuthError } from '@/services/auth-error'
import { BottomSheet } from '@/components/ui/molecules/BottomSheet'
import { Button } from '@/components/ui/atoms/Button'
import { PRIVACY_NOTICE } from './legal-content'
import { toast } from 'sonner'

/**
 * Renderiza el texto legal resaltando los datos pendientes entre [corchetes]
 * para que no se publiquen por error.
 */
function LegalText({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\[[^\]]+\])/g).map((part, index) =>
        part.startsWith('[') && part.endsWith(']') ? (
          <span key={index} className="font-medium text-amber-text">
            {part}
          </span>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </>
  )
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const register = useAuthStore((s) => s.register)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [verifyPending, setVerifyPending] = useState<string | null>(null)
  const [resending, setResending] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [termsOpen, setTermsOpen] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !password.trim()) {
      toast.error('Completa los campos obligatorios')
      return
    }
    if (password.trim().length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres')
      return
    }
    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      return
    }
    if (!email.trim()) {
      toast.error('Ingresa tu correo electrónico')
      return
    }
    if (!acceptedTerms) {
      toast.error('Debes aceptar los Términos y Condiciones para crear tu cuenta')
      return
    }
    setSubmitting(true)
    try {
      const result = await register({
        email: email.trim(),
        password,
        fullName: name.trim(),
      })
      if (result.requiresConfirmation) {
        setVerifyPending(email.trim())
        return
      }
      const user = useAuthStore.getState().user
      if (user?.role === 'admin') navigate('/dashboard')
      else if (user?.role === 'trainer') navigate('/dashboard')
      else if (user?.role === 'member') navigate('/my-plan')
      else navigate('/')
    } catch (err: unknown) {
      console.error('Register error:', err)
      toast.error(translateAuthError(err))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleResend() {
    if (!verifyPending) return
    setResending(true)
    try {
      await authService.resendConfirmation(verifyPending)
      toast.success('Correo de confirmación reenviado. Revisa tu bandeja de entrada y la carpeta de Spam.')
    } catch (err: unknown) {
      console.error('Resend error:', err)
      toast.error(translateAuthError(err))
    } finally {
      setResending(false)
    }
  }

  if (verifyPending) {
    return (
      <div>
        <div className="w-full max-w-[380px] mx-auto bg-surface rounded-[32px] px-6 py-8">
          <div className="mb-6">
            <div className="text-[22px] font-bold leading-tight text-text">Revisa tu bandeja de entrada</div>
            <div className="text-[13px] text-text-2 mt-1">Verificación de correo pendiente</div>
          </div>
          <div className="text-[13px] text-text-2 leading-relaxed">
            Te enviamos un link de confirmación a{' '}
            <span className="font-medium text-text">{verifyPending}</span>.
            Ábrelo para activar tu cuenta y poder iniciar sesión.
          </div>
          <div className="text-[12px] text-text-2 leading-relaxed mt-3">
            ¿No lo encuentras? Revisa también tu carpeta de <span className="font-medium text-text">Spam</span> /
            Correo no deseado y márcalo como "No es spam" si aparece ahí.
          </div>

          <button type="button" onClick={handleResend} disabled={resending}
            className="mt-6 w-full h-12 rounded-full border-none text-[15px] font-bold cursor-pointer font-sans bg-accent text-accent-contrast disabled:opacity-60 active:opacity-70 transition-opacity">
            {resending ? 'Reenviando...' : 'Reenviar correo'}
          </button>
        </div>

        <Link to="/login"
          className="block text-center mt-5 text-[13px] text-accent-text no-underline font-medium max-w-[380px] mx-auto">
          Volver a iniciar sesión
        </Link>
      </div>
    )
  }

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div className="w-full max-w-[380px] mx-auto bg-surface rounded-[32px] px-6 py-8">
          <div className="mb-6">
            <div className="text-[22px] font-bold leading-tight text-text">Crear cuenta</div>
            <div className="text-[13px] text-text-2 mt-1">Regístrate en el sistema del gimnasio</div>
          </div>

          <div className="flex flex-col gap-5">
            <div>
              <label className="block text-[12px] font-medium text-text-2 mb-1.5">Nombre completo</label>
              <input type="text" placeholder="Tu nombre" value={name} onChange={(e) => setName(e.target.value)}
                className="w-full bg-surface2 border-none text-text text-[17px] px-4 py-4 rounded-2xl outline-none font-ios focus:ring-2 focus:ring-accent/30 placeholder:text-text-2" />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-text-2 mb-1.5">Correo electrónico</label>
              <input type="email" placeholder="tu@correo.com" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-surface2 border-none text-text text-[17px] px-4 py-4 rounded-2xl outline-none font-ios focus:ring-2 focus:ring-accent/30 placeholder:text-text-2" />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-text-2 mb-1.5">Contraseña</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-surface2 border-none text-text text-[17px] pl-4 pr-20 py-4 rounded-2xl outline-none font-ios focus:ring-2 focus:ring-accent/30 placeholder:text-text-2" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-9 px-3 rounded-full bg-surface3/50 border-none text-text-2 cursor-pointer text-[11px] font-semibold font-ios active:opacity-70 transition-opacity">
                  {showPw ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-[12px] font-medium text-text-2 mb-1.5">Confirmar contraseña</label>
              <div className="relative">
                <input type={showConfirmPw ? 'text' : 'password'} placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-surface2 border-none text-text text-[17px] pl-4 pr-20 py-4 rounded-2xl outline-none font-ios focus:ring-2 focus:ring-accent/30 placeholder:text-text-2" />
                <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-9 px-3 rounded-full bg-surface3/50 border-none text-text-2 cursor-pointer text-[11px] font-semibold font-ios active:opacity-70 transition-opacity">
                  {showConfirmPw ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
            </div>
          </div>

          {/* Términos y condiciones */}
          <div className="mt-5 flex items-start gap-2.5">
            <input
              id="accept-terms"
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-0.5 h-[18px] w-[18px] shrink-0 cursor-pointer rounded-[5px] accent-accent outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            />
            <p className="text-[12px] leading-relaxed text-text-2">
              <label htmlFor="accept-terms" className="cursor-pointer select-none">
                He leído y acepto los{' '}
              </label>
              <button
                type="button"
                onClick={() => setTermsOpen(true)}
                className="inline cursor-pointer rounded-sm border-none bg-transparent p-0 font-sans text-[12px] font-medium text-accent underline underline-offset-2 outline-none transition-opacity focus-visible:ring-2 focus-visible:ring-accent/40 active:opacity-70"
              >
                Términos y Condiciones y el Aviso de Privacidad
              </button>
            </p>
          </div>

          <button type="submit" disabled={submitting || !acceptedTerms}
            className={`mt-6 w-full h-12 rounded-full border-none text-[15px] font-bold cursor-pointer font-sans active:opacity-70 transition-opacity
              ${submitting || !acceptedTerms ? 'bg-accent-dim text-text-3' : 'bg-accent text-accent-contrast'}`}>
            {submitting ? 'Registrando...' : 'Crear cuenta'}
          </button>
        </div>
      </form>

      <div className="text-center mt-5 text-[13px] text-text-2 max-w-[380px] mx-auto">
        ¿Ya tienes cuenta?{' '}
        <Link to="/login" className="text-accent-text no-underline font-medium">Iniciar sesión</Link>
      </div>

      <BottomSheet
        open={termsOpen}
        onClose={() => setTermsOpen(false)}
        title={
          <span className="inline-flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            {PRIVACY_NOTICE.title}
          </span>
        }
        maxWidth="560px"
        footer={
          <Button variant="primary" className="w-full" onClick={() => setTermsOpen(false)}>
            Cerrar
          </Button>
        }
      >
        <div className="flex flex-col gap-5 pb-1">
          <p className="rounded-tile bg-amber-bg px-3 py-2 text-[11px] leading-relaxed text-amber-text">
            <LegalText text={PRIVACY_NOTICE.pendingNote} />
          </p>

          {PRIVACY_NOTICE.sections.map((section) => (
            <section key={section.heading} className="flex flex-col gap-2">
              <h3 className="text-[13px] font-semibold text-text">{section.heading}</h3>
              {section.blocks.map((block, index) => {
                if (block.kind === 'p') {
                  return (
                    <p key={index} className="text-[12px] leading-relaxed text-text-2">
                      <LegalText text={block.text} />
                    </p>
                  )
                }
                if (block.kind === 'label') {
                  return (
                    <p key={index} className="text-[12px] font-semibold leading-relaxed text-text-2">
                      <LegalText text={block.text} />
                    </p>
                  )
                }
                return (
                  <ul key={index} className="list-disc space-y-1 pl-5 text-[12px] leading-relaxed text-text-2">
                    {block.items.map((item) => (
                      <li key={item}>
                        <LegalText text={item} />
                      </li>
                    ))}
                  </ul>
                )
              })}
            </section>
          ))}
        </div>
      </BottomSheet>
    </div>
  )
}