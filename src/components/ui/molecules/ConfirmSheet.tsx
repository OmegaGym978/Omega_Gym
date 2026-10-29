import { BottomSheet } from './BottomSheet'

interface Props {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => void
  onClose: () => void
}

/** Confirmación en hoja inferior con acciones apiladas. */
export function ConfirmSheet({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  danger,
  onConfirm,
  onClose,
}: Props) {
  return (
    <BottomSheet open={open} onClose={onClose} title={title} maxWidth="480px">
      {description && (
        <p className="text-[14px] leading-relaxed text-text-3">{description}</p>
      )}

      <div className="mt-5 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => { onConfirm(); onClose() }}
          className={`h-12 w-full rounded-full text-[15px] font-bold border-none cursor-pointer active:opacity-70 transition-opacity ${
            danger ? 'bg-red-bg text-red-text' : 'bg-accent text-accent-contrast'
          }`}
        >
          {confirmLabel}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="h-12 w-full rounded-full bg-surface2 text-text font-semibold text-[15px] border-none cursor-pointer active:opacity-70 transition-opacity"
        >
          {cancelLabel}
        </button>
      </div>
    </BottomSheet>
  )
}
