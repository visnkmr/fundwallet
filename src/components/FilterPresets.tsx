'use client';

import { useState, useEffect } from 'react';
import { FundFilters } from '@/types/fund';

interface SavedPreset {
  name: string;
  filters: FundFilters;
}

interface FilterPresetsProps {
  filters: FundFilters;
  onFiltersChange: (filters: FundFilters) => void;
}

const PRESETS_KEY = 'fundwallet-filter-presets';

export default function FilterPresets({ filters, onFiltersChange }: FilterPresetsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [presets, setPresets] = useState<SavedPreset[]>([]);
  const [saving, setSaving] = useState(false);
  const [presetName, setPresetName] = useState('');

  useEffect(() => {
    try {
      const stored = localStorage.getItem(PRESETS_KEY);
      if (stored) setPresets(JSON.parse(stored));
    } catch {}
  }, []);

  function savePresets(toSave: SavedPreset[]) {
    setPresets(toSave);
    localStorage.setItem(PRESETS_KEY, JSON.stringify(toSave));
  }

  function handleSave() {
    const name = presetName.trim();
    if (!name) return;
    const updated = [...presets, { name, filters: JSON.parse(JSON.stringify(filters)) }];
    savePresets(updated);
    setPresetName('');
    setSaving(false);
  }

  function handleLoad(p: SavedPreset) {
    onFiltersChange(JSON.parse(JSON.stringify(p.filters)));
  }

  function handleDelete(index: number) {
    const updated = presets.filter((_, i) => i !== index);
    savePresets(updated);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') { setSaving(false); setPresetName(''); }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-left"
      >
        <h3 className="text-sm font-semibold text-gray-700">
          Saved Presets ({presets.length})
        </h3>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="mt-3 space-y-2">
          {presets.length === 0 && (
            <p className="text-xs text-gray-400">No saved presets yet.</p>
          )}
          {presets.map((p, i) => (
            <div key={i} className="flex items-center justify-between gap-2 py-1.5 px-2 bg-gray-50 rounded text-sm">
              <span className="text-gray-700 truncate flex-1">{p.name}</span>
              <button
                onClick={() => handleLoad(p)}
                className="px-2 py-0.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors shrink-0"
              >
                Load
              </button>
              <button
                onClick={() => handleDelete(i)}
                className="px-2 py-0.5 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors shrink-0"
              >
                Del
              </button>
            </div>
          ))}

          {saving ? (
            <div className="flex items-center gap-2 mt-2">
              <input
                autoFocus
                type="text"
                value={presetName}
                onChange={e => setPresetName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Preset name..."
                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
              />
              <button
                onClick={handleSave}
                disabled={!presetName.trim()}
                className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 transition-colors shrink-0"
              >
                Save
              </button>
              <button
                onClick={() => { setSaving(false); setPresetName(''); }}
                className="px-2 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors shrink-0"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setSaving(true)}
              className="mt-2 text-xs text-blue-600 hover:text-blue-800 transition-colors"
            >
              + Save current filters as preset
            </button>
          )}
        </div>
      )}
    </div>
  );
}
