import { useState, useEffect } from 'react';
import { membersService, type MemberListItem } from '@/services/members.service'
import { SearchInput } from '@/components/ui/molecules/SearchInput'
import { ScreenHeader } from '@/components/ui/layout/ScreenHeader'

const AV_COLORS = [
  { bg: 'var(--accent-dim)', fg: 'var(--accent)' },
  { bg: 'rgba(16,185,129,0.15)', fg: '#34d399' },
  { bg: 'rgba(244,114,182,0.15)', fg: '#f472b6' },
  { bg: 'rgba(168,85,247,0.15)', fg: '#c084fc' },
  { bg: 'rgba(251,146,60,0.15)', fg: '#fb923c' },
  { bg: 'rgba(20,184,166,0.15)', fg: '#2dd4bf' },
]

function colorForName(name: string) {
  const idx = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % AV_COLORS.length
  return AV_COLORS[idx]
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '??'
}

interface MemberDisplay {
  id: string
  name: string
  email: string
  av: string
  avC: number
  hasHuella: boolean
}

export default function FingerprintPage() {
  const [members, setMembers] = useState<MemberDisplay[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<MemberDisplay | null>(null);
  const [step, setStep] = useState(0);
  const [scans, setScans] = useState(0);
  const [sensorState, setSensorState] = useState<'idle'|'scanning'|'success'|'error'>('idle');
  const [history, setHistory] = useState<{name:string;av:string;avC:number;time:string}[]>([]);

  useEffect(() => {
    membersService.getAll({ role: 'member', pageSize: 200 }).then(res => {
      setMembers(res.data.map((m: MemberListItem) => ({
        id: m.id,
        name: m.full_name,
        email: m.email || '',
        av: initials(m.full_name),
        avC: m.full_name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % AV_COLORS.length,
        hasHuella: false,
      })))
    }).catch(() => {})
  }, []);

  const filtered = members.filter(m =>
    !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search)
  );

  function selectMember(m: MemberDisplay) {
    setSelected(m);
    resetScanner();
  }

  function resetScanner() {
    setStep(0);
    setScans(0);
    setSensorState('idle');
  }

  function startCapture() {
    if (!selected) return;
    setStep(1);
    setScans(0);
    setSensorState('scanning');
    let i = 0;
    const delays = [1800, 2200, 1600];
    function nextScan() {
      if (i >= 3) {
        onAllScanned();
        return;
      }
      setTimeout(() => {
        setScans(prev => {
          const next = prev + 1;
          if (next < 3) {
            setTimeout(nextScan, 800);
          } else {
            setTimeout(() => { nextScan() }, 100);
          }
          return next;
        });
        i++;
      }, delays[i] || 1800);
    }
    nextScan();
  }

  function onAllScanned() {
    setSensorState('scanning');
    setTimeout(() => {
      setSensorState('success');
      setStep(2);
      const now = new Date();
      const ts = now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
      if (selected) {
        setHistory(prev => [{ name: selected.name, av: selected.av, avC: selected.avC, time: ts }, ...prev]);
        setSelected({ ...selected, hasHuella: true });
      }
    }, 2600);
  }

  const av = selected ? AV_COLORS[selected.avC] : null;

  return (
    <>
      <ScreenHeader
        title="Registro de huella"
        subtitle="Alta y verificación de huellas dactilares"
        wide
        actions={
          <span className="text-[11px] text-text-3 bg-surface  px-2.5 py-1.5 rounded-full font-mono">
            Lector: <span className="text-green-text">● Conectado</span>
          </span>
        }
      />
      <div className="px-4 sm:px-6 py-4 flex-1 flex flex-col gap-5 mx-auto w-full max-w-[1100px]">
        <style>{`@keyframes scanDown { 0%{top:5%} 100%{top:95%} }`}</style>
        <div>
          <div className="text-[22px] font-semibold tracking-tight">Registro de Huella Dactilar</div>
          <div className="text-[13px] text-text-2 mt-1">
            Captura y guarda el template de huella de cada miembro (simulado)
          </div>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5 items-start">
        <div className="bg-surface  rounded-[var(--radius)] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
            <div>
              <div className="text-[13px] font-semibold">Seleccionar miembro</div>
              <div className="text-[11px] text-text-3 mt-0.5">Haz clic para iniciar el registro</div>
            </div>
          </div>
          <div className="p-[10px] border-b border-border">
            <SearchInput value={search} onChange={(v) => setSearch(v)} placeholder="Buscar miembro…" />
          </div>
          <div className="max-h-[420px] overflow-y-auto">
            {filtered.map((m) => {
              const isSel = selected?.id === m.id;
              const c = AV_COLORS[m.avC];
              return (
                <div key={m.id} onClick={() => selectMember(m)}
                  className={`flex items-center gap-[10px] px-4 py-[11px] border-b border-border cursor-pointer transition-colors duration-100 ${
                    isSel ? 'bg-accent-dim border-l-2 border-l-accent' : 'bg-transparent border-l-2 border-l-transparent'
                  }`}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0"
                    style={{ background: c.bg, color: c.fg }}>{m.av}</div>
                  <div className="flex-1">
                    <div className="text-[13px] font-medium">{m.name}</div>
                    <div className="text-[11px] text-text-3 mt-[1px]">{m.email}</div>
                  </div>
                  <div className="shrink-0">
                    {m.hasHuella ? (
                      <span className="text-[10px] bg-green-bg text-green-text px-2 py-[2px] rounded-full font-medium">✓ Huella</span>
                    ) : (
                      <span className="text-[10px] bg-surface2 text-text-3 px-2 py-[2px] rounded-full border border-dashed border-border2">Sin huella</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {!selected ? (
            <div className="bg-surface  rounded-[var(--radius)] p-[60px] text-center">
              <div className="text-4xl mb-3">👆</div>
              <div className="text-[15px] font-semibold mb-1.5">Selecciona un miembro</div>
              <div className="text-[13px] text-text-3">Elige un miembro de la lista para registrar o actualizar su huella dactilar.</div>
            </div>
          ) : (
            <>
              <div className="bg-surface  rounded-[var(--radius)] p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-[17px] font-semibold shrink-0"
                  style={{ background: av?.bg, color: av?.fg }}>{selected.av}</div>
                <div>
                  <div className="text-base font-semibold">{selected.name}</div>
                  <div className="text-xs text-text-3 mt-[3px]">{selected.email}</div>
                </div>
                <div className="ml-auto">
                  {selected.hasHuella ? (
                    <span className="inline-flex items-center gap-1 px-[9px] py-[2px] rounded-full text-[10px] font-medium bg-green-bg text-green-text">
                      <span className="w-[5px] h-[5px] rounded-full bg-green"></span>Huella registrada
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-[9px] py-[2px] rounded-full text-[10px] font-medium bg-red-bg text-red-text">
                      <span className="w-[5px] h-[5px] rounded-full bg-red"></span>Sin huella
                    </span>
                  )}
                </div>
              </div>

              {selected.hasHuella && (
                <div className="flex items-start gap-[10px] px-3.5 py-3 rounded-2xl text-xs bg-amber-bg text-amber-text border border-[rgba(245,158,11,0.2)]">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14" className="shrink-0 mt-[1px]">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                  <span>Este miembro ya tiene una huella registrada. Continuar <strong>reemplazará</strong> el template actual.</span>
                </div>
              )}

              <div className="bg-surface  rounded-[var(--radius)] overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
                  <div>
                    <div className="text-[13px] font-semibold">Sensor de huella</div>
                    <div className="text-[11px] text-text-3 mt-0.5">
                      {sensorState === 'scanning' ? 'Mantenlo quieto hasta escuchar el pitido' : sensorState === 'success' ? 'Template registrado correctamente' : 'Coloca el dedo sobre el lector cuando estés listo'}
                    </div>
                  </div>
                </div>

                <div className="p-8 flex flex-col items-center gap-6">
                  <div className="flex items-center w-full">
                    {['Inicio','Escaneo','Verificación','Guardado'].map((label, i) => {
                      const state = step > i ? 'done' : step === i && sensorState !== 'idle' ? 'active' : '';
                      const isActive = state === 'active';
                      const isDone = state === 'done';
                      return (
                        <div key={label} className="flex-1 flex flex-col items-center gap-1.5 relative">
                          {i < 3 && (
                            <div className="absolute left-1/2 right-[-50%] h-px top-[14px] bg-border2 z-0" />
                          )}
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold z-[1] ${
                            isDone ? 'bg-green-bg text-green-text border border-green' :
                            isActive ? 'bg-accent-dim text-accent border border-accent' :
                            'bg-surface2 text-text-3 border border-border2'
                          }`}>
                            {isDone ? (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                            ) : (i + 1)}
                          </div>
                          <div className={`text-[10px] text-center ${
                            isDone ? 'text-green-text' : isActive ? 'text-accent' : 'text-text-3'
                          }`}>{label}</div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="w-[180px] h-[220px] rounded-[20px] flex flex-col items-center justify-center gap-4 relative overflow-hidden transition-[border-color,background] duration-300"
                    style={{
                      background: sensorState === 'scanning' ? 'rgba(232,255,71,0.04)' : sensorState === 'success' ? 'rgba(34,197,94,0.06)' : sensorState === 'error' ? 'rgba(239,68,68,0.06)' : 'var(--surface2)',
                      border: `2px solid ${
                        sensorState === 'scanning' ? 'var(--accent)' :
                        sensorState === 'success' ? 'var(--green)' :
                        sensorState === 'error' ? 'var(--red)' : 'var(--border2)'
                      }`,
                    }}>
                    {sensorState === 'scanning' && (
                      <div className="absolute left-0 right-0 h-[2px] opacity-100"
                        style={{
                          background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
                          animation: 'scanDown 1.5s ease-in-out infinite',
                        }} />
                    )}
                    <svg className="fp-icon transition-all duration-300" viewBox="0 0 80 80" fill="none" width="72" height="72">
                      {sensorState === 'success' ? (
                        <><circle cx="40" cy="40" r="28" stroke="#4ade80" strokeWidth="3"/><polyline points="28,40 36,48 52,32" stroke="#4ade80" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></>
                      ) : sensorState === 'error' ? (
                        <><circle cx="40" cy="40" r="28" stroke="#f87171" strokeWidth="3"/><line x1="30" y1="30" x2="50" y2="50" stroke="#f87171" strokeWidth="3" strokeLinecap="round"/><line x1="50" y1="30" x2="30" y2="50" stroke="#f87171" strokeWidth="3" strokeLinecap="round"/></>
                      ) : (
                        <>
                          <path d="M40 10C23.4 10 10 23.4 10 40" stroke={sensorState === 'scanning' ? 'var(--accent)' : 'var(--text-3)'} strokeWidth="3" strokeLinecap="round"/>
                          <path d="M40 10C56.6 10 70 23.4 70 40" stroke={sensorState === 'scanning' ? 'var(--accent)' : 'var(--text-3)'} strokeWidth="3" strokeLinecap="round"/>
                          <path d="M40 20C28.9 20 20 28.9 20 40" stroke={sensorState === 'scanning' ? 'var(--accent)' : 'var(--text-3)'} strokeWidth="3" strokeLinecap="round"/>
                          <path d="M40 20C51.1 20 60 28.9 60 40" stroke={sensorState === 'scanning' ? 'var(--accent)' : 'var(--text-3)'} strokeWidth="3" strokeLinecap="round"/>
                          <path d="M40 30C34.5 30 30 34.5 30 40" stroke={sensorState === 'scanning' ? 'var(--accent)' : 'var(--text-3)'} strokeWidth="3" strokeLinecap="round"/>
                          <path d="M40 30C45.5 30 50 34.5 50 40" stroke={sensorState === 'scanning' ? 'var(--accent)' : 'var(--text-3)'} strokeWidth="3" strokeLinecap="round"/>
                          <path d="M40 30 L40 70" stroke={sensorState === 'scanning' ? 'var(--accent)' : 'var(--text-3)'} strokeWidth="3" strokeLinecap="round"/>
                          <path d="M20 40 C20 55 28 65 40 70" stroke={sensorState === 'scanning' ? 'var(--accent)' : 'var(--text-3)'} strokeWidth="3" strokeLinecap="round"/>
                          <path d="M60 40 C60 55 52 65 40 70" stroke={sensorState === 'scanning' ? 'var(--accent)' : 'var(--text-3)'} strokeWidth="3" strokeLinecap="round"/>
                          <path d="M30 40 C30 51 34 60 40 65" stroke={sensorState === 'scanning' ? 'var(--accent)' : 'var(--text-3)'} strokeWidth="3" strokeLinecap="round"/>
                          <path d="M50 40 C50 51 46 60 40 65" stroke={sensorState === 'scanning' ? 'var(--accent)' : 'var(--text-3)'} strokeWidth="3" strokeLinecap="round"/>
                        </>
                      )}
                    </svg>
                    <div className="text-[13px] font-medium text-center"
                      style={{ color: sensorState === 'scanning' ? 'var(--accent)' : sensorState === 'success' ? 'var(--green-text)' : sensorState === 'error' ? 'var(--red-text)' : 'var(--text-3)' }}>
                      {sensorState === 'idle' ? 'Esperando…' : sensorState === 'scanning' ? (scans < 3 ? 'Coloca el dedo…' : 'Procesando…') : sensorState === 'success' ? '¡Huella guardada!' : 'Error'}
                    </div>
                  </div>

                  {step === 1 && (
                    <div className="w-full">
                      <div className="flex justify-between text-xs mb-2">
                        <span className="text-text-2">Capturas realizadas</span>
                        <span className="text-accent font-mono">{scans} / 3</span>
                      </div>
                      <div className="flex gap-1.5">
                        {[0,1,2].map(i => (
                          <div key={i} className={`flex-1 h-1.5 rounded-[3px] transition-all duration-300 ${
                            i < scans ? 'bg-accent border border-accent' :
                            i === scans && sensorState === 'scanning' ? 'bg-surface2 border border-accent' :
                            'bg-surface2 border border-border'
                          }`} />
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-[10px] w-full">
                    <button onClick={startCapture}
                      disabled={sensorState === 'scanning'}
                      className={`flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-2xl text-[13px] font-medium cursor-pointer border-none font-inherit ${
                        sensorState === 'scanning' ? 'opacity-40 cursor-not-allowed' : ''
                      }`}
                      style={{ background: 'var(--accent)', color: '#000' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        {sensorState === 'success'
                          ? <polyline points="1 4 1 10 7 10"/>
                          : <><path d="M12 11c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2z"/><path d="M17.657 16.657L13.414 20.9a2 2 0 0 1-2.827 0l-4.244-4.243a8 8 0 1 1 11.314 0z"/></>}
                      </svg>
                      {sensorState === 'success' ? 'Repetir captura' : 'Iniciar captura'}
                    </button>
                    {sensorState === 'scanning' && (
                      <button onClick={resetScanner}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl text-[13px] cursor-pointer bg-transparent text-text-2 border border-border2 font-inherit">
                        Cancelar
                      </button>
                    )}
                  </div>

                  {sensorState === 'success' && (
                    <div className="flex items-start gap-[10px] px-3.5 py-3 rounded-2xl text-xs w-full bg-green-bg text-green-text border border-[rgba(34,197,94,0.2)]">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14" className="shrink-0 mt-[1px]">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      <div>
                        <strong>Huella registrada exitosamente.</strong><br />
                        <span className="text-[11px] opacity-80">
                          (Simulado — no se persiste en BD)
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-[10px] px-3.5 py-3 rounded-2xl text-xs bg-[var(--teal-bg)] text-[var(--teal-text)] border border-[rgba(45,212,191,0.2)]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14" className="shrink-0 mt-[1px]">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
                <div>
                  <strong>Flujo de registro</strong><br />
                  Se realizan <strong>3 capturas</strong> simuladas de la misma huella. En producción, el SDK del lector genera un template ISO/IEC 19794-2 que se almacena como <code className="bg-[rgba(0,0,0,0.2)] px-[5px] py-[1px] rounded">bytea</code> en Supabase.
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="bg-surface  rounded-[var(--radius)] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <div>
            <div className="text-[13px] font-semibold">Historial de registros</div>
            <div className="text-[11px] text-text-3 mt-0.5">Últimas huellas capturadas en esta sesión</div>
          </div>
          <span className="text-xs text-text-3">{history.length} registro{history.length !== 1 ? 's' : ''}</span>
        </div>
        {history.length === 0 ? (
          <div className="py-10 text-center text-text-3 text-[13px]">Aún no se han registrado huellas en esta sesión.</div>
        ) : (
          history.map((h, i) => {
            const c = AV_COLORS[h.avC];
            return (
              <div key={i} className={`flex items-center gap-3 px-[18px] py-3 ${i < history.length - 1 ? 'border-b border-border' : ''}`}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0"
                  style={{ background: c.bg, color: c.fg }}>{h.av}</div>
                <div className="flex-1">
                  <div className="text-[13px] font-medium">{h.name}</div>
                  <div className="text-[11px] text-text-3 mt-0.5">Template guardado (simulado)</div>
                </div>
                <div className="text-[11px] font-mono text-text-3">{h.time}</div>
                <span className="inline-flex items-center gap-1 px-2 py-[2px] rounded-full text-[10px] font-medium bg-green-bg text-green-text">
                  <span className="w-[5px] h-[5px] rounded-full bg-green"></span>OK
                </span>
              </div>
            );
          })
        )}
      </div>
    </div></>
  );
}
