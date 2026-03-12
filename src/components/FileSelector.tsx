import React from 'react';

interface FileSelectorProps {
  files: string[];
  selected: Set<string>;
  onChange: (file: string, checked: boolean) => void;
  parsers?: Record<string, string>;
}

export default function FileSelector({ files, selected, onChange, parsers = {} }: FileSelectorProps) {
  return (
    <div className="file-selector">
      <h3>Log Files</h3>
      {files.length === 0 && <p className="empty-message">No files loaded yet</p>}
      {files.map(file => (
        <label key={file} className="file-checkbox">
          <input
            type="checkbox"
            checked={selected.has(file)}
            onChange={e => onChange(file, e.target.checked)}
          />
          <span className="file-checkbox-label">
            <span title={file}>{file}</span>
            <span className="parser-name">{parsers[file] ?? 'no parser found'}</span>
          </span>
        </label>
      ))}
    </div>
  );
}
