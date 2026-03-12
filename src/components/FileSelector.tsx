
interface FileSelectorProps {
  files: string[];
  selected: Set<string>;
  onChange: (file: string, checked: boolean) => void;
  onRemove?: (file: string) => void;
  parsers?: Record<string, string>;
  counts?: Record<string, number>;
}

export default function FileSelector({ files, selected, onChange, onRemove, parsers = {}, counts = {} }: FileSelectorProps) {
  return (
    <div className="file-selector">
      <h3>Log Files</h3>
      {files.length === 0 && <p className="empty-message">No files loaded yet</p>}
      {files.map(file => (
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
              <span className="parser-name">{parsers[file] ?? 'no parser found'}</span>
            </span>
          </label>
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
