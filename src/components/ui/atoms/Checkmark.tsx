interface Props {
  checked: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Marca de selección circular (solo presentacional).
 * Se coloca dentro de una fila/botón que maneja el clic.
 */
export function Checkmark({ checked, size = 'md', className = '' }: Props) {
  const dims = size === 'sm' ? 'w-5 h-5' : 'w-6 h-6'
  return (
    <span
      aria-hidden="true"
      className={`${dims} shrink-0 rounded-full flex items-center justify-center border-2 transition-colors ${
        checked
          ? 'bg-accent border-accent text-accent-contrast'
          : 'border-border2 text-transparent'
      } ${className}`}
    >
      <svg
        width={size === 'sm' ? 10 : 12}
        height={size === 'sm' ? 10 : 12}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </span>
  )
}
