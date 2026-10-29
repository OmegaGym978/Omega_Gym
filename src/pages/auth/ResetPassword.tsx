import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { authService } from '@/services/auth.service'
import { translateAuthError } from '@/services/auth-error'
import { toast } from 'sonner'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    async function checkSession() {
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        navigate('/login', { replace: true })
        return
      }
      setReady(true)
    }
    checkSession()
  }, [navigate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres')
      return
    }
    setSubmitting(true)
    try {
      await authService.updatePassword(password)
      await supabase.auth.signOut()
      toast.success('Contraseña actualizada. Inicia sesión con tu nueva contraseña.')
      navigate('/login', { replace: true })
    } catch (err: unknown) {
      console.error('Update password error:', err)
      toast.error(translateAuthError(err))
    } finally {
      setSubmitting(false)
    }
  }

  if (!ready) {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-accent border-t-transparent animate-spin" />
        <div className="text-[13px] text-text-3">Verificando sesión…</div>
      </div>
    )
  }

  return (
    <div className="bg-surface  rounded-3xl p-8">
      <div className="mb-6">
        <div className="text-[18px] font-semibold">Nueva contraseña</div>
        <div className="text-[12px] text-text-3 mt-1">Define una nueva clave para tu cuenta</div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-[12px] font-medium text-text-2 mb-1.5">Nueva contraseña</label>
          <div className="relative">
            <input type={showPw ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface border-none text-text text-[17px] px-4 py-4 rounded-2xl outline-none font-sans focus:ring-2 focus:ring-accent/40 placeholder:text-text-3" />
            <button type="button" onClick={() => setShowPw(!showPw)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-none border-none text-text-3 cursor-pointer text-[11px] font-sans">
              {showPw ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>
        </div>
        <button type="submit" disabled={submitting}
          className={`w-full py-[11px] rounded-full border-none text-[14px] font-semibold cursor-pointer font-sans mt-1
            ${submitting ? 'bg-accent-dim text-text-3' : 'bg-accent text-accent-contrast'}`}>
          {submitting ? 'Guardando...' : 'Guardar contraseña'}
        </button>
      </form>
    </div>
  )
}