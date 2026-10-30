import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  className?: string
}

/** Contenedor de celdas agrupadas estilo iOS. */
export function ListGroup({ children, className = '' }: Props) {
  return (
    <div className={`bg-surface rounded-2xl overflow-hidden ${className}`}>
      {children}
    </div>
  )
}
