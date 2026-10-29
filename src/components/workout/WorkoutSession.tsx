import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import type { PlanExercise } from '@/services/training.service'
import { sessionsService, type SessionSetInput } from '@/services/sessions.service'
import { Checkmark } from '@/components/ui/atoms/Checkmark'

interface Props {
  open: boolean
  onClose: () => void
  planName: string
  planId?: string | null
  memberId?: string | null
  exercises: PlanExercise[]
  loading?: boolean
  onSaved?: () => void
}

type SessionSet = {
  weight: string
  reps: string
  completed: boolean
}

type SessionExercise = {
  key: string
  exercise_id: string | null
  name: string
  muscle: string | null
  sets: SessionSet[]
}

function buildExercises(exercises: PlanExercise[]): SessionExercise[] {
  return exercises.map(ex => {
    const planned = ex.set_details && ex.set_details.length > 0
      ? ex.set_details
      : Array.from({ length: Math.max(1, ex.sets ?? 1) }, () => ({ weight: null, reps: ex.reps }))

    return {
      key: ex.id,
      exercise_id: ex.exercise_id,
      name: ex.exercise_name,
      muscle: ex.muscle,
      sets: planned.map(set => ({
        weight: set.weight != null ? String(set.weight) : '',
        reps: set.reps != null ? String(set.reps) : '',
        completed: false,
      })),
    }
  })
}

function parseNumber(value: string): number | null {
  const raw = value.trim().replace(',', '.')
  if (!raw) return null
  const n = Number(raw)
  if (!Number.isFinite(n) || n < 0) return null
  return Math.min(9999, n)
}

const INPUT =
  'h-10 w-full bg-surface2 border-none rounded-xl px-2 text-center text-[14px] font-semibold ' +
  'text-text outline-none placeholder:text-text-3 focus:ring-2 focus:ring-accent/40 transition-shadow'

/**
 * Sesión de entrenamiento: registra peso y reps por serie y guarda el
 * entrenamiento al finalizar. Si se cierra antes, no se persiste nada.
 */
export function WorkoutSession({ open, onClose, planName, planId, memberId, exercises, loading, onSaved }: Props) {
  const [items, setItems] = useState<SessionExercise[]>([])
  const [startedAt, setStartedAt] = useState<string>(() => new Date().toISOString())
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setItems(buildExercises(exercises))
    setStartedAt(new Date().toISOString())
    setSaving(false)
  }, [open, planName, exercises])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  const totals = useMemo(() => {
    let completed = 0
    let all = 0
    for (const ex of items) {
      all += ex.sets.length
      completed += ex.sets.filter(s => s.completed).length
    }
    return { completed, all }
  }, [items])

  if (!open) return null

  function patchSet(exerciseKey: string, index: number, patch: Partial<SessionSet>) {
    setItems(prev => prev.map(ex => (
      ex.key === exerciseKey
        ? { ...ex, sets: ex.sets.map((s, i) => (i === index ? { ...s, ...patch } : s)) }
        : ex
    )))
  }

  async function finish() {
    if (saving) return
    if (!memberId) {
      toast.error('No se pudo identificar al miembro')
      return
    }

    const completed: SessionSetInput[] = []
    for (const ex of items) {
      ex.sets.forEach((set, index) => {
        if (!set.completed) return
        completed.push({
          exercise_id: ex.exercise_id,
          exercise_name: ex.name,
          set_index: index,
          weight: parseNumber(set.weight),
          reps: parseNumber(set.reps),
          completed: true,
        })
      })
    }

    if (completed.length === 0) {
      toast.info('Marca al menos una serie para guardar la sesión')
      return
    }

    if (completed.some(s => s.reps === null)) {
      toast.error('Cada serie marcada necesita repeticiones')
      return
    }

    setSaving(true)
    try {
      const result = await sessionsService.saveSession({
        memberId,
        planId: planId ?? null,
        planName,
        startedAt,
        sets: completed,
      })
      toast.success(
        `Entrenamiento guardado · ${result.totalSets} series · ${Math.round(result.totalVolume).toLocaleString('es-MX')} kg`,
      )
      onSaved?.()
      onClose()
    } catch (e: any) {
      toast.error('No se pudo guardar la sesión: ' + (e?.message || 'intenta de nuevo'))
    } finally {
      setSaving(false)
    }
  }

  const progress = totals.all === 0 ? 0 : Math.round((totals.completed / totals.all) * 100)

  return (
    <div className="fixed inset-0 z-[65] bg-bg flex flex-col animate-picker-in">
      <header className="shrink-0 px-4 pt-4 pb-3 border-b border-border bg-bg safe-top">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            aria-label="Cerrar entrenamiento"
            className="w-9 h-9 rounded-full bg-surface2 text-text-2 flex items-center justify-center border-none cursor-pointer active:opacity-70 transition-opacity"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <div className="min-w-0 flex-1 text-center">
            <div className="text-[10px] uppercase tracking-[0.12em] text-text-3 font-bold">Entrenando</div>
            <div className="text-[14px] font-bold truncate">{planName}</div>
          </div>
          <div className="w-9 h-9 rounded-full bg-accent-dim text-accent flex items-center justify-center text-[11px] font-bold">
            {progress}%
          </div>
        </div>

        <div className="mt-3 h-1.5 rounded-full bg-surface2 overflow-hidden">
          <div className="h-full bg-accent transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 max-w-[720px] mx-auto w-full">
        <div className="mb-4 flex items-start gap-2 rounded-2xl bg-surface px-3.5 py-3">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-text shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="text-[11px] leading-relaxed text-text-3">
            Ajusta peso y reps de cada serie y márcala al terminarla. La sesión se guarda al tocar Finalizar.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">
            {[0, 1, 2].map(i => <div key={i} className="h-28 rounded-2xl skeleton" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <div className="w-14 h-14 rounded-full bg-surface2 text-text-3 flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M6.5 6.5l11 11M4 9v6M20 9v6M7 7v10M17 7v10" />
              </svg>
            </div>
            <div className="text-sm font-semibold">Esta rutina no tiene ejercicios</div>
            <div className="text-xs text-text-3 max-w-[240px]">Agrega ejercicios desde el menú de la rutina para poder entrenarla.</div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {items.map((ex, exIndex) => (
              <article key={ex.key} className="bg-surface rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-accent-dim text-accent flex items-center justify-center text-[11px] font-bold shrink-0">
                    {exIndex + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-semibold truncate">{ex.name}</div>
                    {ex.muscle && <div className="text-[11px] text-text-3 truncate mt-0.5">{ex.muscle}</div>}
                  </div>
                </div>

                <div className="grid grid-cols-[56px_1fr_1fr_36px] gap-2 mt-3 px-1">
                  <span className="text-[10px] font-bold text-text-3 tracking-[0.06em]">SERIE</span>
                  <span className="text-[10px] font-bold text-text-3 tracking-[0.06em]">KGS</span>
                  <span className="text-[10px] font-bold text-text-3 tracking-[0.06em]">REPS</span>
                  <span />
                </div>

                <div className="flex flex-col gap-1.5 mt-2">
                  {ex.sets.map((set, setIndex) => (
                    <div key={setIndex} className="grid grid-cols-[56px_1fr_1fr_36px] gap-2 items-center">
                      <div className="h-10 rounded-xl bg-surface2 text-text-2 text-[12px] font-bold flex items-center justify-center">
                        {setIndex + 1}
                      </div>
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="-"
                        aria-label={`Peso serie ${setIndex + 1}`}
                        value={set.weight}
                        onChange={e => patchSet(ex.key, setIndex, { weight: e.target.value })}
                        className={INPUT}
                      />
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="-"
                        aria-label={`Repeticiones serie ${setIndex + 1}`}
                        value={set.reps}
                        onChange={e => patchSet(ex.key, setIndex, { reps: e.target.value })}
                        className={INPUT}
                      />
                      <button
                        type="button"
                        onClick={() => patchSet(ex.key, setIndex, { completed: !set.completed })}
                        aria-pressed={set.completed}
                        aria-label={`Marcar serie ${setIndex + 1}`}
                        className="w-9 h-9 rounded-full flex items-center justify-center border-none bg-transparent cursor-pointer active:opacity-70 transition-opacity"
                      >
                        <Checkmark checked={set.completed} size="sm" />
                      </button>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <div className="shrink-0 px-4 py-3 border-t border-border bg-bg safe-bottom">
        <div className="flex items-center justify-between gap-3 max-w-[720px] mx-auto">
          <div className="text-[11px] text-text-3">
            {totals.completed} / {totals.all} series
          </div>
          <button
            onClick={finish}
            disabled={saving || totals.completed === 0}
            className="px-6 h-12 rounded-full bg-accent text-accent-contrast text-[14px] font-bold border-none cursor-pointer active:opacity-70 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          >
            {saving ? 'Guardando…' : 'Finalizar'}
          </button>
        </div>
      </div>
    </div>
  )
}
