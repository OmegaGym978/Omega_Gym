'use client';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /**
   * `pill` = campo redondeado sobre `surface2` (por defecto).
   * `inset` = campo cuadrado redondeado sobre `surface` (listas agrupadas).
   */
  variant?: 'pill' | 'inset';
  className?: string;
}

export function SearchInput({ value, onChange, placeholder = 'Buscar…', variant = 'pill', className = '' }: SearchInputProps) {
  const field = variant === 'inset'
    ? 'bg-surface text-text pl-10 pr-4 py-2 rounded-xl border-none outline-none placeholder:text-text-3 focus:ring-2 focus:ring-accent/30 transition-shadow'
    : 'bg-surface2 text-text pl-10 pr-4 py-3.5 rounded-full border-none outline-none placeholder:text-text-2 focus:ring-2 focus:ring-accent/30 transition-shadow';

  return (
    <div className={`relative ${className}`}>
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3 pointer-events-none">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full font-sans text-[15px] ${field}`}
      />
    </div>
  );
}
