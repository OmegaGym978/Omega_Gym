import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/auth.store'
import { checkInsService, type CheckIn } from '@/services/checkIns.service'
import { LoadingSpinner } from '@/components/ui/atoms/LoadingSpinner'
import { MetricCard } from '@/components/ui/atoms/MetricCard'
import { fmtDate } from '@/lib/helpers'
import { ScreenHeader } from '@/components/ui/layout/ScreenHeader'

const staggerClass = (i: number) => {
  const map = ['stagger-1', 'stagger-2', 'stagger-3', 'stagger-4', 'stagger-5']
  return map[i] || ''
}

function IconCalendar() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><polyline points="9 13 12 16 17 11"/></svg>
}
function IconStreak() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
}

const METHOD_LABEL: Record<string, string> = { fingerprint: 'Huella', manual: 'Manual', card: 'Tarjeta' }
const METHOD_ICON: Record<string, string> = {
  fingerprint: 'M12 2C10.5 2 9 3.5 9 5c0 1.5 1.5 3 3 3s3-1.5 3-3c0-1.5-1.5-3-3-3zM8 12c0-1.5 1-3 2.5-3.5C12 8.5 12 8 12 8c1.5 0 2 1 2 2.5V12M8 18c1 1 2 2 4 2s3-1 4-2',
  manual: 'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2',
  card: 'M3 10h18M7 15h1m4 0h1M7 19V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2z',
}

export default function MyCheckinsPage() {
  const user = useAuthStore(s => s.user)
  const [loading, setLoading] = useState(true)
  const [checkins, setCheckins] = useState<CheckIn[]>([])

  useEffect(() => {
    if (!user) return
    const ctrl = { ignore: false }
    checkInsService.getByMember(user.id).then(data => {
      if (!ctrl.ignore) setCheckins(data)
    }).finally(() => {
      if (!ctrl.ignore) setLoading(false)
    })
    return () => { ctrl.ignore = true }
  }, [user])

  if (loading) return <LoadingSpinner text="Cargando asistencias…" />

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()

  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const firstDay = new Date(year, month, 1)
  const startPadding = firstDay.getDay()

  const checkinDays = new Set<string>()
  checkins.forEach(c => {
    const d = c.check_in_time.split('T')[0]
    checkinDays.add(d)
  })

  const thisMonthCheckins = checkins.filter(c => {
    const d = new Date(c.check_in_time)
    return d.getMonth() === month && d.getFullYear() === year
  })

  let streak = 0
  const todayStr = now.toISOString().split('T')[0]
  const checkDate = new Date(todayStr)
  for (let i = 0; i < 365; i++) {
    const d = checkDate.toISOString().split('T')[0]
    if (checkinDays.has(d)) {
      streak++
      checkDate.setDate(checkDate.getDate() - 1)
    } else if (i === 0) {
      break
    } else {
      break
    }
  }

  const totalDays = thisMonthCheckins.length
  const monthName = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'][month]

  return (<>
      <ScreenHeader title="Mi asistencia" subtitle="Tus visitas al gym" />
    <div className="px-4 sm:px-5 py-4 flex-1 mx-auto w-full max-w-[560px]">


      <div className={`grid grid-cols-2 gap-2.5 mb-4 animate-slide-up ${staggerClass(1)}`}>
        <MetricCard icon={<IconCalendar />} label="Este mes" value={totalDays} color="accent" />
        <MetricCard icon={<IconStreak />} label="Racha actual" value={streak} color={streak > 0 ? 'green' : 'gray'} />
      </div>

      <div className={`bg-surface  rounded-2xl overflow-hidden animate-slide-up ${staggerClass(2)}`}>
        <div className="px-5 sm:px-6 py-4 border-b border-border">
          <div className="text-[13px] font-semibold capitalize">{monthName} {year}</div>
        </div>
        <div className="p-4 sm:p-5">
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'].map(d => (
              <div key={d} className="text-[10px] text-text-3 text-center font-medium">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: startPadding }).map((_, i) => (
              <div key={`pad-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const checked = checkinDays.has(dateStr)
              const isToday = dateStr === todayStr
              return (
                <div
                  key={day}
                  className={`aspect-square rounded-md flex items-center justify-center text-[13px] font-medium transition-all duration-150 ${
                    checked
                      ? 'bg-accent text-accent-contrast font-semibold scale-100'
                      : isToday
                        ? 'border border-dashed border-text-3 text-text-3'
                        : 'text-text-3 bg-surface2'
                  }`}
                  title={dateStr}
                >
                  {day}
                </div>
              )
            })}
          </div>
          <div className="flex items-center justify-center gap-4 mt-3.5 pt-3.5 border-t border-border">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-[3px] bg-accent" />
              <span className="text-[11px] text-text-3">Check-in</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-[3px] border border-dashed border-text-3" />
              <span className="text-[11px] text-text-3">Hoy</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-[3px] bg-surface2" />
              <span className="text-[11px] text-text-3">Sin registro</span>
            </div>
          </div>
        </div>
      </div>

      <div className={`bg-surface  rounded-2xl overflow-hidden mt-4 animate-slide-up ${staggerClass(3)}`}>
        <div className="px-5 sm:px-6 py-4 border-b border-border">
          <div className="text-[13px] font-semibold">Historial reciente</div>
        </div>
        {checkins.length === 0 ? (
          <div className="py-[60px] text-center text-[13px] text-text-3">Sin registros de asistencia.</div>
        ) : (
          <div className="flex flex-col">
            {checkins.slice(0, 20).map((c, i) => {
              const time = new Date(c.check_in_time)
              const timeStr = time.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
              const dateStr = c.check_in_time.split('T')[0]
              const methodLabel = METHOD_LABEL[c.method] || c.method
              return (
                <div key={c.id} className={`flex items-center justify-between px-5 sm:px-6 py-3 row-hover transition-colors ${i < Math.min(checkins.length, 20) - 1 ? 'border-b border-border' : ''}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${dateStr === todayStr ? 'bg-accent-dim text-accent' : 'bg-surface2 text-text-3'}`}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><polyline points="9 13 12 16 17 11"/></svg>
                    </div>
                    <div className="min-w-0">
                      <div className="text-[12px] font-medium">{fmtDate(dateStr)}</div>
                      <div className="text-[10px] text-text-3 mt-0.5">{timeStr} · {methodLabel}</div>
                    </div>
                  </div>
                  <span className="shrink-0 text-[11px] font-medium px-2 py-[3px] rounded-[5px] bg-green-bg text-green-text">Check-in</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
    </>
  )
}
