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
      <div className="bg-surface  rounded-3xl p-8">
        <div className="mb-6">
          <div className="text-[18px] font-semibold">Revisa tu bandeja de entrada</div>
          <div className="text-[12px] text-text-3 mt-1">Restablecimiento de contraseña</div>
        </div>
        <div className="text-[13px] text-text-2 leading-relaxed">
          Si existe una cuenta con{' '}
          <span className="font-medium text-text">{sentTo}</span>, te enviamos un
          enlace para restablecer tu contraseña. Ábrelo para crear una nueva.
        </div>
        <div className="flex flex-col gap-3 mt-6">
          <Link to="/login"
            className="w-full text-center py-[11px] rounded-full border-none text-[14px] font-semibold cursor-pointer font-sans bg-accent text-accent-contrast no-underline">
            Volver a iniciar sesión
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-surface  rounded-3xl p-8">
      <div className="mb-6">
        <div className="text-[18px] font-semibold">Recuperar contraseña</div>
        <div className="text-[12px] text-text-3 mt-1">Te enviaremos un enlace a tu correo</div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-[12px] font-medium text-text-2 mb-1.5">Correo electrónico</label>
          <input type="email" placeholder="tu@correo.com" value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-surface border-none text-text text-[17px] px-4 py-4 rounded-2xl outline-none font-sans focus:ring-2 focus:ring-accent/40 placeholder:text-text-3" />
        </div>
        <button type="submit" disabled={submitting}
          className={`w-full py-[11px] rounded-full border-none text-[14px] font-semibold cursor-pointer font-sans mt-1
            ${submitting ? 'bg-accent-dim text-text-3' : 'bg-accent text-accent-contrast'}`}>
          {submitting ? 'Enviando...' : 'Enviar enlace'}
        </button>
      </form>

      <div className="text-center mt-5 text-[12px] text-text-3">
        ¿Recordaste tu contraseña?{' '}
        <Link to="/login" className="text-accent-text no-underline font-medium">Iniciar sesión</Link>
      </div>
    </div>
  )
}