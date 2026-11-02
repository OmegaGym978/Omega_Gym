import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  /** Heredado: el ancho ya lo limita el shell de la app (560 / 720 px). */
  wide?: boolean
  className?: string
}

/**
 * Contenedor de página. El ancho máximo lo define el shell (`AppLayout`), así
 * que todas las vistas comparten la misma columna centrada en escritorio.
 */
export function PageContainer({ children, wide, className = '' }: Props) {
  const width = wide ? 'max-w-[560px] lg:max-w-[720px]' : 'max-w-[560px] lg:max-w-[720px]'
  return (
    <div className={`mx-auto w-full ${width} px-4 sm:px-5 py-4 ${className}`}>
      {children}
    </div>
  )
}
