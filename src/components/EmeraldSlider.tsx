import React from 'react';

interface EmeraldSliderProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  decimals?: number;
  onChange: (value: number) => void;
  subLabel?: string;
}

export const EmeraldSlider: React.FC<EmeraldSliderProps> = ({
  id,
  label,
  value,
  min,
  max,
  step,
  unit,
  decimals = 2,
  onChange,
  subLabel,
}) => {
  const clamped = Math.min(max, Math.max(min, value));
  const pct = max > min ? ((clamped - min) / (max - min)) * 100 : 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-[13px] font-semibold text-slate-900 leading-snug">
          {label}
        </label>
        <span className="font-mono text-[13px] font-bold text-emerald-700 tabular-nums whitespace-nowrap shrink-0">
          {clamped.toFixed(decimals)} <span className="text-slate-600 font-medium">{unit}</span>
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={clamped}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="emerald-slider w-full block"
        style={{
          background: `linear-gradient(to right, #059669 0%, #059669 ${pct}%, #d1fae5 ${pct}%, #d1fae5 100%)`,
        }}
      />
      {subLabel && <p className="text-[11px] text-slate-500 leading-tight">{subLabel}</p>}
    </div>
  );
};
