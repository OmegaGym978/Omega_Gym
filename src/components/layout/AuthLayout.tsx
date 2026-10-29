import { Outlet } from 'react-router-dom'
import { useThemeStore } from '@/store/theme.store'

const sunPath = 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z'
const moonPath = 'M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z'

export function AuthLayout() {
  const { theme, toggle } = useThemeStore()

  return (
    <div className="min-h-dvh flex items-center justify-center bg-bg relative overflow-hidden px-4">
      <button onClick={toggle}
        className="fixed top-4 right-4 z-50 w-9 h-9 rounded-full border border-border bg-surface flex items-center justify-center cursor-pointer text-text transition-colors"
        aria-label="Cambiar tema"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d={theme === 'dark' ? moonPath : sunPath} />
        </svg>
      </button>
      <div className="absolute -top-1/5 -right-[10%] w-[40%] h-[60%] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(var(--accent-rgb),0.06) 0%, transparent 70%)' }} />
      <div className="absolute -bottom-[15%] -left-[5%] w-[35%] h-[50%] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(var(--accent-rgb),0.04) 0%, transparent 70%)' }} />
      <div className="w-[400px] max-w-[92vw]">
        <div className="text-center mb-8">
          <div className="flex flex-col items-center gap-3">
            <div className="w-[52px] h-[52px] rounded-3xl flex items-center justify-center"
              style={{ background: 'var(--logo-bg)', border: '1.5px solid var(--logo-border)' }}>
              <svg viewBox="0 0 24 24" fill="none" width="28" height="28">
                <text x="12" y="19" fontFamily="serif" fontSize="20" fontWeight="bold" style={{ fill: 'var(--logo-omega)' }} textAnchor="middle">Ω</text>
              </svg>
            </div>
            <div className="text-[28px] font-bold -tracking-[0.03em]">Omega Gym</div>
            <div className="text-[12px] text-text-3">Sistema de Gestión</div>
          </div>
        </div>
        <Outlet />
      </div>
    </div>
  )
}
