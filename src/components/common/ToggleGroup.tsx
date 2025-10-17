import React from 'react';

export interface ToggleOption {
  id: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  title?: string;
}

interface Props {
  options: ToggleOption[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}

export default function ToggleGroup({ options, value, onChange, className = '' }: Props) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {options.map(opt => (
        <button
          key={opt.id}
          disabled={opt.disabled}
          className={`px-3 py-1.5 rounded-lg border text-sm ${
            value === opt.id
              ? 'border-white/50 bg-white/10'
              : opt.disabled
                ? 'border-white/10 text-white/40 opacity-50 cursor-not-allowed'
                : 'border-white/15 text-white/80 hover:border-white/30'
          }`}
          onClick={() => !opt.disabled && onChange(opt.id)}
          title={opt.title || opt.label}
        >
          {opt.icon || opt.label}
        </button>
      ))}
    </div>
  );
}
