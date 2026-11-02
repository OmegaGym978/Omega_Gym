import type { InputHTMLAttributes } from 'react'
import { IconLock } from '@/lib/icons'

interface Props {
  label: string
  /** Valor editable. */
  value: string
  /** Texto que se muestra cuando el campo está bloqueado (por defecto `value`). */
  displayValue?: string
  /**
   * Sin `onChange` el campo se renderiza bloqueado: `disabled` + `readOnly`,
   * texto atenuado, cursor `not-allowed` y candado al lado. La fila mantiene la
   * misma forma para que se lea como «esto existe, pero lo gestiona el miembro».
   */
  onChange?: (value: string) => void
  disabled?: boolean
}

/**
 * Fila «label + valor» del grupo inset. Editable cuando recibe `onChange`;
 * bloqueada (con candado) cuando no.
 */
export function ProfileField({
  label,
  value,
  displayValue,
  onChange,
  disabled = false,
  type = 'text',
  placeholder,
  inputMode,
  autoComplete,
}: Props & Pick<InputHTMLAttributes<HTMLInputElement>, 'type' | 'placeholder' | 'inputMode' | 'autoComplete'>) {
  const locked = !onChange

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className={`shrink-0 text-[12px] ${locked ? 'text-text-3/70' : 'text-text-3'}`}>{label}</span>

      {locked ? (
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <input
            type={type}
            value={displayValue || value || ''}
            readOnly
            disabled
            tabIndex={-1}
            aria-disabled="true"
            aria-label={label}
            className="min-w-0 flex-1 cursor-not-allowed rounded-xl border border-transparent bg-surface3/40 px-3 py-2 text-right font-sans text-[13px] text-text-3 opacity-60 outline-none"
          />
          <IconLock width="12" height="12" className="shrink-0 text-text-3 opacity-60" aria-hidden="true" />
        </div>
      ) : (
        <input
          type={type}
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          inputMode={inputMode}
          autoComplete={autoComplete}
          aria-label={label}
          className="min-w-0 flex-1 rounded-xl border border-border2 bg-surface2 px-3 py-2 text-right font-sans text-[13px] text-text outline-none transition-colors placeholder:text-text-3/40 focus:border-accent/40 focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:opacity-60"
        />
      )}
    </div>
  )
}
