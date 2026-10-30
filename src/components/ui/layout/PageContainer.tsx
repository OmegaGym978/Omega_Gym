import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  /** true para vistas de staff (hasta 1100px); false para vistas tipo app (560px). */
  wide?: boolean
  className?: string
}

export function PageContainer({ children, wide, className = '' }: Props) {
  return (
    <div
      className={`mx-auto w-full ${wide ? 'max-w-[1100px]' : 'max-w-[560px]'} px-4 sm:px-5 py-4 ${className}`}
    >
      {children}
    </div>
  )
}
