import React from 'react';

interface LevelSelectorProps {
  levels: string[];
  selected: Set<string>;
  onChange: (level: string, checked: boolean) => void;
}

export default function LevelSelector({ levels, selected, onChange }: LevelSelectorProps) {
  return (
    <div className="level-selector">
      <h3>Log Levels</h3>
      {levels.length === 0 && <p className="empty-message">No levels detected yet</p>}
      {levels.map(level => (
        <label key={level} className="level-checkbox">
          <input
            type="checkbox"
            checked={selected.has(level)}
            onChange={e => onChange(level, e.target.checked)}
          />
          {level}
        </label>
      ))}
    </div>
  );
}
