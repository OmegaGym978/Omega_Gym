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
  columns: Column<T>[];
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

function hideClass(hide?: 'sm' | 'md' | 'lg') {
  if (hide === 'lg') return 'hidden lg:table-cell';
  if (hide === 'md') return 'hidden md:table-cell';
  if (hide === 'sm') return 'hidden sm:table-cell';
  return '';
}

function hideClassBlock(hide?: 'sm' | 'md' | 'lg') {
  return hide ? `lg:hidden` : '';
}

export function ResponsiveTable<T>({
  columns,
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
      <div className="flex flex-col items-center justify-center py-14 sm:py-16 text-text-3">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-text-4 mb-3"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
        <div className="text-[13px]">{emptyMessage}</div>
      </div>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden lg:block bg-surface  rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-border">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-[18px] py-[11px] text-left text-[10px] font-medium text-text-3 uppercase tracking-[0.07em] whitespace-nowrap bg-surface2 ${hideClass(col.hide)} ${col.headerClassName || ''}`}
                  style={{ textAlign: col.align || 'left' }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr
                key={keyExtractor(item)}
                onClick={() => onRowClick?.(item)}
                className={`border-l-2 border-transparent transition-colors duration-100 lg:hover:border-accent lg:hover:bg-surface2/50 ${onRowClick ? 'cursor-pointer' : ''}`}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-[18px] py-[14px] border-b border-border align-middle ${hideClass(col.hide)} ${col.className || ''}`}
                    style={{ textAlign: col.align || 'left' }}
                  >
                    {col.render(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="lg:hidden flex flex-col gap-2">
        {data.map((item) => (
          <div
            key={keyExtractor(item)}
            onClick={() => onRowClick?.(item)}
            className={`bg-surface  rounded-2xl px-4 py-4 transition-colors ${
              onRowClick ? 'cursor-pointer border-accent/30' : ''
            }`}
          >
            <div className="flex items-start gap-3 mb-3">
              {cardAvatar && (
                <div className="shrink-0">{cardAvatar(item)}</div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-semibold truncate">{cardTitle(item)}</div>
                <div className="text-[12px] text-text-3 truncate">{cardSubtitle(item)}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-[13px]">
              {cardFields.map((field, i) => {
                if (typeof field === 'object' && 'label' in field) {
                  return (
                    <div key={i} className={i % 2 === 0 ? '' : 'text-right'}>
                      <div className="text-[10px] text-text-3 uppercase tracking-[0.06em]">{field.label}</div>
                      <div className="mt-0.5">{field.value(item)}</div>
                    </div>
                  );
                }
                const col = columns.find(c => c.key === String(field));
                if (!col) return null;
                return (
                  <div key={col.key} className={i % 2 === 0 ? '' : 'text-right'}>
                    <div className="text-[10px] text-text-3 uppercase tracking-[0.06em]">{col.label}</div>
                    <div className="mt-0.5">{col.render(item)}</div>
                  </div>
                );
              })}
            </div>
            {cardActions && (
              <div className="mt-3 pt-3 border-t border-border">
                {cardActions(item)}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
