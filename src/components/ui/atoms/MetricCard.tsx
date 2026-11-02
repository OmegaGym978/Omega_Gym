import type { CSSProperties, ReactNode } from 'react';

interface MetricCardProps {
  icon?: ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color?: 'green' | 'amber' | 'red' | 'accent' | 'teal' | 'gray';
  /** Deja el monto en blanco y conserva el color sólo en el icono. */
  neutralValue?: boolean;
  children?: ReactNode;
  className?: string;
}

const colorMap: Record<string, { bar: string; bg: string; text: string; value: string; glow: string }> = {
  green: { bar: 'bg-green', bg: 'bg-green-bg', text: 'text-green-text', value: 'text-green-text', glow: 'rgba(34,197,94,0.15)' },
  amber: { bar: 'bg-amber', bg: 'bg-amber-bg', text: 'text-amber-text', value: 'text-amber-text', glow: 'rgba(245,158,11,0.15)' },
  red: { bar: 'bg-red', bg: 'bg-red-bg', text: 'text-red-text', value: 'text-red-text', glow: 'rgba(239,68,68,0.15)' },
  accent: { bar: 'bg-accent', bg: 'bg-accent-dim', text: 'text-accent', value: 'text-accent', glow: 'rgba(var(--accent-rgb),0.15)' },
  teal: { bar: 'bg-teal', bg: 'bg-teal-bg', text: 'text-teal-text', value: 'text-teal-text', glow: 'rgba(45,212,191,0.15)' },
  gray: { bar: 'bg-surface3', bg: 'bg-gray-bg', text: 'text-gray-text', value: 'text-text-2', glow: 'rgba(255,255,255,0.05)' },
};

export function MetricCard({
  icon,
  label,
  value,
  sub,
  color = 'accent',
  neutralValue = false,
  children,
  className = '',
}: MetricCardProps) {
  const c = colorMap[color] || colorMap.accent;
  const valueTone = neutralValue ? 'text-text' : c.value;

  return (
    <div
      className={`metric-card-hover relative bg-surface rounded-[24px] overflow-hidden p-5 shrink-0 min-w-[140px] sm:min-w-0 ${className}`}
      style={{ '--glow-color': c.glow } as CSSProperties}
    >
      <div className={`absolute top-0 left-0 right-0 h-1 ${c.bar} opacity-80`} />
      {icon && (
        <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${c.bg} ${c.text}`}>
          <div className="w-[18px] h-[18px]">{icon}</div>
        </div>
      )}
      {children ? (
        children
      ) : (
        <div className={`text-[26px] font-semibold leading-none tracking-tight font-mono ${valueTone}`}>
          {value}
        </div>
      )}
      <div className="text-[11px] text-text-3 mt-1.5">{label}</div>
      {sub && (
        <div className="text-[10px] text-text-3 mt-2">{sub}</div>
      )}
    </div>
  );
}
