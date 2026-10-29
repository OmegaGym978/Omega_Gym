'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'plain' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  children: ReactNode;
}

const variantStyles: Record<Variant, string> = {
  primary: 'bg-accent text-accent-contrast border border-transparent',
  secondary: 'bg-surface2 text-text border border-transparent',
  ghost: 'bg-surface2 text-text-2 border border-transparent',
  plain: 'bg-transparent text-accent border border-transparent px-2',
  danger: 'bg-red-bg text-red-text border border-transparent',
};

const radiusStyles: Record<Variant, string> = {
  primary: 'rounded-full',
  secondary: 'rounded-xl',
  ghost: 'rounded-xl',
  plain: 'rounded-lg',
  danger: 'rounded-xl',
};

const sizeStyles: Record<Size, string> = {
  sm: 'h-10 px-4 text-[13px]',
  md: 'h-12 px-5 text-[15px]',
  lg: 'h-14 px-6 text-[16px]',
};

export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const plain = variant === 'plain'
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 font-semibold
        transition-opacity duration-150 cursor-pointer font-sans select-none
        active:opacity-70
        ${variantStyles[variant]}
        ${radiusStyles[variant]}
        ${plain ? 'h-10 text-[14px]' : sizeStyles[size]}
        ${disabled ? 'opacity-40 cursor-not-allowed active:opacity-40' : ''}
        ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </button>
  );
}
