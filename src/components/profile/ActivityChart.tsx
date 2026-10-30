export interface ActivityPoint {
  label: string
  value: number
}

interface Props {
  data: ActivityPoint[]
}

/**
 * Gráfico de barras mínimo en SVG-free DOM (sin librerías).
 * Alturas en píxeles sobre una base fija para que el layout sea estable.
 */
export function ActivityChart({ data }: Props) {
  const max = Math.max(1, ...data.map(d => d.value))

  return (
    <div className="flex items-end gap-2 h-[132px]" role="img" aria-label="Actividad mensual">
      {data.map(point => {
        const height = point.value === 0 ? 4 : Math.max(8, Math.round((point.value / max) * 84))
        return (
          <div key={point.label} className="flex-1 h-full flex flex-col items-center justify-end gap-1.5 min-w-0">
            <span className="text-[10px] font-semibold text-text-2 leading-none">
              {point.value > 0 ? point.value : ''}
            </span>
            <div
              className={`w-full max-w-[32px] rounded-t-md transition-colors ${
                point.value > 0 ? 'bg-accent' : 'bg-surface2'
              }`}
              style={{ height }}
            />
            <span className="text-[10px] text-text-3 capitalize truncate max-w-full">{point.label}</span>
          </div>
        )
      })}
    </div>
  )
}
