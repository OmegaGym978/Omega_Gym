import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { exercisesService, type Exercise } from '@/services/exercises.service'
import { equipmentLabel } from '@/lib/exercise-labels'
import { BottomSheet } from '@/components/ui/molecules/BottomSheet'
import { Input, Select, Textarea } from '@/components/ui/atoms/Input'

interface Props {
  open: boolean
  onClose: () => void
  userId: string
  onCreated: (exercise: Exercise) => void
}

/** Formulario de ejercicio personal (solo visible para su dueño). */
export function CreateExerciseSheet({ open, onClose, userId, onCreated }: Props) {
  const [name, setName] = useState('')
  const [muscle, setMuscle] = useState('')
  const [equipment, setEquipment] = useState('')
  const [gifUrl, setGifUrl] = useState('')
  const [instructions, setInstructions] = useState('')
  const [saving, setSaving] = useState(false)
  const [tried, setTried] = useState(false)

  const [muscleOptions, setMuscleOptions] = useState<string[]>([])
  const [equipmentOptions, setEquipmentOptions] = useState<string[]>([])

  useEffect(() => {
    if (!open) return
    setName('')
    setMuscle('')
    setEquipment('')
    setGifUrl('')
    setInstructions('')
    setSaving(false)
    setTried(false)

    Promise.all([exercisesService.getMuscleGroups(), exercisesService.getEquipment()])
      .then(([muscles, equipments]) => {
        setMuscleOptions(muscles)
        setEquipmentOptions(equipments)
        setMuscle(current => current || muscles[0] || '')
        setEquipment(current => current || equipments[0] || '')
      })
      .catch(() => { /* el formulario sigue operativo con texto libre */ })
  }, [open])

  const valid = !!name.trim() && !!muscle && !!equipment

  async function save() {
    if (!valid) {
      setTried(true)
      return
    }
    setSaving(true)
    try {
      const exercise = await exercisesService.createCustom({
        name,
        muscle_group: muscle,
        equipment,
        gif_url: gifUrl || null,
        instructions_es: instructions || null,
        created_by: userId,
      })
      toast.success('Ejercicio creado')
      onCreated(exercise)
      onClose()
    } catch (e: any) {
      toast.error('No se pudo crear el ejercicio: ' + (e?.message || 'intenta de nuevo'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Nuevo ejercicio"
      subtitle="Se guarda en tu catálogo personal"
      maxWidth="480px"
      footer={
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-12 rounded-full bg-surface2 text-text-2 text-[14px] font-semibold border-none cursor-pointer active:opacity-70 transition-opacity"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="flex-1 h-12 rounded-full bg-accent text-accent-contrast text-[14px] font-bold border-none cursor-pointer active:opacity-70 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          >
            {saving ? 'Guardando…' : 'Crear'}
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <Input
          label="Nombre *"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Ej. Curl martillo con banda"
          autoFocus
        />
        {tried && !name.trim() && <span className="-mt-3 text-[11px] text-red-text px-1">El nombre es obligatorio</span>}

        <Select label="Grupo muscular *" value={muscle} onChange={e => setMuscle(e.target.value)}>
          {muscleOptions.length === 0 && <option value="">Sin opciones</option>}
          {muscleOptions.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </Select>

        <Select label="Equipamiento *" value={equipment} onChange={e => setEquipment(e.target.value)}>
          {equipmentOptions.length === 0 && <option value="">Sin opciones</option>}
          {equipmentOptions.map(option => (
            <option key={option} value={option}>{equipmentLabel(option)}</option>
          ))}
        </Select>

        <Input
          label="GIF o imagen (opcional)"
          value={gifUrl}
          onChange={e => setGifUrl(e.target.value)}
          placeholder="https://.../ejercicio.gif"
        />

        <Textarea
          label="Indicaciones (opcional)"
          value={instructions}
          onChange={e => setInstructions(e.target.value)}
          placeholder="Técnica, postura, errores comunes..."
        />
      </div>
    </BottomSheet>
  )
}
