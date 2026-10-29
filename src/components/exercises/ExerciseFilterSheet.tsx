import { BottomSheet } from '@/components/ui/molecules/BottomSheet'
import { equipmentLabel, muscleLabel } from '@/lib/exercise-labels'

interface Props {
  open: boolean
  mode: 'equipment' | 'muscle'
  value: string
  options: string[]
  onClose: () => void
  onSelect: (value: string) => void
}

/** Selector de filtro del catálogo (equipamiento o músculo). */
export function ExerciseFilterSheet({ open, mode, value, options, onClose, onSelect }: Props) {
  const isEquipment = mode === 'equipment'
  const allLabel = isEquipment ? 'Todo el Equipamiento' : 'Todos los Músculos'
  const label = (option: string) => (isEquipment ? equipmentLabel(option) : muscleLabel(option))

  function choose(option: string) {
    onSelect(option)
    onClose()
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={isEquipment ? 'Equipamiento' : 'Grupo muscular'}
      subtitle={isEquipment ? 'Filtra el catálogo por equipo disponible' : 'Filtra el catálogo por músculo principal'}
    >
      <div className="-mx-2 flex flex-col">
        <FilterRow label={allLabel} active={!value} onClick={() => choose('')} />
        {options.map(option => (
          <FilterRow
            key={option}
            label={label(option)}
            active={value === option}
            onClick={() => choose(option)}
          />
        ))}
      </div>
    </BottomSheet>
  )
}

function FilterRow({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center justify-between gap-3 px-3 py-3 rounded-xl text-left text-[14px] border-none cursor-pointer active:opacity-70 transition-colors ${
        active ? 'bg-accent-dim text-accent font-semibold' : 'text-text-2 bg-transparent'
      }`}
    >
      {label}
      {active && (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
    </button>
  )
}
