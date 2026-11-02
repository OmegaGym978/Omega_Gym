import type { ReactNode } from 'react';

export interface Column<T> {
  key: string;
  label: string;
  render: (item: T) => ReactNode;
  hide?: 'sm' | 'md' | 'lg';
  align?: 'left' | 'right' | 'center';
  className?: string;
  headerClassName?: string;
}

interface ResponsiveTableProps<T> {
  /** Heredado: las vistas usan el listado agrupado, no la tabla. */
  columns?: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  cardTitle: (item: T) => string;
  cardSubtitle: (item: T) => string;
  cardAvatar?: (item: T) => ReactNode;
  cardFields: (keyof T | { label: string; value: (item: T) => ReactNode })[];
  cardActions?: (item: T) => ReactNode;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
}

/**
 * Listado agrupado estilo iOS: una sola tarjeta con filas nativas.
 * Los dos primeros campos son visibles en móvil; el resto aparece desde `md`.
 */
export function ResponsiveTable<T>({
  data,
  keyExtractor,
  cardTitle,
  cardSubtitle,
  cardAvatar,
  cardFields,
  cardActions,
  emptyMessage = 'Sin datos',
  onRowClick,
}: ResponsiveTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="bg-surface rounded-[32px] px-5 py-14 flex flex-col items-center justify-center text-text-3">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-text-4 mb-3"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
        <div className="text-[13px]">{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-[32px] overflow-hidden">
      {data.map((item) => (
        <div
          key={keyExtractor(item)}
          onClick={() => onRowClick?.(item)}
          className={`flex items-start gap-3 px-5 py-4 border-b border-divider last:border-b-0 transition-opacity ${
            onRowClick ? 'cursor-pointer active:opacity-70' : ''
          }`}
        >
          {cardAvatar && <div className="shrink-0">{cardAvatar(item)}</div>}

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[14px] font-semibold text-text truncate">{cardTitle(item)}</div>
                <div className="text-[12px] text-text-2 truncate mt-0.5">{cardSubtitle(item)}</div>
              </div>
              {cardActions && <div className="shrink-0">{cardActions(item)}</div>}
            </div>

            {cardFields.length > 0 && (
              <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1.5">
                {cardFields.map((field, i) => {
                  const hidden = i >= 2 ? 'hidden md:inline-flex' : 'inline-flex';
                  if (typeof field === 'object' && 'label' in field) {
                    return (
                      <div key={i} className={`${hidden} items-baseline gap-1.5`}>
                        <span className="text-[10px] uppercase tracking-[0.06em] text-text-3">{field.label}</span>
                        <span className="text-[12px] text-text-2">{field.value(item)}</span>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
