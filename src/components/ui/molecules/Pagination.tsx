'use client';

interface PaginationProps {
  current: number;
  total: number;
  start: number;
  end: number;
  totalItems: number;
  label: string;
  onChange: (page: number) => void;
}

function getPageNumbers(current: number, total: number): (number | 'dots')[] {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | 'dots')[] = [1];
  if (current > 3) pages.push('dots');
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (current < total - 2) pages.push('dots');
  pages.push(total);
  return pages;
}

export function Pagination({
  current,
  total,
  start,
  end,
  totalItems,
  label,
  onChange,
}: PaginationProps) {
  if (total <= 1) return null;

  const pages = getPageNumbers(current, total);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4.5 py-3 border-t border-border bg-surface2 gap-2">
      <span className="text-xs text-text-3">
        Mostrando {start + 1}–{end} de {totalItems} {label}
      </span>
      <div className="flex gap-1 flex-wrap">
        {pages.map((p, i) =>
          p === 'dots' ? (
            <span key={`dots-${i}`} className="w-8 h-8 flex items-center justify-center text-xs text-text-3 select-none">...</span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p)}
              className={`min-w-[32px] h-8 rounded-full text-xs flex items-center justify-center cursor-pointer font-sans px-2
                ${p === current
                  ? 'bg-accent text-accent-contrast font-semibold'
                  : 'bg-transparent text-text-2 border border-border'
                }`}
            >
              {p}
            </button>
          )
        )}
      </div>
    </div>
  );
}
