/**
 * Contenido de la landing pública de Omega Gym.
 * Los datos de contacto y la dirección son genéricos: reemplázalos por los reales.
 */

export type WeeklyHours = {
  /** 0 = domingo … 6 = sábado */
  day: number
  /** Horas en formato 24 h, hora local del gimnasio */
  opens: string
  closes: string
}

export const GYM = {
  name: 'Omega Gym',
  slogan: 'La constancia se entrena. Aquí cada serie cuenta y cada semana se nota.',
  address: 'Av. Constitución 1234, Col. Centro, Guadalajara, Jal.',
  /** Búsqueda para el mapa: sin referencias que confundan al buscador. */
  mapQuery: 'Av. Constitución 1234, Centro, Guadalajara, Jalisco',
  phoneDisplay: '33 1234 5678',
  /** Lada internacional + número, solo dígitos (WhatsApp y llamadas). */
  phoneE164: '523312345678',
  email: 'hola@omegagym.mx',
  timeZone: 'America/Mexico_City',
  hours: [
    { day: 1, opens: '06:00', closes: '22:00' },
    { day: 2, opens: '06:00', closes: '22:00' },
    { day: 3, opens: '06:00', closes: '22:00' },
    { day: 4, opens: '06:00', closes: '22:00' },
    { day: 5, opens: '06:00', closes: '22:00' },
    { day: 6, opens: '08:00', closes: '14:00' },
  ] satisfies WeeklyHours[],
  hoursSummary: ['Lunes a viernes, 6:00 a 22:00', 'Sábados, 8:00 a 14:00', 'Domingos, cerrado'],
}

/** Bloques de "info rápida" dentro de la ficha del gimnasio. */
export const FACTS: { label: string; value: string | string[] }[] = [
  { label: 'Enfoque', value: 'Fuerza, Cardio y Acondicionamiento' },
  { label: 'Equipo', value: 'Aparatos de última generación y peso libre' },
  { label: 'Modalidad', value: 'Entrenamiento libre o con rutinas personalizadas' },
  { label: 'Horario', value: ['Lunes a Viernes: 6:00 a 22:00', 'Sábados: 8:00 a 14:00'] },
  { label: 'Acceso', value: 'Control total desde tu cuenta en la app' },
]

export const MEMBERSHIPS = [
  {
    name: 'Visita (Día)',
    description: 'Para quienes están de paso o quieren probar el equipo.',
    tag: 'Pase diario',
  },
  {
    name: 'Membresía Mensual',
    description: 'Acceso ilimitado a todas las instalaciones.',
    tag: 'Acceso total',
  },
  {
    name: 'Planes de Entrenamiento',
    description: 'Rutinas asignadas (Glute Focus, StrongLifts, etc.) según tus objetivos.',
    tag: 'Con entrenador',
  },
]

export const FAQ = [
  {
    question: '¿Cómo adquiero o renuevo mi membresía?',
    answer:
      'Desde tu cuenta: elige el tipo de membresía, registra el pago y tu acceso queda activo. Cuando esté por vencer, la renuevas en Mi membresía; si solo vienes de paso, puedes comprar una Visita del día.',
  },
  {
    question: '¿Cuentan con entrenadores para rutinas personalizadas?',
    answer:
      'Sí. Los entrenadores arman y asignan rutinas según tus objetivos, y las actualizan al cambiar de ciclo. Consultas series, repeticiones y descansos desde Mi plan en la app.',
  },
  {
    question: '¿Cuáles son las reglas y código de vestimenta?',
    answer:
      'Calzado deportivo cerrado y ropa cómoda; trae toalla y botella reutilizable. Limpia los aparatos al terminar, regresa el peso libre a su lugar y respeta el turno de las máquinas.',
  },
]
