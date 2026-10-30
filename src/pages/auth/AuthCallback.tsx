import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { authService } from '@/services/auth.service'
import { toast } from 'sonner'

export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const handled = useRef(false)

  useEffect(() => {
    if (handled.current) return
    handled.current = true

    async function finish() {
      const url = new URL(window.location.href)
      const query = url.searchParams
      const hash = new URLSearchParams(url.hash ? url.hash.slice(1) : '')

      const type = query.get('type') || hash.get('type')
      const code = query.get('code')

      let session = (await supabase.auth.getSession()).data.session

      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
          console.error('Auth callback exchange error:', error)
          toast.error('El enlace de confirmación es inválido o ya fue usado.')
          navigate('/login', { replace: true })
          return
        }
        session = data.session
      } else {
        const accessToken = hash.get('access_token')
        const refreshToken = hash.get('refresh_token')
        if (accessToken && refreshToken) {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
          if (error) {
            console.error('Auth callback setSession error:', error)
            toast.error('El enlace es inválido o ya fue usado.')
            navigate('/login', { replace: true })
            return
          }
          session = data.session
        }
      }

      if (!session) {
        toast.error('No se pudo completar el inicio de sesión. Intenta de nuevo.')
        navigate('/login', { replace: true })
        return
      }

      if (type === 'recovery') {
        navigate('/reset-password', { replace: true })
        return
      }

      const profile = await authService.getProfile(session.user.id).catch(() => null)
      if (profile?.role === 'admin' || profile?.role === 'trainer') {
        navigate('/dashboard', { replace: true })
        return
      }
      if (profile?.role === 'member') {
        navigate('/my-plan', { replace: true })
        return
      }
      toast.success('Correo confirmado. Inicia sesión para continuar.')
      navigate('/login', { replace: true })
    }

    finish()
  }, [navigate])

  return (
    <div className="min-h-dvh flex items-center justify-center bg-bg">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-accent border-t-transparent animate-spin" />
        <div className="text-[13px] text-text-3">Completando inicio de sesión…</div>
      </div>
    </div>
  )
}