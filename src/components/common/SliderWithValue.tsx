import React from 'react';

interface Props {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  label?: string;
  formatValue?: (v: number) => string;
  title?: string;
  className?: string;
}

export default function SliderWithValue({
  value, min, max, step = 1, onChange,
  label, formatValue, title, className = ''
}: Props) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {label && <span className="text-sm whitespace-nowrap">{label}</span>}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="flex-1 min-w-0"
        title={title}
      />
      {formatValue && (
        <span className="text-xs text-white/70 min-w-[3rem] text-right tabular-nums">
          {formatValue(value)}
        </span>
      )}
    </div>
  );
}
