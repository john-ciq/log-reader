import { useState, useRef } from 'react';
import { FilterPreset } from '../lib/statistics';

interface PresetsPanelProps {
  presets: FilterPreset[];
  onApply: (preset: FilterPreset) => void;
  onDelete: (id: string) => void;
  onSaveCurrent: (name: string) => void;
  onUpdate: (id: string) => void;
  onImport: (presets: FilterPreset[]) => void;
}

export default function PresetsPanel({ presets, onApply, onDelete, onSaveCurrent, onUpdate, onImport }: PresetsPanelProps) {
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const importInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(presets, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'log-reader-presets.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string) as FilterPreset[];
        if (!Array.isArray(data)) throw new Error('Not an array');
        onImport(data);
      } catch {
        alert('Failed to import presets: invalid file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

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
        <h4>📁 Filter Presets</h4>
        <div className="filter-config-actions">
          <input ref={importInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImportFile} />
          <button className="config-action-btn" onClick={handleExport}>⬇ Export</button>
          <button className="config-action-btn" onClick={() => importInputRef.current?.click()}>⬆ Import</button>
          <button className="config-action-btn" onClick={() => setSaving(s => !s)} title="Save current configuration as preset">Save</button>
        </div>
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
          <button className="config-action-btn" onClick={handleSave} disabled={!name.trim()}>Save</button>
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
              <button className="config-action-btn" onClick={() => onUpdate(preset.id)} title="Overwrite preset with current filters">Update</button>
              <button className="preset-delete-btn" onClick={() => onDelete(preset.id)} title="Delete preset">✕</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
