import { useState } from 'react';
import { storage } from '../lib/local-storage';

interface FileSelectorProps {
  files: string[];
  selected: Set<string>;
  onChange: (file: string, checked: boolean) => void;
  onRemove?: (file: string) => void;
  onOpenRaw?: (file: string) => void;
  parsers?: Record<string, string>;
  counts?: Record<string, number>;
}

export default function FileSelector({ files, selected, onChange, onRemove, onOpenRaw, parsers = {}, counts = {} }: FileSelectorProps) {
  const [collapsed, setCollapsed] = useState(() => storage.loadPanelCollapsed('files'));

  return (
    <div className={`file-selector${!collapsed ? ' selector--has-content' : ''}`}>
      <h3 className="collapsible-heading" onClick={() => setCollapsed(c => { storage.savePanelCollapsed('files', !c); return !c; })}>
        <span className="collapse-arrow">{collapsed ? '▶' : '▼'}</span>
        Log Files
        {files.length > 0 && (
          <span className="heading-actions">
            <span className="heading-count">{files.filter(f => selected.has(f)).length}/{files.length}</span>
            <button className="config-action-btn" onClick={e => { e.stopPropagation(); files.forEach(f => onChange(f, true)); }}>All</button>
            <button className="config-action-btn" onClick={e => { e.stopPropagation(); files.forEach(f => onChange(f, false)); }}>None</button>
          </span>
        )}
      </h3>
      {!collapsed && files.length === 0 && <p className="empty-message no-padding">No files loaded yet</p>}
      {!collapsed && files.map(file => (
        <div key={file} className="file-row">
          <label className="file-checkbox">
            <input
              type="checkbox"
              checked={selected.has(file)}
              onChange={e => onChange(file, e.target.checked)}
            />
            <span className="file-checkbox-label">
              <span title={file}>{file}</span>
              {counts[file] != null && (
                <span className="parser-name">{counts[file].toLocaleString()} entries</span>
              )}
              <span className={`parser-name${parsers[file] ? '' : ' parser-name--missing'}`}>
                {parsers[file] ?? 'No parser found'}
              </span>
            </span>
          </label>
          {onOpenRaw && (
            <button
              className="file-open-btn"
              onClick={() => onOpenRaw(file)}
              title={`View raw content of ${file}`}
              aria-label={`Open raw view of ${file}`}
            >
              ↗
            </button>
          )}
          {onRemove && (
            <button
              className="file-remove-btn"
              onClick={() => onRemove(file)}
              title={`Remove ${file}`}
              aria-label={`Remove ${file}`}
            >
              ×
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
