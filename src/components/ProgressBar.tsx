'use client';

interface ProgressBarProps {
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  format?: (value: number) => string;
  step?: number;
  color?: string;
}

export default function ProgressBar({ 
  label, 
  min, 
  max, 
  value, 
  onChange, 
  format = (v) => v.toString(),
  step = 0.01,
  color = 'blue'
}: ProgressBarProps) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <span className="text-sm text-gray-600">{format(value)}</span>
      </div>
      
      <div className="relative">
        <div className="w-full h-6 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full bg-${color}-500 transition-all duration-200 ease-out rounded-full`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="absolute top-0 left-0 w-full h-6 opacity-0 cursor-pointer"
        />
      </div>
      
      <div className="flex justify-between text-xs text-gray-500">
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </div>
    </div>
  );
}