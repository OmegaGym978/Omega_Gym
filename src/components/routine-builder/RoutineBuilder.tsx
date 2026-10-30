import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { trainingService, type ExerciseInput, type PlanSet } from '@/services/training.service'
import type { Exercise } from '@/services/exercises.service'
import { useAuthStore } from '@/store/auth.store'
import { ExerciseMultiPicker } from './ExerciseMultiPicker'
import { ExerciseMetaSheet, type ExerciseMetaMode } from './ExerciseMetaSheet'
import { ConfirmSheet } from '@/components/ui/molecules/ConfirmSheet'
import type { BuilderExercise, BuilderSet, EditPlanData } from './types'

export type { EditPlanData } from './types'

interface Props {
  open: boolean
  onClose: () => void
  onSave: (planId?: string) => void
  editPlan?: EditPlanData | null
  kind?: 'trainer' | 'personal'
}

let _tempCounter = 0
function tempKey(): string {
  return `tmp_${Date.now()}_${++_tempCounter}`
}

/** Series del formulario a partir de un plan guardado (con o sin set_details). */
function setsFromPlan(ex: EditPlanData['exercises'][number]): BuilderSet[] {
  if (ex.set_details && ex.set_details.length > 0) {
    return ex.set_details.map(set => ({
      weight: set.weight != null ? String(set.weight) : '',
      reps: set.reps != null ? String(set.reps) : '',
    }))
  }
  const count = Math.max(1, ex.sets ?? 1)
  return Array.from({ length: count }, () => ({
    weight: '',
    reps: ex.reps != null ? String(ex.reps) : '',
  }))
}

function parseSetNumber(value: string): number | null {
  const raw = value.trim().replace(',', '.')
  if (!raw) return null
  const n = Number(raw)
  if (!Number.isFinite(n) || n < 0) return null
  return Math.min(9999, n)
}

function toPlanSets(sets: BuilderSet[]): PlanSet[] {
  return sets
    .map(set => ({ weight: parseSetNumber(set.weight), reps: parseSetNumber(set.reps) }))
    .filter(set => set.weight !== null || set.reps !== null)
}

function snapshot(name: string, description: string, exercises: BuilderExercise[]): string {
  return JSON.stringify({
    name,
    description,
    exercises: exercises.map(e => [
      e.exercise_id,
      e.exercise_name,
      e.notes,
      e.reference_link,
      e.rest_seconds,
      e.set_details,
    ]),
  })
}

const SET_INPUT =
  'h-11 w-full bg-surface2 border border-border rounded-xl px-3 text-center text-[14px] font-semibold ' +
  'text-text outline-none placeholder:text-text-3 focus:border-accent/60 transition-colors'

export function RoutineBuilder({ open, onClose, onSave, editPlan, kind = 'trainer' }: Props) {
  const user = useAuthStore(s => s.user)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [exercises, setExercises] = useState<BuilderExercise[]>([])

  const [pickerOpen, setPickerOpen] = useState(false)
  const [menuKey, setMenuKey] = useState<string | null>(null)
  const [meta, setMeta] = useState<{ key: string; mode: ExerciseMetaMode } | null>(null)
  const [confirm, setConfirm] = useState<'close' | 'empty' | null>(null)
  const [triedName, setTriedName] = useState(false)
  const [saving, setSaving] = useState(false)
  const [baseline, setBaseline] = useState('')

  useEffect(() => {
    if (!open) return
    const nextName = editPlan?.name ?? ''
    const nextDescription = editPlan?.description ?? ''
    const nextExercises: BuilderExercise[] = editPlan
      ? [...editPlan.exercises]
          .sort((a, b) => a.order_index - b.order_index)
          .map(ex => ({
            key: tempKey(),
            exercise_id: ex.exercise_id ?? null,
            exercise_name: ex.exercise_name,
            muscle: ex.muscle,
            sets: ex.sets,
            reps: ex.reps,
            rest_seconds: ex.rest_seconds,
            notes: ex.notes,
            reference_link: ex.reference_link,
            set_details: setsFromPlan(ex),
          }))
      : []

    setName(nextName)
    setDescription(nextDescription)
    setExercises(nextExercises)
    setBaseline(snapshot(nextName, nextDescription, nextExercises))
    setPickerOpen(false)
    setMenuKey(null)
    setMeta(null)
    setConfirm(null)
    setTriedName(false)
    setSaving(false)
  }, [open, editPlan])

  const isDirty = useMemo(
    () => open && snapshot(name, description, exercises) !== baseline,
    [open, name, description, exercises, baseline],
  )

  const metaExercise = exercises.find(e => e.key === meta?.key) ?? null

  function addExercises(selected: Exercise[]) {
    const existing = new Set(
      exercises.map(e => e.exercise_id).filter((id): id is string => !!id),
    )
    const additions = selected
      .filter(ex => !existing.has(ex.id))
      .map<BuilderExercise>(ex => ({
        key: tempKey(),
        exercise_id: ex.id,
        exercise_name: ex.name_es || ex.name,
        muscle: ex.muscle_group ?? null,
        sets: 1,
        reps: 12,
        rest_seconds: null,
        notes: null,
        reference_link: ex.gif_url ?? null,
        set_details: [{ weight: '', reps: '12' }],
      }))

    if (additions.length === 0) {
      toast.info('Esos ejercicios ya están en la rutina')
      return
    }
    setExercises(prev => [...prev, ...additions])
    setPickerOpen(false)
  }

  function updateExercise(key: string, patch: Partial<BuilderExercise>) {
    setExercises(prev => prev.map(e => (e.key === key ? { ...e, ...patch } : e)))
  }

  function deleteExercise(key: string) {
    setExercises(prev => prev.filter(e => e.key !== key))
    setMenuKey(null)
    setMeta(null)
  }

  function moveExercise(key: string, direction: -1 | 1) {
    setExercises(prev => {
      const index = prev.findIndex(e => e.key === key)
      const target = index + direction
      if (index === -1 || target < 0 || target >= prev.length) return prev
      const next = [...prev]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  function updateSet(key: string, index: number, patch: Partial<BuilderSet>) {
    setExercises(prev => prev.map(e => (
      e.key === key
        ? { ...e, set_details: e.set_details.map((set, i) => (i === index ? { ...set, ...patch } : set)) }
        : e
    )))
  }

  function addSet(key: string) {
    setExercises(prev => prev.map(e => {
      if (e.key !== key) return e
      const previous = e.set_details[e.set_details.length - 1]
      return {
        ...e,
        set_details: [
          ...e.set_details,
          { weight: previous?.weight ?? '', reps: previous?.reps ?? '12' },
        ],
      }
    }))
  }

  function removeSet(key: string, index: number) {
    setExercises(prev => prev.map(e => {
      if (e.key !== key || e.set_details.length <= 1) return e
      return { ...e, set_details: e.set_details.filter((_, i) => i !== index) }
    }))
  }

  function hasInvalidSets(): boolean {
    return exercises.some(ex =>
      ex.set_details.some(set => parseSetNumber(set.weight) !== null && parseSetNumber(set.reps) === null),
    )
  }

  async function persist() {
    if (!user || saving) return
    if (hasInvalidSets()) {
      toast.error('Cada serie con peso necesita repeticiones')
      return
    }
    setSaving(true)
    try {
      let planId = editPlan?.id
      if (planId) {
        await trainingService.update(planId, {
          name: name.trim(),
          description: description.trim() || null,
        })
      } else {
        const plan = await trainingService.create({
          name: name.trim(),
          description: description.trim() || undefined,
          created_by: user.id,
          kind,
        })
        planId = plan.id
      }

      const payload: ExerciseInput[] = exercises.map((ex, i) => {
        const details = toPlanSets(ex.set_details)
        return {
          exercise_id: ex.exercise_id,
          exercise_name: ex.exercise_name,
          muscle: ex.muscle,
          sets: details.length,
          reps: details.find(set => set.reps !== null)?.reps ?? null,
          rest_seconds: ex.rest_seconds,
          notes: ex.notes,
          reference_link: ex.reference_link,
          day: null,
          set_details: details,
          order_index: i,
        }
      })

      await trainingService.upsertExercises(planId, payload)
      toast.success(editPlan ? 'Rutina actualizada' : kind === 'personal' ? 'Rutina creada' : 'Plan creado')
      onSave(planId)
      onClose()
    } catch (e: any) {
      toast.error('Error al guardar: ' + (e?.message || 'intenta de nuevo'))
    } finally {
      setSaving(false)
    }
  }

  function handleSave() {
    if (!name.trim()) {
      setTriedName(true)
      return
    }
    if (exercises.length === 0) {
      setConfirm('empty')
      return
    }
    persist()
  }

  function attemptClose() {
    if (saving) return
    if (isDirty) setConfirm('close')
    else onClose()
  }

  if (!open) return null

  const isEditing = !!editPlan
  const noun = kind === 'personal' ? 'rutina' : 'plan'
  const headerTitle = isEditing ? `Editar ${noun}` : `Crear ${noun}`

  return (
    <div className="fixed inset-0 z-[55] bg-bg flex flex-col animate-picker-in">
      {/* Header */}
      <header className="shrink-0 flex items-center justify-between gap-2 px-3 sm:px-5 h-14 border-b border-border bg-bg/95 backdrop-blur">
        <button
          onClick={attemptClose}
          className="text-[13px] font-semibold text-accent bg-transparent border-none cursor-pointer px-2 py-2 rounded-full transition-colors"
        >
          Cancelar
        </button>
        <div className="text-[13px] font-bold truncate">{headerTitle}</div>
        <button
          onClick={handleSave}
          disabled={saving || !name.trim()}
          className="px-4 py-2 rounded-full text-[12px] font-bold text-accent-contrast bg-accent border border-accent/25 cursor-pointer transition-all active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
      </header>

      {/* Contenido */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 pt-5 pb-8 max-w-[720px] mx-auto w-full">
        <input
          value={name}
          onChange={e => { setName(e.target.value); setTriedName(false) }}
          placeholder="Título de la rutina"
          aria-label="Título de la rutina"
          className={`w-full bg-transparent border-none outline-none text-[26px] sm:text-[30px] font-bold text-text placeholder:text-text-3/70 pb-1 ${
            triedName && !name.trim() ? 'placeholder:text-red-text' : ''
          }`}
        />
        {triedName && !name.trim() && (
          <div className="text-[11px] text-red-text mt-1">Ponle un título a tu rutina</div>
        )}

        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Describe el objetivo de la rutina (opcional)"
          rows={2}
          className="mt-2 w-full bg-transparent border-none outline-none resize-none text-[13px] leading-relaxed text-text-2 placeholder:text-text-3"
        />

        <div className="mt-5 flex items-center justify-between">
          <div className="text-[11px] uppercase tracking-[0.08em] text-text-3 font-bold">
            Ejercicios
          </div>
          {exercises.length > 0 && (
            <div className="text-[11px] text-text-3">
              {exercises.length} ejercicio{exercises.length !== 1 ? 's' : ''} ·{' '}
              {exercises.reduce((acc, e) => acc + e.set_details.length, 0)} series
            </div>
          )}
        </div>

        {exercises.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 gap-3 text-center">
            <div className="w-16 h-16 rounded-full bg-accent-dim text-accent flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6.5 6.5l11 11M4 9v6M20 9v6M7 7v10M17 7v10" />
              </svg>
            </div>
            <p className="text-sm text-text-3 max-w-[240px] leading-relaxed">
              Empieza agregando un ejercicio a tu rutina
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 mt-3">
            {exercises.map((ex, idx) => (
              <article key={ex.key} className="bg-surface  rounded-2xl p-4">
                {/* Cabecera del ejercicio */}
                <div className="flex items-center gap-3">
                  {ex.reference_link && ex.reference_link.endsWith('.gif') ? (
                    <img
                      src={ex.reference_link}
                      alt=""
                      loading="lazy"
                      className="w-12 h-12 rounded-full object-cover bg-surface2 shrink-0 border border-border"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-surface2 shrink-0 flex items-center justify-center text-text-3 border border-border">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M6.5 6.5l11 11M4 9v6M20 9v6M7 7v10M17 7v10" />
                      </svg>
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-semibold truncate">{ex.exercise_name}</div>
                    {ex.muscle && (
                      <div className="text-[11px] text-text-3 truncate mt-0.5">{ex.muscle}</div>
                    )}
                  </div>

                  <div className="relative shrink-0">
                    <button
                      type="button"
                      aria-label={`Opciones de ${ex.exercise_name}`}
                      aria-expanded={menuKey === ex.key}
                      onClick={() => setMenuKey(menuKey === ex.key ? null : ex.key)}
                      className="w-9 h-9 rounded-full bg-transparent text-text-2 flex items-center justify-center border-none cursor-pointer transition-colors"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="12" cy="5" r="1.7" /><circle cx="12" cy="12" r="1.7" /><circle cx="12" cy="19" r="1.7" />
                      </svg>
                    </button>

                    {menuKey === ex.key && (
                      <>
                        <div className="fixed inset-0 z-20" onClick={() => setMenuKey(null)} />
                        <div className="absolute right-0 top-10 z-30 w-52 bg-surface2 border border-border2 rounded-2xl  overflow-hidden">
                          <MenuAction
                            label="Mover arriba"
                            disabled={idx === 0}
                            onClick={() => { moveExercise(ex.key, -1); setMenuKey(null) }}
                            icon={<><polyline points="18 15 12 9 6 15" /></>}
                          />
                          <MenuAction
                            label="Mover abajo"
                            disabled={idx === exercises.length - 1}
                            onClick={() => { moveExercise(ex.key, 1); setMenuKey(null) }}
                            icon={<><polyline points="6 9 12 15 18 9" /></>}
                          />
                          <MenuAction
                            label="Enlace de referencia"
                            onClick={() => { setMeta({ key: ex.key, mode: 'link' }); setMenuKey(null) }}
                            icon={<><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></>}
                          />
                          <MenuAction
                            label="Quitar ejercicio"
                            danger
                            onClick={() => deleteExercise(ex.key)}
                            icon={<><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></>}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Acciones rápidas */}
                <div className="flex gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => setMeta({ key: ex.key, mode: 'rest' })}
                    className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-surface3 text-text-2 text-[12px] font-semibold border-none cursor-pointer transition-colors"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <circle cx="12" cy="13" r="8" /><path d="M12 9v4l2.5 1.5" /><path d="M9 2h6" />
                    </svg>
                    Descanso: {ex.rest_seconds ? `${ex.rest_seconds}s` : '--'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setMeta({ key: ex.key, mode: 'note' })}
                    className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-surface3 text-text-2 text-[12px] font-semibold border-none cursor-pointer transition-colors"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" /><line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="13" y2="17" />
                    </svg>
                    Nota
                    {ex.notes && <span className="w-1.5 h-1.5 rounded-full bg-accent" />}
                  </button>
                </div>

                {/* Encabezado de columnas */}
                <div className="grid grid-cols-[40px_1fr_1fr_24px] gap-2 mt-3 px-1">
                  <span className="text-[10px] font-bold text-text-3 tracking-[0.06em]">SERIE</span>
                  <span className="text-[10px] font-bold text-text-3 tracking-[0.06em]">KGS</span>
                  <span className="text-[10px] font-bold text-text-3 tracking-[0.06em] inline-flex items-center gap-1">
                    REPS
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </span>
                  <span />
                </div>

                {/* Series */}
                <div className="flex flex-col gap-1.5 mt-2">
                  {ex.set_details.map((set, setIndex) => (
                    <div key={`${ex.key}-set-${setIndex}`} className="grid grid-cols-[40px_1fr_1fr_24px] gap-2 items-center">
                      <div className="h-11 rounded-xl bg-surface3 text-text-2 text-[12px] font-bold flex items-center justify-center">
                        {setIndex + 1}
                      </div>
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="-"
                        aria-label={`Peso serie ${setIndex + 1}`}
                        value={set.weight}
                        onChange={e => updateSet(ex.key, setIndex, { weight: e.target.value })}
                        className={SET_INPUT}
                      />
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="-"
                        aria-label={`Repeticiones serie ${setIndex + 1}`}
                        value={set.reps}
                        onChange={e => updateSet(ex.key, setIndex, { reps: e.target.value })}
                        className={SET_INPUT}
                      />
                      <button
                        type="button"
                        onClick={() => removeSet(ex.key, setIndex)}
                        disabled={ex.set_details.length <= 1}
                        aria-label={`Eliminar serie ${setIndex + 1}`}
                        className="w-6 h-6 rounded-full text-text-3 flex items-center justify-center border-none bg-transparent cursor-pointer disabled:opacity-20 disabled:cursor-default transition-colors"
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => addSet(ex.key)}
                  className="mt-2.5 w-full h-10 rounded-full bg-surface3 text-text text-[12px] font-semibold border-none cursor-pointer active:scale-[0.99] inline-flex items-center justify-center gap-1.5 transition-all"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Agregar serie
                </button>
              </article>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="mt-4 w-full py-3.5 rounded-full bg-accent text-accent-contrast text-[13px] font-bold border border-accent/25 cursor-pointer transition-all active:scale-[0.99] inline-flex items-center justify-center gap-2"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Agregar ejercicio
        </button>
      </div>

      <ExerciseMultiPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onConfirm={addExercises}
        excludeIds={exercises.map(e => e.exercise_id).filter((id): id is string => !!id)}
      />

      <ExerciseMetaSheet
        open={meta !== null && !!metaExercise}
        mode={meta?.mode ?? 'note'}
        exercise={metaExercise}
        onClose={() => setMeta(null)}
        onSave={patch => { if (meta) updateExercise(meta.key, patch) }}
      />

      <ConfirmSheet
        open={confirm !== null}
        title={confirm === 'close' ? '¿Descartar cambios?' : 'Guardar sin ejercicios'}
        description={
          confirm === 'close'
            ? 'Vas a salir sin guardar los cambios de esta rutina.'
            : 'La rutina se guardará vacía. Podrás agregar ejercicios después.'
        }
        confirmLabel={confirm === 'close' ? 'Descartar' : 'Guardar'}
        cancelLabel={confirm === 'close' ? 'Seguir editando' : 'Cancelar'}
        danger={confirm === 'close'}
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm === 'close') onClose()
          else persist()
        }}
      />
    </div>
  )
}

function MenuAction({
  label,
  icon,
  onClick,
  disabled,
  danger,
}: {
  label: string
  icon: ReactNode
  onClick: () => void
  disabled?: boolean
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-[12px] font-medium bg-transparent border-none cursor-pointer transition-opacity active:opacity-70 disabled:opacity-30 disabled:cursor-default ${
        danger ? 'text-red-text' : 'text-text-2'
      }`}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        {icon}
      </svg>
      {label}
    </button>
  )
}
