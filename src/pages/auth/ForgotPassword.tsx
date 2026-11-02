import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authService } from '@/services/auth.service'
import { translateAuthError } from '@/services/auth-error'
import { toast } from 'sonner'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) {
      toast.error('Ingresa tu correo electrónico')
      return
    }
    setSubmitting(true)
    try {
      await authService.requestPasswordReset(email.trim())
      setSentTo(email.trim())
    } catch (err: unknown) {
      console.error('Password reset error:', err)
      toast.error(translateAuthError(err))
    } finally {
      setSubmitting(false)
    }
  }

  if (sentTo) {
    return (
      <div>
        <div className="w-full max-w-[380px] mx-auto bg-surface rounded-[32px] px-6 py-8">
          <div className="mb-6">
            <div className="text-[22px] font-bold leading-tight text-text">Revisa tu bandeja de entrada</div>
            <div className="text-[13px] text-text-2 mt-1">Restablecimiento de contraseña</div>
          </div>
          <div className="text-[13px] text-text-2 leading-relaxed">
            Si existe una cuenta con{' '}
            <span className="font-medium text-text">{sentTo}</span>, te enviamos un
            enlace para restablecer tu contraseña. Ábrelo para crear una nueva.
          </div>

          <Link to="/login"
            className="mt-6 w-full text-center h-12 rounded-full border-none text-[15px] font-bold cursor-pointer font-sans bg-accent text-accent-contrast no-underline inline-flex items-center justify-center">
            Volver a iniciar sesión
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div className="w-full max-w-[380px] mx-auto bg-surface rounded-[32px] px-6 py-8">
          <div className="mb-6">
            <div className="text-[22px] font-bold leading-tight text-text">Recuperar contraseña</div>
            <div className="text-[13px] text-text-2 mt-1">Te enviaremos un enlace a tu correo</div>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-text-2 mb-1.5">Correo electrónico</label>
            <input type="email" placeholder="tu@correo.com" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-surface2 border-none text-text text-[17px] px-4 py-4 rounded-2xl outline-none font-ios focus:ring-2 focus:ring-accent/30 placeholder:text-text-2" />
          </div>

          <button type="submit" disabled={submitting}
            className={`mt-6 w-full h-12 rounded-full border-none text-[15px] font-bold cursor-pointer font-sans active:opacity-70 transition-opacity
              ${submitting ? 'bg-accent-dim text-text-3' : 'bg-accent text-accent-contrast'}`}>
            {submitting ? 'Enviando...' : 'Enviar enlace'}
          </button>
        </div>
      </form>

      <div className="text-center mt-5 text-[13px] text-text-2">
        ¿Recordaste tu contraseña?{' '}
        <Link to="/login" className="text-accent-text no-underline font-medium">Iniciar sesión</Link>
      </div>
    </div>
  )
}