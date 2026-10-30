import { useState, useEffect } from 'react';
import { checkInsService, type CheckInWithMember } from '@/services/checkIns.service'
import { membersService } from '@/services/members.service'
import { membershipsService } from '@/services/memberships.service'

interface CheckResult {
  name?: string
  av: string
  avC: string
  status: 'success' | 'warn' | 'error'
  badgeText: string
  msg: string
  sub: string
}

const INITIALS_COLORS = [
  { bg: 'rgba(59,130,246,0.15)', fg: '#60a5fa' },
  { bg: 'rgba(16,185,129,0.15)', fg: '#34d399' },
  { bg: 'rgba(244,114,182,0.15)', fg: '#f472b6' },
  { bg: 'rgba(251,146,60,0.15)', fg: '#fb923c' },
  { bg: 'rgba(168,85,247,0.15)', fg: '#c084fc' },
  { bg: 'rgba(20,184,166,0.15)', fg: '#2dd4bf' },
]

function colorForName(name: string) {
  const idx = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % INITIALS_COLORS.length
  return INITIALS_COLORS[idx]
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '??'
}

async function findMemberByName(search: string) {
  const { data } = await membersService.getAll({ search, pageSize: 10 })
  return data.find(m => m.full_name.toLowerCase().includes(search.toLowerCase()) && m.role === 'member') || null
}

export default function CheckInKioskPage() {
  const [time, setTime] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);
  const [sensorState, setSensorState] = useState<'idle'|'scanning'|'success'|'error'|'warn'>('idle');
  const [result, setResult] = useState<CheckResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [recent, setRecent] = useState<CheckInWithMember[]>([]);

  useEffect(() => {
    setMounted(true);
    setTime(new Date());
    const id = setInterval(() => setTime(new Date()), 1000);

    checkInsService.getToday().then(setRecent).catch(() => {});

    return () => clearInterval(id);
  }, []);

  async function simular(tipo: string) {
    if (scanning) return;
    setScanning(true);
    setSensorState('scanning');
    setResult(null);

    const start = Date.now()

    try {
      if (tipo === 'success') {
        const member = await findMemberByName('carlos')
        if (!member) { showError('No se encontró el miembro en la base de datos.'); return }
        const membership = await membershipsService.getActiveByMember(member.id)
        const elapsed = Date.now() - start
        if (elapsed < 1500) await new Promise(r => setTimeout(r, 1500 - elapsed))

        await checkInsService.create({ member_id: member.id, method: 'fingerprint', membership_id: membership?.id })

        setSensorState('success')
        setResult({
          name: member.full_name, av: initials(member.full_name),
          avC: '', status: 'success', badgeText: 'Entrada registrada',
          msg: `Bienvenido, ${member.full_name.split(' ')[0]}. Tu entrada fue registrada exitosamente.`,
          sub: membership
            ? `Membresía · Válida hasta ${new Date(membership.end_date).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}`
            : 'Sin membresía activa',
        })

        const updated = await checkInsService.getToday()
        setRecent(updated)
      }
      else if (tipo === 'success2') {
        const member = await findMemberByName('sofía')
        if (!member) { showError('No se encontró el miembro en la base de datos.'); return }
        const membership = await membershipsService.getActiveByMember(member.id)
        const elapsed = Date.now() - start
        if (elapsed < 1500) await new Promise(r => setTimeout(r, 1500 - elapsed))

        await checkInsService.create({ member_id: member.id, method: 'fingerprint', membership_id: membership?.id })

        setSensorState('success')
        setResult({
          name: member.full_name, av: initials(member.full_name),
          avC: '', status: 'success', badgeText: 'Entrada registrada',
          msg: `Bienvenido, ${member.full_name.split(' ')[0]}. Tu entrada fue registrada exitosamente.`,
          sub: membership
            ? `Membresía · Válida hasta ${new Date(membership.end_date).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}`
            : 'Sin membresía activa',
        })

        const updated = await checkInsService.getToday()
        setRecent(updated)
      }
      else if (tipo === 'warn') {
        const elapsed = Date.now() - start
        if (elapsed < 1500) await new Promise(r => setTimeout(r, 1500 - elapsed))
        setSensorState('warn')
        setResult({
          status: 'warn', av: '⚠', avC: '', badgeText: 'Membresía vencida',
          msg: 'Tu membresía ha vencido. Acércate a recepción para renovarla.',
          sub: 'Acceso restringido hasta renovar membresía.',
        })
      }
      else if (tipo === 'inactive') {
        const elapsed = Date.now() - start
        if (elapsed < 1500) await new Promise(r => setTimeout(r, 1500 - elapsed))
        setSensorState('error')
        setResult({
          status: 'error', av: '✕', avC: '', badgeText: 'Miembro inactivo',
          msg: 'Tu cuenta está inactiva. Contacta a recepción para más información.',
          sub: 'Acceso no permitido.',
        })
      }
      else {
        const elapsed = Date.now() - start
        if (elapsed < 1500) await new Promise(r => setTimeout(r, 1500 - elapsed))
        showError(
          tipo === 'manual'
            ? 'Modo de acceso manual. Por favor identifícate en recepción.'
            : 'La huella no coincide con ningún miembro registrado.'
        )
      }
    } catch (err: any) {
      const elapsed = Date.now() - start
      if (elapsed < 1500) await new Promise(r => setTimeout(r, 1500 - elapsed))
      setSensorState('error')
      setResult({
        status: 'error', av: '✕', avC: '', badgeText: 'Error del sistema',
        msg: err?.message || 'Ocurrió un error al procesar la solicitud.',
        sub: 'Intenta de nuevo o acércate a recepción.',
      })
    }

    setTimeout(() => {
      setSensorState('idle');
      setResult(null);
      setScanning(false);
    }, 4000);
  }

  function showError(msg: string) {
    setSensorState('error')
    setResult({
      status: 'error', av: '✕', avC: '', badgeText: 'No reconocido',
      msg,
      sub: 'Intenta de nuevo o acércate a recepción.',
    })
  }

  function statusBg(status: string) {
    return status === 'success' ? 'rgba(34,197,94,0.04)' : status === 'warn' ? 'rgba(245,158,11,0.04)' : 'rgba(239,68,68,0.04)'
  }
  function statusBorder(status: string) {
    return status === 'success' ? 'rgba(34,197,94,0.3)' : status === 'warn' ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)'
  }

  const sensorBorderColor =
    sensorState === 'scanning' ? 'var(--accent)' :
    sensorState === 'success' ? 'var(--green)' :
    sensorState === 'warn' ? 'var(--amber)' :
    sensorState === 'error' ? 'var(--red)' : 'var(--border2)'

  const sensorInnerBg =
    sensorState === 'scanning' ? 'rgba(232,255,71,0.04)' :
    sensorState === 'success' ? 'rgba(34,197,94,0.08)' :
    sensorState === 'error' ? 'rgba(239,68,68,0.08)' :
    sensorState === 'warn' ? 'rgba(245,158,11,0.08)' : 'var(--surface)'

  const sensorTextColor =
    sensorState === 'scanning' ? 'var(--accent)' :
    sensorState === 'success' ? 'var(--green-text)' :
    sensorState === 'error' ? 'var(--red-text)' :
    sensorState === 'warn' ? 'var(--amber-text)' : 'var(--text-3)'

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#0a0a0a] text-text font-sans grid grid-rows-[auto_1fr_auto]">
      <style>{`
        @keyframes scanDown { 0%{top:5%} 100%{top:95%} }
      `}</style>

      {/* Top bar */}
      <div className="flex items-center justify-between px-8 py-[18px] border-b border-border bg-surface">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl flex items-center justify-center"
            style={{ background: 'var(--logo-bg)', border: '1px solid var(--logo-border)' }}>
            <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
              <text x="12" y="18" fontFamily="serif" fontSize="18" fontWeight="bold" style={{ fill: 'var(--logo-omega)' }} textAnchor="middle">Ω</text>
            </svg>
          </div>
          <div>
            <div className="text-lg font-bold tracking-tight">Omega Gym</div>
            <div className="text-[11px] text-text-3 tracking-[0.08em] uppercase mt-0.5">Check-in con huella dactilar</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs text-green-text">
            <span className="w-2 h-2 rounded-full bg-green"></span>
            Lector activo
          </div>
          <div>
            <div className="text-[22px] font-semibold font-mono tracking-[0.04em] text-text-2">
              {mounted && time ? time.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : ''}
            </div>
            <div className="text-xs text-text-3 text-right">
              {mounted && time ? time.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Center */}
      <div className="flex items-center justify-center flex-col lg:flex-row gap-8 lg:gap-[60px] p-4 lg:p-10 overflow-y-auto">
        {/* Sensor */}
        <div className="flex flex-col items-center gap-7">
          <div className="w-[200px] h-[200px] sm:w-[260px] sm:h-[260px] rounded-full flex items-center justify-center relative transition-colors duration-[400ms]"
            style={{ border: `2px solid ${sensorBorderColor}` }}>
            {sensorState === 'scanning' && (
              <div className="absolute -inset-2 rounded-full border-2 border-transparent"
                style={{ borderTopColor: 'var(--accent)' }} />
            )}
            <div className="w-[160px] h-[160px] sm:w-[200px] sm:h-[200px] rounded-full flex flex-col items-center justify-center gap-3 sm:gap-4 relative overflow-hidden transition-colors duration-[400ms]"
              style={{ background: sensorInnerBg }}>
              {sensorState === 'scanning' && (
                <div className="absolute left-0 right-0 h-[3px]"
                  style={{
                    background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
                    animation: 'scanDown 1.5s ease-in-out infinite',
                  }} />
              )}

              {sensorState === 'success' ? (
                <svg viewBox="0 0 60 60" fill="none" width="60" height="60">
                  <circle cx="30" cy="30" r="28" stroke="#4ade80" strokeWidth="2.5"/>
                  <polyline points="18,30 26,38 42,22" stroke="#4ade80" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : sensorState === 'error' ? (
                <svg viewBox="0 0 60 60" fill="none" width="60" height="60">
                  <circle cx="30" cy="30" r="28" stroke="#f87171" strokeWidth="2.5"/>
                  <line x1="20" y1="20" x2="40" y2="40" stroke="#f87171" strokeWidth="3" strokeLinecap="round"/>
                  <line x1="40" y1="20" x2="20" y2="40" stroke="#f87171" strokeWidth="3" strokeLinecap="round"/>
                </svg>
              ) : sensorState === 'warn' ? (
                <svg viewBox="0 0 60 60" fill="none" width="60" height="60">
                  <circle cx="30" cy="30" r="28" stroke="#fbbf24" strokeWidth="2.5"/>
                  <line x1="30" y1="18" x2="30" y2="34" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round"/>
                  <circle cx="30" cy="42" r="2" fill="#fbbf24"/>
                </svg>
              ) : (
                <svg viewBox="0 0 90 90" fill="none" width="90" height="90" className="transition-all duration-[400ms]">
                  <path d="M45 12C27.3 12 13 26.3 13 44" stroke={sensorState === 'scanning' ? 'var(--accent)' : 'var(--text-3)'} strokeWidth="2.5" strokeLinecap="round"/>
                  <path d="M45 12C62.7 12 77 26.3 77 44" stroke={sensorState === 'scanning' ? 'var(--accent)' : 'var(--text-3)'} strokeWidth="2.5" strokeLinecap="round"/>
                  <path d="M45 22C32 22 22 32 22 44" stroke={sensorState === 'scanning' ? 'var(--accent)' : 'var(--text-3)'} strokeWidth="2.5" strokeLinecap="round"/>
                  <path d="M45 22C58 22 68 32 68 44" stroke={sensorState === 'scanning' ? 'var(--accent)' : 'var(--text-3)'} strokeWidth="2.5" strokeLinecap="round"/>
                  <path d="M45 32C38 32 32 38 32 44" stroke={sensorState === 'scanning' ? 'var(--accent)' : 'var(--text-3)'} strokeWidth="2.5" strokeLinecap="round"/>
                  <path d="M45 32C52 32 58 38 58 44" stroke={sensorState === 'scanning' ? 'var(--accent)' : 'var(--text-3)'} strokeWidth="2.5" strokeLinecap="round"/>
                  <path d="M45 32 L45 78" stroke={sensorState === 'scanning' ? 'var(--accent)' : 'var(--text-3)'} strokeWidth="2.5" strokeLinecap="round"/>
                  <path d="M22 44 C22 62 30 74 45 78" stroke={sensorState === 'scanning' ? 'var(--accent)' : 'var(--text-3)'} strokeWidth="2.5" strokeLinecap="round"/>
                  <path d="M68 44 C68 62 60 74 45 78" stroke={sensorState === 'scanning' ? 'var(--accent)' : 'var(--text-3)'} strokeWidth="2.5" strokeLinecap="round"/>
                  <path d="M32 44 C32 58 37 68 45 74" stroke={sensorState === 'scanning' ? 'var(--accent)' : 'var(--text-3)'} strokeWidth="2.5" strokeLinecap="round"/>
                  <path d="M58 44 C58 58 53 68 45 74" stroke={sensorState === 'scanning' ? 'var(--accent)' : 'var(--text-3)'} strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
              )}

              <div className="text-sm font-medium text-center transition-colors duration-[400ms]" style={{ color: sensorTextColor }}>
                {sensorState === 'idle' ? 'Listo' : sensorState === 'scanning' ? 'Leyendo huella\u2026' : sensorState === 'success' ? '!Bienvenido!' : sensorState === 'warn' ? 'Atenci\u00f3n' : 'No reconocido'}
              </div>
            </div>
          </div>

          <div className="text-[15px] font-semibold text-text-3 text-center max-w-[240px] leading-[1.4] transition-colors duration-[400ms]" style={{ color: sensorState === 'idle' ? 'var(--text-3)' : sensorTextColor }}>
            {sensorState === 'idle' ? 'Coloca tu dedo sobre el lector para registrar tu entrada' :
             sensorState === 'scanning' ? 'Mant\u00e9n el dedo quieto\u2026' :
             sensorState === 'success' ? 'Puedes pasar. !Buen entrenamiento!' :
             sensorState === 'warn' ? 'Ac\u00e9rcate a recepci\u00f3n.' :
             'No se pudo identificar la huella.'}
          </div>
        </div>

        {/* Right side */}
        <div className="w-full sm:w-[340px] flex flex-col gap-5">
          {result ? (
            result.name ? (
              <div className="flex flex-col items-center text-center gap-4 p-7 rounded-[var(--radius)] min-h-[280px] justify-center"
                style={{ background: statusBg(result.status), border: `1px solid ${statusBorder(result.status)}` }}>
                <div className="w-[72px] h-[72px] rounded-full flex items-center justify-center text-2xl font-bold"
                  style={{ background: result.avC ? INITIALS_COLORS[parseInt(result.avC.replace('av-', ''))]?.bg || 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.05)', color: result.avC ? INITIALS_COLORS[parseInt(result.avC.replace('av-', ''))]?.fg || '#888' : '#888' }}>{result.av}</div>
                <div className="text-[22px] font-bold tracking-tight">{result.name}</div>
                <div className="text-[13px] text-text-2">{result.sub}</div>
                <span className={`inline-flex items-center gap-1.5 px-4 py-[6px] rounded-full text-[13px] font-semibold ${
                  result.status === 'success' ? 'bg-green-bg text-green-text' : result.status === 'warn' ? 'bg-amber-bg text-amber-text' : 'bg-red-bg text-red-text'
                }`}>
                  <span className={`w-[7px] h-[7px] rounded-full ${
                    result.status === 'success' ? 'bg-green' : result.status === 'warn' ? 'bg-amber' : 'bg-red'
                  }`}></span>
                  {result.badgeText}
                </span>
                <div className="text-[13px] leading-[1.5]">{result.msg}</div>
                <div className="text-[11px] font-mono text-text-3">
                  {time?.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) || ''}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center gap-4 p-7 rounded-[var(--radius)] min-h-[280px] justify-center"
                style={{ background: statusBg(result.status), border: `1px solid ${statusBorder(result.status)}` }}>
                <div className="text-4xl">{result.status === 'error' ? '\u274c' : '\u26a0\ufe0f'}</div>
                <span className={`inline-flex items-center gap-1.5 px-4 py-[6px] rounded-full text-[13px] font-semibold ${
                  result.status === 'warn' ? 'bg-amber-bg text-amber-text' : 'bg-red-bg text-red-text'
                }`}>
                  <span className={`w-[7px] h-[7px] rounded-full ${result.status === 'warn' ? 'bg-amber' : 'bg-red'}`}></span>
                  {result.badgeText}
                </span>
                <div className="text-[13px] leading-[1.5]">{result.msg}</div>
                <div className="text-[13px] text-text-2">{result.sub}</div>
                <div className="text-[11px] font-mono text-text-3">
                  {time?.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) || ''}
                </div>
              </div>
            )
          ) : (
            <div className="bg-surface  rounded-[var(--radius)] p-7 flex flex-col items-center text-center gap-4 min-h-[280px] justify-center">
              <div className="text-4xl mb-1">{'\uD83C\uDFCB'}</div>
              <div className="text-base font-semibold text-text-2">Esperando identificaci\u00f3n</div>
              <div className="text-[13px] text-text-3 leading-[1.5]">Acerca tu dedo al lector de huella para registrar tu entrada o salida del gym.</div>
            </div>
          )}

          {/* Recent */}
          <div className="bg-surface  rounded-[var(--radius)] overflow-hidden">
            <div className="flex justify-between items-center px-[18px] py-3 border-b border-border text-xs text-text-3">
              <span>Entradas recientes de hoy</span>
              <span className="text-green-text font-medium">{recent.length}</span>
            </div>
            {recent.length === 0 ? (
              <div className="px-[18px] py-4 text-xs text-text-3">Sin registros a\u00fan.</div>
            ) : (
              <div className="max-h-[180px] overflow-y-auto">
                {recent.map((r, i) => {
                  const c = colorForName(r.member_name)
                  return (
                    <div key={r.id} className={`flex items-center gap-[10px] px-[18px] py-[10px] ${i < recent.length - 1 ? 'border-b border-border' : ''}`}>
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0"
                        style={{ background: c.bg, color: c.fg }}>{initials(r.member_name)}</div>
                      <div className="text-xs font-medium flex-1">{r.member_name}</div>
                      <div className="text-[11px] font-mono text-text-3">{new Date(r.check_in_time).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</div>
                      <div className="w-1.5 h-1.5 rounded-full bg-green shrink-0" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Demo buttons */}
      <div className="flex gap-2 flex-wrap px-8 py-3.5 border-t"
        style={{ background: 'rgba(232,255,71,0.03)', borderColor: 'rgba(232,255,71,0.1)' }}>
        <span className="text-[11px] text-text-3 self-center mr-1">Simular lectura:</span>
        <DemoBtn color="g" onClick={() => simular('success')}>{'\u2713'} Huella reconocida (Carlos)</DemoBtn>
        <DemoBtn color="g" onClick={() => simular('success2')}>{'\u2713'} Huella reconocida (Sof\u00eda)</DemoBtn>
        <DemoBtn color="a" onClick={() => simular('warn')}>{'\u26a0'} Membres\u00eda vencida</DemoBtn>
        <DemoBtn color="r" onClick={() => simular('error')}>{'\u2715'} Huella no reconocida</DemoBtn>
        <DemoBtn color="r" onClick={() => simular('inactive')}>{'\u2715'} Miembro inactivo</DemoBtn>
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-between px-8 py-3.5 border-t border-border bg-surface">
        <div className="text-xs text-text-3">
          Omega Gym · Terminal de check-in · Registros guardados en <code className="text-[11px] bg-surface2 px-[6px] py-[1px] rounded text-text-2">check_ins</code> · Supabase
        </div>
        <div className="flex gap-[10px]">
          <button onClick={() => simular('manual')}
            className="text-xs px-3.5 py-[7px] rounded-[var(--radius-sm)] border border-border2 bg-transparent text-text-2 cursor-pointer font-inherit">
            Acceso manual
          </button>
          <button onClick={() => window.location.reload()}
            className="text-xs px-3.5 py-[7px] rounded-[var(--radius-sm)] border border-border2 bg-transparent text-text-2 cursor-pointer font-inherit">
            Reiniciar terminal
          </button>
        </div>
      </div>
    </div>
  );
}

function DemoBtn({ children, color, onClick }: { children: React.ReactNode; color: 'g'|'r'|'a'; onClick: () => void }) {
  const borderColors: Record<string, string> = {
    g: 'rgba(34,197,94,0.3)',
    r: 'rgba(239,68,68,0.3)',
    a: 'rgba(245,158,11,0.3)',
  };
  const textColors: Record<string, string> = {
    g: 'var(--green-text)',
    r: 'var(--red-text)',
    a: 'var(--amber-text)',
  };
  return (
    <button onClick={onClick}
      className="text-[11px] px-3 py-[6px] rounded-[var(--radius-sm)] border bg-transparent cursor-pointer font-inherit"
      style={{ borderColor: borderColors[color], color: textColors[color] }}>
      {children}
    </button>
  );
}
