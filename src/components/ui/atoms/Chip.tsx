interface ChipProps {
  value: string | number;
  label: string;
  accent?: boolean;
}

export function Chip({ value, label, accent }: ChipProps) {
  return (
    <div
      className={`flex flex-col items-center rounded-2xl px-3 py-1.5 min-w-[52px]
        ${accent
          ? 'bg-accent-dim border border-accent/25'
          : 'bg-surface2 border border-border'
        }`}
    >
      <span
        className={`text-sm font-semibold font-mono leading-none
          ${accent ? 'text-accent' : 'text-text'}`}
      >
        {value}
      </span>
      <span className="text-[9px] text-text-3 uppercase tracking-wider mt-1">
        {label}
      </span>
    </div>
  );
}
