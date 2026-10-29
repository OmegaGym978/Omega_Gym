'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  danger?: boolean;
  title: string;
}

export function IconButton({ children, danger, title, className = '', ...props }: IconButtonProps) {
  return (
    <button
      title={title}
      className={`w-10 h-10 sm:w-8 sm:h-8 [&>svg]:w-[18px] [&>svg]:h-[18px] sm:[&>svg]:w-[14px] sm:[&>svg]:h-[14px] rounded-full bg-surface2
        ${danger ? 'text-red-text' : 'text-text-2'}
        flex items-center justify-center cursor-pointer active:opacity-70 transition-opacity
        ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
