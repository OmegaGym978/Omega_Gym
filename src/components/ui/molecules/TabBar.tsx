'use client';

interface Tab {
  key: string;
  label: string;
}

interface TabBarProps {
  tabs: Tab[];
  active: string;
  onChange: (key: string) => void;
  /** Por defecto la propia barra hace scroll horizontal. */
  className?: string;
}

export function TabBar({ tabs, active, onChange, className = 'overflow-x-auto' }: TabBarProps) {
  return (
    // `scrollbar-none` evita la barra de scroll horizontal nativa (la línea gris
    // que aparecía bajo las píldoras de filtro).
    <div className={`flex gap-1.5 scrollbar-none ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`px-4 py-2 rounded-full text-[12px] font-semibold whitespace-nowrap cursor-pointer font-sans transition-opacity active:opacity-70
            ${active === tab.key
              ? 'bg-accent text-accent-contrast'
              : 'bg-surface2 text-text-2'
            }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
