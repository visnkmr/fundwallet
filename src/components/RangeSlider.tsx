'use client';

import { useState } from 'react';

interface RangeSliderProps {
  label: string;
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  format?: (value: number) => string;
  step?: number;
}

export default function RangeSlider({ 
  label, 
  min, 
  max, 
  value, 
  onChange, 
  format = (v) => v.toString(),
  step = 0.01 
}: RangeSliderProps) {
  const [localValue, setLocalValue] = useState<[number, number]>(value);

  const handleChange = (index: number, newValue: number) => {
    const newRange: [number, number] = [...localValue];
    newRange[index] = newValue;
    
    // Ensure min <= max
    if (index === 0 && newValue > newRange[1]) {
      newRange[1] = newValue;
    } else if (index === 1 && newValue < newRange[0]) {
      newRange[0] = newValue;
    }
    
    setLocalValue(newRange);
    onChange(newRange);
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <div className="text-sm text-gray-600">
          {format(localValue[0])} - {format(localValue[1])}
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center space-x-3">
          <span className="text-xs text-gray-500 w-12">Min</span>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={localValue[0]}
            onChange={(e) => handleChange(0, parseFloat(e.target.value))}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-xs text-gray-600 w-16 text-right">{format(localValue[0])}</span>
        </div>
        
        <div className="flex items-center space-x-3">
          <span className="text-xs text-gray-500 w-12">Max</span>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={localValue[1]}
            onChange={(e) => handleChange(1, parseFloat(e.target.value))}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-xs text-gray-600 w-16 text-right">{format(localValue[1])}</span>
        </div>
      </div>
      
      {/* Visual range bar */}
      <div className="relative h-2 bg-gray-200 rounded-full">
        <div 
          className="absolute h-2 bg-blue-500 rounded-full"
          style={{
            left: `${((localValue[0] - min) / (max - min)) * 100}%`,
            width: `${((localValue[1] - localValue[0]) / (max - min)) * 100}%`
          }}
        />
      </div>
    </div>
  );
}