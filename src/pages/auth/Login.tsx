import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { translateAuthError } from '@/services/auth-error'
import { toast } from 'sonner'

export default function LoginPage() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await login(email, password)
      const user = useAuthStore.getState().user
      if (user?.role === 'admin') navigate('/dashboard')
      else if (user?.role === 'trainer') navigate('/dashboard')
      else if (user?.role === 'member') navigate('/my-plan')
      else navigate('/')
    } catch (err: unknown) {
      toast.error(translateAuthError(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <div className="w-full max-w-[380px] mx-auto bg-surface rounded-[32px] px-6 py-8">
        <div className="mb-6">
          <div className="text-[22px] font-bold leading-tight text-text">Iniciar sesión</div>
          <div className="text-[13px] text-text-2 mt-1">Accede a tu cuenta del gimnasio</div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-5">
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
            <div className="flex justify-end">
              <Link to="/forgot-password" className="bg-none border-none text-accent-text text-[13px] cursor-pointer font-sans no-underline py-1 active:opacity-70">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
          </div>

          <button type="submit" disabled={submitting}
            className={`mt-6 w-full h-12 rounded-full border-none text-[15px] font-bold cursor-pointer font-sans active:opacity-70 transition-opacity
              ${submitting ? 'bg-accent-dim text-text-3' : 'bg-accent text-accent-contrast'}`}>
            {submitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>

      <div className="text-center mt-5 text-[13px] text-text-2 max-w-[380px] mx-auto">
        ¿No tienes cuenta?{' '}
        <Link to="/register" className="text-accent-text no-underline font-medium">Registrarse</Link>
      </div>

      {import.meta.env.DEV && (
        <div className="mt-5 p-3.5 bg-amber-bg rounded-tile text-[11px] text-amber-text leading-relaxed max-w-[380px] mx-auto">
          <strong>Demo:</strong> admin@omega.com / Admin123! &nbsp;·&nbsp; trainer@omega.com / Trainer123! &nbsp;·&nbsp; member@omega.com / Member123!
        </div>
      )}
    </div>
  )
}
