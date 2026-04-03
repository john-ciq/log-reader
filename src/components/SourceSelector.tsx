import { useState, useMemo } from 'react';
import { storage } from '../lib/local-storage';
import { useFeatures } from '../lib/FeaturesContext';

interface SourceSelectorProps {
  sources: string[];
  selected: Set<string>;
  sourceCounts: Record<string, number>;
  onChange: (source: string, checked: boolean) => void;
}

export default function SourceSelector({ sources, selected, sourceCounts, onChange }: SourceSelectorProps) {
  const [collapsed, setCollapsed] = useState(() => storage.loadPanelCollapsed('sources'));
  const [sourceFilter, setSourceFilter] = useState(() => storage.loadSourcesState().filter);
  const [sourceSort, setSourceSort] = useState<'name' | 'count'>(() => storage.loadSourcesState().sort);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(() => storage.loadSourcesState().dir);
  const { features } = useFeatures();

  const handleSortClick = (key: 'name' | 'count') => {
    const newDir = sourceSort === key && sortDir === 'asc' ? 'desc' : 'asc';
    setSourceSort(key);
    setSortDir(newDir);
    storage.saveSourcesState(sourceFilter, key, newDir);
  };

  const maxCount = useMemo(() => Math.max(1, ...sources.map(s => sourceCounts[s] ?? 0)), [sources, sourceCounts]);

  const sorted = sources
    .slice()
    .filter(s => s.toLowerCase().includes(sourceFilter.toLowerCase()))
    .sort((a, b) => {
      const asc = sortDir === 'asc' ? 1 : -1;
      return sourceSort === 'name'
        ? asc * a.toLowerCase().localeCompare(b.toLowerCase())
        : asc * ((sourceCounts[a] ?? 0) - (sourceCounts[b] ?? 0));
    });

  return (
    <div className={`source-selector${!collapsed ? ' selector--has-content' : ''}`}>
      <h3 className="collapsible-heading" onClick={() => setCollapsed(c => { storage.savePanelCollapsed('sources', !c); return !c; })}>
        <span className="collapse-arrow">{collapsed ? '▶' : '▼'}</span>
        Log Sources
        {sources.length > 0 && (
          <span className="heading-actions">
            <span className="selector-count">{selected.size}/{sources.length}</span>
            <button className="config-action-btn" onClick={e => { e.stopPropagation(); sources.forEach(s => onChange(s, true)); }}>All</button>
            <button className="config-action-btn" onClick={e => { e.stopPropagation(); sources.forEach(s => onChange(s, false)); }}>None</button>
          </span>
        )}
      </h3>
      {!collapsed && (
        <>
          {sources.length === 0 && <p className="empty-message no-padding">No sources detected yet</p>}
          {sources.length > 0 && (
            <>
              <div className="source-controls">
                <input
                  type="text"
                  value={sourceFilter}
                  onChange={e => { setSourceFilter(e.target.value); storage.saveSourcesState(e.target.value, sourceSort, sortDir); }}
                  placeholder="Filter sources…"
                  className="source-filter-input"
                />
                <div className="source-sort-btns">
                  <button
                    className={`source-sort-btn${sourceSort === 'name' ? ' active' : ''}`}
                    onClick={() => handleSortClick('name')}
                    title={`Sort by name${sourceSort === 'name' ? (sortDir === 'asc' ? ' (A→Z)' : ' (Z→A)') : ''}`}
                  >{sourceSort === 'name' ? (sortDir === 'asc' ? 'A↓Z' : 'Z↓A') : 'A–Z'}</button>
                  <button
                    className={`source-sort-btn${sourceSort === 'count' ? ' active' : ''}`}
                    onClick={() => handleSortClick('count')}
                    title={`Sort by count${sourceSort === 'count' ? (sortDir === 'asc' ? ' (low→high)' : ' (high→low)') : ''}`}
                  >{sourceSort === 'count' ? (sortDir === 'asc' ? '#↑' : '#↓') : '#'}</button>
                </div>
              </div>
              <div className={`stats-breakdown${features.scrollLogSources ? ' stats-breakdown--scrollable' : ''}`}>
                {sorted.map(source => {
                  const count = sourceCounts[source] ?? 0;
                  return (
                    <label key={source} className="stats-row">
                      <span className="stats-label truncate" title={source}>
                        <input
                          type="checkbox"
                          checked={selected.has(source)}
                          onChange={e => onChange(source, e.target.checked)}
                          className="app-checkbox"
                        />
                        {source.length > 35 ? source.slice(0, 35) + '…' : source}
                      </span>
                      <span className="stats-bar-container">
                        <span
                          className="stats-bar"
                          style={{ width: `${(count / maxCount) * 100}%`, backgroundColor: '#4CAF50' }}
                        />
                      </span>
                      <span className="stats-count">{count}</span>
                    </label>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
