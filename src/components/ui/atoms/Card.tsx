import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  rounded?: 'card' | 'tile';
  padded?: boolean;
}

/** Contenedor base: gris zinc-900, esquinas muy redondeadas, sin sombra ni borde. */
export function Card({ children, rounded = 'card', padded = true, className = '', ...props }: CardProps) {
  return (
    <div
      className={`bg-surface ${rounded === 'tile' ? 'rounded-tile' : 'rounded-card'} ${padded ? 'p-5' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
