'use client';

interface Tab {
  key: string;
  label: string;
}

interface TabBarProps {
  tabs: Tab[];
  active: string;
  onChange: (key: string) => void;
}

export function TabBar({ tabs, active, onChange }: TabBarProps) {
  return (
    <div className="flex gap-1.5 overflow-x-auto">
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
