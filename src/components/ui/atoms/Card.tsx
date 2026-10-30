import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  rounded?: '2xl' | '3xl';
  padded?: boolean;
}

/** Contenedor base: gris zinc-900, esquinas muy redondeadas, sin sombra ni borde. */
export function Card({ children, rounded = '2xl', padded = true, className = '', ...props }: CardProps) {
  return (
    <div
      className={`bg-surface ${rounded === '3xl' ? 'rounded-3xl' : 'rounded-2xl'} ${padded ? 'p-4' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
