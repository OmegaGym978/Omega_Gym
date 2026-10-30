import type { ReactNode } from 'react';

type BadgeVariant = 'green' | 'amber' | 'red' | 'accent' | 'gray' | 'teal' | 'purple' | 'pink';

interface BadgeProps {
  variant?: BadgeVariant;
  dot?: boolean;
  children: ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  green: 'bg-green-bg text-green-text',
  amber: 'bg-amber-bg text-amber-text',
  red: 'bg-red-bg text-red-text',
  accent: 'bg-accent-dim text-accent',
  gray: 'bg-surface2 text-text-3 border border-border',
  teal: 'bg-teal-bg text-teal-text',
  purple: 'bg-purple-bg text-purple-text',
  pink: 'bg-pink-bg text-pink-text',
};

const dotColors: Record<BadgeVariant, string> = {
  green: 'bg-green',
  amber: 'bg-amber',
  red: 'bg-red',
  accent: 'bg-accent',
  gray: 'bg-text-3',
  teal: 'bg-teal',
  purple: 'bg-purple',
  pink: 'bg-pink',
};

export function Badge({ variant = 'gray', dot, children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${variantStyles[variant]} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />}
      {children}
    </span>
  );
}
