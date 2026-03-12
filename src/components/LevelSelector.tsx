import { useState } from 'react';
import { savePanelCollapsed, loadPanelCollapsed } from '../lib/statistics';

interface LevelSelectorProps {
  levels: string[];
  selected: Set<string>;
  onChange: (level: string, checked: boolean) => void;
}

export default function LevelSelector({ levels, selected, onChange }: LevelSelectorProps) {
  const [collapsed, setCollapsed] = useState(() => loadPanelCollapsed('levels'));

  return (
    <div className="level-selector">
      <h3 className="collapsible-heading" onClick={() => setCollapsed(c => { savePanelCollapsed('levels', !c); return !c; })}>
        <span className="collapse-arrow">{collapsed ? '▶' : '▼'}</span>
        Log Levels
      </h3>
      {!collapsed && (
        <>
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
        </>
      )}
    </div>
  );
}
