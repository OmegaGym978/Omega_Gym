interface Segment {
  key: string
  label: string
}

interface Props {
  segments: Segment[]
  value: string
  onChange: (key: string) => void
  className?: string
}

/** Control de segmentos estilo iOS (track oscuro + segmento activo en acento). */
export function SegmentedControl({ segments, value, onChange, className = '' }: Props) {
  return (
    <div
      role="tablist"
      className={`flex w-full items-center gap-1 rounded-xl bg-surface p-1 ${className}`}
    >
      {segments.map(segment => {
        const active = value === segment.key
        return (
          <button
            key={segment.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(segment.key)}
            className={`flex-1 rounded-lg py-2 text-[13px] font-semibold border-none cursor-pointer active:opacity-70 transition-colors ${
              active
                ? 'bg-accent text-accent-contrast'
                : 'bg-transparent text-text-2'
            }`}
          >
            {segment.label}
          </button>
        )
      })}
    </div>
  )
}
