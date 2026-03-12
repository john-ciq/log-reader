import React from 'react';

interface SourceSelectorProps {
  sources: string[];
  selected: Set<string>;
  onChange: (source: string, checked: boolean) => void;
}

export default function SourceSelector({ sources, selected, onChange }: SourceSelectorProps) {
  return (
    <div className="source-selector">
      <h3>Sources</h3>
      {sources.length === 0 && <p className="empty-message">No sources detected yet</p>}
      {sources.map(source => (
        <label key={source} className="level-checkbox">
          <input
            type="checkbox"
            checked={selected.has(source)}
            onChange={e => onChange(source, e.target.checked)}
          />
          <span title={source}>{source}</span>
        </label>
      ))}
    </div>
  );
}
