import { useState } from 'react';
import { FilterPreset } from '../lib/statistics';

interface PresetsPanelProps {
  presets: FilterPreset[];
  onApply: (preset: FilterPreset) => void;
  onDelete: (id: string) => void;
  onSaveCurrent: (name: string) => void;
}

export default function PresetsPanel({ presets, onApply, onDelete, onSaveCurrent }: PresetsPanelProps) {
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSaveCurrent(trimmed);
    setName('');
    setSaving(false);
  };

  return (
    <div className="presets-panel">
      <div className="presets-header">
        <h4>Filter Presets</h4>
        <button className="add-filter-btn" onClick={() => setSaving(s => !s)} title="Save current configuration as preset">+ Save</button>
      </div>

      {saving && (
        <div className="presets-save-form">
          <input
            className="presets-name-input"
            type="text"
            placeholder="Preset name…"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') { setSaving(false); setName(''); } }}
            autoFocus
          />
          <button className="presets-confirm-btn" onClick={handleSave} disabled={!name.trim()}>Save</button>
          <button className="presets-cancel-btn" onClick={() => { setSaving(false); setName(''); }}>✕</button>
        </div>
      )}

      {presets.length === 0 ? (
        <p className="presets-empty">No saved presets</p>
      ) : (
        <ul className="presets-list">
          {presets.map(preset => (
            <li key={preset.id} className="preset-item">
              <button className="preset-apply-btn" onClick={() => onApply(preset)} title="Apply preset">
                {preset.name}
              </button>
              <span className="preset-meta">
                {new Date(preset.createdAt).toLocaleDateString()}
              </span>
              <button className="preset-delete-btn" onClick={() => onDelete(preset.id)} title="Delete preset">✕</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
