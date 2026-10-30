interface Props {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

/** Interruptor nativo. Activo en el acento del proyecto. */
export function Switch({ checked, onChange, label, disabled, className = '' }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative w-[46px] h-[26px] shrink-0 rounded-full transition-colors duration-200 border-none cursor-pointer active:opacity-70 disabled:opacity-40 disabled:cursor-not-allowed ${
        checked ? 'bg-accent' : 'bg-surface3'
      } ${className}`}
    >
      <span
        aria-hidden="true"
        className={`absolute top-[3px] w-[20px] h-[20px] rounded-full bg-white transition-transform duration-200 ${
          checked ? 'translate-x-[23px]' : 'translate-x-[3px]'
        }`}
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.35)' }}
      />
    </button>
  );
}
