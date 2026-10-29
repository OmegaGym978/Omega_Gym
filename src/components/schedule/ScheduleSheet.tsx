import { useEffect, useState } from 'react'
import { BottomSheet } from '@/components/ui/molecules/BottomSheet'
import { DAY_LABELS } from '@/lib/dates'

interface Props {
  open: boolean
  onClose: () => void
  planName?: string
  initialDays: number[] | null
  saving?: boolean
  onSave: (days: number[]) => void
}

/** Selector de días de la semana (0 = lunes … 6 = domingo). */
export function ScheduleSheet({ open, onClose, planName, initialDays, saving, onSave }: Props) {
  const [selected, setSelected] = useState<number[]>([])

  useEffect(() => {
    if (!open) return
    setSelected(initialDays ? [...initialDays] : [])
  }, [open, initialDays])

  function toggle(day: number) {
    setSelected(prev => (prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]))
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Programar días"
      subtitle={planName ? `${planName} · elige los días de la semana` : 'Elige los días de la semana'}
      maxWidth="480px"
      footer={
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setSelected([])}
            className="flex-1 h-12 rounded-full bg-surface2 text-text-2 text-[14px] font-semibold border-none cursor-pointer active:opacity-70 transition-opacity"
          >
            Sin días
          </button>
          <button
            type="button"
            onClick={() => onSave([...selected].sort((a, b) => a - b))}
            disabled={saving}
            className="flex-1 h-12 rounded-full bg-accent text-accent-contrast text-[14px] font-bold border-none cursor-pointer active:opacity-70 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          >
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-4 gap-2">
        {DAY_LABELS.map((label, day) => {
          const active = selected.includes(day)
          return (
            <button
              key={label}
              type="button"
              aria-pressed={active}
              onClick={() => toggle(day)}
              className={`h-11 rounded-full text-[13px] font-semibold border-none cursor-pointer active:opacity-70 transition-colors ${
                active ? 'bg-accent text-accent-contrast' : 'bg-surface2 text-text-2'
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>

      <p className="text-[12px] text-text-3 leading-relaxed mt-4">
        La rutina aparecerá en <span className="text-text">Inicio</span> los días seleccionados.
        Si no programas ninguno, no se mostrará como rutina del día.
      </p>
    </BottomSheet>
  )
}
