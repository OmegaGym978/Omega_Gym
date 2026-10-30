'use client';

import type { InputHTMLAttributes, ReactNode } from 'react';

const fieldBase =
  'w-full bg-surface border-none text-text font-sans text-[17px] ' +
  'px-4 py-4 rounded-2xl outline-none transition-shadow duration-150 ' +
  'placeholder:text-text-3 focus:ring-2 focus:ring-accent/40';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: ReactNode;
  error?: string;
}

export function Input({ label, icon, error, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[12px] font-medium text-text-3 px-1">{label}</label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-3 pointer-events-none">
            {icon}
          </span>
        )}
        <input
          className={`${fieldBase}
            ${icon ? 'pl-12' : ''}
            ${error ? 'ring-2 ring-red/50' : ''}
            ${className}`}
          {...props}
        />
      </div>
      {error && <span className="text-xs text-red-text px-1">{error}</span>}
    </div>
  );
}

interface SelectProps extends InputHTMLAttributes<HTMLSelectElement> {
  label?: string;
  children: ReactNode;
}

export function Select({ label, children, className = '', ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[12px] font-medium text-text-3 px-1">{label}</label>
      )}
      <select
        className={`${fieldBase} cursor-pointer appearance-none ${className}`}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}

interface TextareaProps extends InputHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export function Textarea({ label, className = '', ...props }: TextareaProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[12px] font-medium text-text-3 px-1">{label}</label>
      )}
      <textarea
        className={`${fieldBase} resize-y min-h-[120px] ${className}`}
        {...props}
      />
    </div>
  );
}
