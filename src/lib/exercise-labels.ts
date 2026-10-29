/** Etiquetas legibles del catálogo de ejercicios (mismas que usaba ExercisePicker). */

export const EQUIPMENT_ES: Record<string, string> = {
  barbell: 'Barra',
  dumbbell: 'Mancuerna',
  'body weight': 'Peso corporal',
  cable: 'Cable',
  band: 'Banda',
  kettlebell: 'Kettlebell',
  machine: 'Máquina',
  rope: 'Cuerda',
  'medicine ball': 'Balón medicinal',
  'ez barbell': 'Barra EZ',
  'leverage machine': 'Máquina palanca',
  'smith machine': 'Smith',
  'stability ball': 'Balón estabilidad',
  weighted: 'Con peso',
  'bodyweight': 'Peso corporal',
}

export const MUSCLE_ES: Record<string, string> = {
  Pecho: 'Pecho',
  Espalda: 'Espalda',
  Pierna: 'Pierna',
  Hombro: 'Hombro',
  Brazo: 'Brazo',
  Core: 'Core',
  Pantorrilla: 'Pantorrilla',
  Antebrazo: 'Antebrazo',
  Cardio: 'Cardio',
  Cuello: 'Cuello',
}

export function equipmentLabel(value: string): string {
  return EQUIPMENT_ES[value] || value
}

export function muscleLabel(value: string): string {
  return MUSCLE_ES[value] || value
}
