import { useEffect, useState } from 'react'
import { BottomSheet } from '@/components/ui/molecules/BottomSheet'
import type { BuilderExercise } from './types'

export type ExerciseMetaMode = 'note' | 'rest' | 'link'

interface Props {
  open: boolean
  mode: ExerciseMetaMode
  exercise: BuilderExercise | null
  onClose: () => void
  onSave: (patch: Partial<Pick<BuilderExercise, 'notes' | 'rest_seconds' | 'reference_link'>>) => void
}

const REST_OPTIONS: { label: string; value: number | null }[] = [
  { label: 'Sin descanso', value: null },
  { label: '30 s', value: 30 },
  { label: '45 s', value: 45 },
  { label: '60 s', value: 60 },
  { label: '90 s', value: 90 },
  { label: '120 s', value: 120 },
  { label: '180 s', value: 180 },
]

function normalizeUrl(url: string): string {
  const v = url.trim()
  if (!v) return ''
  if (!/^https?:\/\//i.test(v)) return 'https://' + v
  return v
}

const TITLES: Record<ExerciseMetaMode, string> = {
  note: 'Nota del ejercicio',
  rest: 'Descanso entre series',
  link: 'Enlace de referencia',
}

const SUBTITLES: Record<ExerciseMetaMode, string> = {
  note: 'Visible en la rutina y en Mi plan',
  rest: 'Se guarda junto al ejercicio',
  link: 'Video o guía del movimiento',
}

export function ExerciseMetaSheet({ open, mode, exercise, onClose, onSave }: Props) {
  const [note, setNote] = useState('')
  const [link, setLink] = useState('')
  const [customRest, setCustomRest] = useState('')

  useEffect(() => {
    if (!open || !exercise) return
    setNote(exercise.notes ?? '')
    setLink(exercise.reference_link ?? '')
    setCustomRest(
      exercise.rest_seconds != null && !REST_OPTIONS.some(o => o.value === exercise.rest_seconds)
        ? String(exercise.rest_seconds)
        : '',
    )
  }, [open, exercise])

  if (!exercise) return null

  function saveNote() {
    onSave({ notes: note.trim() || null })
    onClose()
  }

  function saveLink() {
    onSave({ reference_link: normalizeUrl(link) || null })
    onClose()
  }

  function saveRest(value: number | null) {
    onSave({ rest_seconds: value })
    onClose()
  }

  function saveCustomRest() {
    const value = Number(customRest.replace(',', '.'))
    if (!Number.isFinite(value) || value <= 0) return
    saveRest(Math.min(3600, Math.round(value)))
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={TITLES[mode]}
      subtitle={`${exercise.exercise_name} · ${SUBTITLES[mode]}`}
    >
      {mode === 'note' && (
        <>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Técnica, sensaciones, indicaciones..."
            className="w-full bg-surface2 border border-border2 rounded-2xl px-4 py-3 text-[14px] text-text outline-none resize-y min-h-[120px] focus:border-accent/60 transition-colors"
          />
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-full text-[13px] font-semibold text-text-2 bg-surface2 border border-border cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={saveNote}
              className="flex-1 py-3 rounded-full text-[13px] font-bold bg-accent text-accent-contrast border border-accent/25 cursor-pointer"
            >
              Guardar nota
            </button>
          </div>
        </>
      )}

      {mode === 'rest' && (
        <>
          <div className="grid grid-cols-2 gap-2">
            {REST_OPTIONS.map(option => {
              const active = exercise.rest_seconds === option.value
              return (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => saveRest(option.value)}
                  className={`py-3 rounded-2xl text-[13px] font-semibold border cursor-pointer transition-colors ${
                    active
                      ? 'bg-accent-dim text-accent border-accent/40'
                      : 'bg-surface2 text-text-2'
                  }`}
                >
                  {option.label}
                </button>
              )
            })}
          </div>

          <div className="mt-4">
            <div className="text-[11px] font-semibold text-text-3 mb-1.5">Personalizado (segundos)</div>
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                max="3600"
                inputMode="numeric"
                value={customRest}
                onChange={e => setCustomRest(e.target.value)}
                placeholder="Ej. 75"
                className="flex-1 bg-surface2 border border-border2 rounded-2xl px-4 py-3 text-[15px] text-text outline-none focus:border-accent/60 transition-colors"
              />
              <button
                type="button"
                onClick={saveCustomRest}
                disabled={!customRest.trim()}
                className="px-5 py-3 rounded-full text-[13px] font-bold bg-accent text-accent-contrast border border-accent/25 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Aplicar
              </button>
            </div>
          </div>
        </>
      )}

      {mode === 'link' && (
        <>
          <input
            type="url"
            value={link}
            onChange={e => setLink(e.target.value)}
            placeholder="youtube.com/watch?v=..."
            className="w-full bg-surface2 border border-border2 rounded-2xl px-4 py-3 text-[15px] text-text outline-none focus:border-accent/60 transition-colors"
          />
          <p className="text-[11px] text-text-3 leading-relaxed mt-2">
            Si agregas un enlace a un GIF, se usará como imagen del ejercicio en la rutina.
          </p>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-full text-[13px] font-semibold text-text-2 bg-surface2 border border-border cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={saveLink}
              className="flex-1 py-3 rounded-full text-[13px] font-bold bg-accent text-accent-contrast border border-accent/25 cursor-pointer"
            >
              Guardar enlace
            </button>
          </div>
        </>
      )}
    </BottomSheet>
  )
}
