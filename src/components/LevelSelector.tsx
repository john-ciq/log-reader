import { useState } from 'react';
import { storage } from '../lib/local-storage';

interface LevelSelectorProps {
  levels: string[];
  selected: Set<string>;
  onChange: (level: string, checked: boolean) => void;
}

export default function LevelSelector({ levels, selected, onChange }: LevelSelectorProps) {
  const [collapsed, setCollapsed] = useState(() => storage.loadPanelCollapsed('levels'));

  return (
    <div className={`level-selector${!collapsed ? ' selector--has-content' : ''}`}>
      <h4 className="collapsible-heading" onClick={() => setCollapsed(c => { storage.savePanelCollapsed('levels', !c); return !c; })}>
        <span className="collapse-arrow">{collapsed ? '▶' : '▼'}</span>
        Log Levels
        {levels.length > 0 && (
          <span className="heading-actions">
            <span className="selector-count">{selected.size}/{levels.length}</span>
            <button className="config-action-btn" onClick={e => { e.stopPropagation(); levels.forEach(l => onChange(l, true)); }}>All</button>
            <button className="config-action-btn" onClick={e => { e.stopPropagation(); levels.forEach(l => onChange(l, false)); }}>None</button>
          </span>
        )}
      </h4>
      {!collapsed && (
        <>
          {levels.length === 0 && <p className="empty-message no-padding">No levels detected yet</p>}
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
