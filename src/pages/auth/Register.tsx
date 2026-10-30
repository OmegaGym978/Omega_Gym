import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { authService } from '@/services/auth.service'
import { translateAuthError } from '@/services/auth-error'
import { GoogleButton } from '@/components/ui/atoms/GoogleButton'
import { toast } from 'sonner'

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
      <div className="bg-surface  rounded-3xl p-8">
        <div className="mb-6">
          <div className="text-[18px] font-semibold">Revisa tu bandeja de entrada</div>
          <div className="text-[12px] text-text-3 mt-1">Verificación de correo pendiente</div>
        </div>
        <div className="text-[13px] text-text-2 leading-relaxed">
          Te enviamos un link de confirmación a{' '}
          <span className="font-medium text-text">{verifyPending}</span>.
          Ábrelo para activar tu cuenta y poder iniciar sesión.
        </div>
        <div className="text-[12px] text-text-3 leading-relaxed mt-2">
          ¿No lo encuentras? Revisa también tu carpeta de <span className="font-medium text-text">Spam</span> /
          Correo no deseado y márcalo como "No es spam" si aparece ahí.
        </div>
        <div className="flex flex-col gap-3 mt-6">
          <button type="button" onClick={handleResend} disabled={resending}
            className="w-full py-[11px] rounded-full border-none text-[14px] font-semibold cursor-pointer font-sans bg-accent text-accent-contrast disabled:opacity-60">
            {resending ? 'Reenviando...' : 'Reenviar correo'}
          </button>
          <Link to="/login"
            className="text-center text-[12px] text-accent-text no-underline font-medium">
            Volver a iniciar sesión
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-surface  rounded-3xl p-8">
      <div className="mb-6">
        <div className="text-[18px] font-semibold">Crear cuenta</div>
        <div className="text-[12px] text-text-3 mt-1">Regístrate en el sistema del gimnasio</div>
      </div>

      <GoogleButton />

      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-[1px] bg-border" />
        <span className="text-[11px] text-text-3 uppercase tracking-[0.06em] font-medium">o con tu correo</span>
        <div className="flex-1 h-[1px] bg-border" />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-[12px] font-medium text-text-2 mb-1.5">Nombre completo</label>
          <input type="text" placeholder="Tu nombre" value={name} onChange={(e) => setName(e.target.value)}
            className="w-full bg-surface border-none text-text text-[17px] px-4 py-4 rounded-2xl outline-none font-sans focus:ring-2 focus:ring-accent/40 placeholder:text-text-3" />
        </div>
        <div>
          <label className="block text-[12px] font-medium text-text-2 mb-1.5">Correo electrónico</label>
          <input type="email" placeholder="tu@correo.com" value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-surface border-none text-text text-[17px] px-4 py-4 rounded-2xl outline-none font-sans focus:ring-2 focus:ring-accent/40 placeholder:text-text-3" />
        </div>
        <div>
          <label className="block text-[12px] font-medium text-text-2 mb-1.5">Contraseña</label>
          <div className="relative">
            <input type={showPw ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface border-none text-text text-[17px] px-4 py-4 rounded-2xl outline-none font-sans focus:ring-2 focus:ring-accent/40 placeholder:text-text-3" />
            <button type="button" onClick={() => setShowPw(!showPw)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-none border-none text-text-3 cursor-pointer text-[11px] font-sans">
              {showPw ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-[12px] font-medium text-text-2 mb-1.5">Confirmar contraseña</label>
          <div className="relative">
            <input type={showConfirmPw ? 'text' : 'password'} placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-surface border-none text-text text-[17px] px-4 py-4 rounded-2xl outline-none font-sans focus:ring-2 focus:ring-accent/40 placeholder:text-text-3" />
            <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-none border-none text-text-3 cursor-pointer text-[11px] font-sans">
              {showConfirmPw ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>
        </div>
        <button type="submit" disabled={submitting}
          className={`w-full py-[11px] rounded-full border-none text-[14px] font-semibold cursor-pointer font-sans mt-1
            ${submitting ? 'bg-accent-dim text-text-3' : 'bg-accent text-accent-contrast'}`}>
          {submitting ? 'Registrando...' : 'Crear cuenta'}
        </button>
      </form>

      <div className="text-center mt-5 text-[12px] text-text-3">
        ¿Ya tienes cuenta?{' '}
        <Link to="/login" className="text-accent-text no-underline font-medium">Iniciar sesión</Link>
      </div>
    </div>
  )
}