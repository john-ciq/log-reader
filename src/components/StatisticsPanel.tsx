import { calculateStatistics } from '../lib/statistics';
import { storage } from '../lib/local-storage';
import { LogEntry } from '../lib/parser';
import { useState, useMemo, useRef } from 'react';
import { useFeatures } from '../lib/FeaturesContext';

interface StatisticsPanelProps {
  entries: LogEntry[];
  totalEntries: number;
  onExport: () => void;
  onExportAll: () => void;
  onExportBundle: () => void;
  onImportBundle: (file: File) => void;
  availableSources: string[];
  displaySources: Set<string>;
  onSourceChange: (source: string, checked: boolean) => void;
}

export default function StatisticsPanel({
  entries,
  totalEntries,
  onExport,
  onExportAll,
  onExportBundle,
  onImportBundle,
  availableSources,
  displaySources,
  onSourceChange,
}: StatisticsPanelProps) {
  const bundleInputRef = useRef<HTMLInputElement>(null);
  const [collapsed, setCollapsed] = useState(() => storage.loadPanelCollapsed('statistics'));
  const [expanded, setExpanded] = useState({
    summary: !storage.loadPanelCollapsed('stats-summary'),
    levels: !storage.loadPanelCollapsed('stats-levels'),
    sources: !storage.loadPanelCollapsed('stats-sources'),
  });
  const [sourceFilter, setSourceFilter] = useState(() => storage.loadSourcesState().filter);
  const [sourceSort, setSourceSort] = useState<'name' | 'count'>(() => storage.loadSourcesState().sort);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(() => storage.loadSourcesState().dir);

  const handleSortClick = (key: 'name' | 'count') => {
    const newDir = sourceSort === key && sortDir === 'asc' ? 'desc' : 'asc';
    setSourceSort(key);
    setSortDir(newDir);
    storage.saveSourcesState(sourceFilter, key, newDir);
  };

  const { features } = useFeatures();
  const stats = useMemo(() => calculateStatistics(entries), [entries]);
  const maxSourceCount = useMemo(() => {
    const counts = Object.values(stats.sourceCounts);
    return counts.length > 0 ? Math.max(...counts) : 1;
  }, [stats.sourceCounts]);

  const getLevelColor = (level: string): string => {
    const colors: Record<string, string> = {
      debug: '#888',
      info: '#0066cc',
      log: '#0066cc',
      warn: '#ff9900',
      warning: '#ff9900',
      error: '#cc0000',
      critical: '#990000',
    };
    return colors[level.toLowerCase()] || '#666';
  };

  return (
    <div className="statistics-panel">
      <div className="stats-header">
        <h3 className="collapsible-heading" onClick={() => setCollapsed(c => { storage.savePanelCollapsed('statistics', !c); return !c; })}>
          <span className="collapse-arrow">{collapsed ? '▶' : '▼'}</span>
          📊 Statistics
        </h3>
        <div className="stats-actions">
          <span className="total-count">
            Total: {totalEntries} | Filtered: {entries.length}
          </span>
          {entries.length > 0 && (
            <button onClick={onExport} className="export-btn" title="Export filtered entries">
              📥 Filtered
            </button>
          )}
          {totalEntries > 0 && (
            <button onClick={onExportAll} className="export-btn" title="Export all entries">
              📥 All
            </button>
          )}
          {features.supportBundle && totalEntries > 0 && (
            <button onClick={onExportBundle} className="export-btn" title="Export support bundle">
              📦 Export
            </button>
          )}
          {features.supportBundle && (
            <>
              <input
                ref={bundleInputRef}
                type="file"
                accept=".json"
                style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) onImportBundle(f); e.target.value = ''; }}
              />
              <button onClick={() => bundleInputRef.current?.click()} className="export-btn" title="Import support bundle">
                📦 Import
              </button>
            </>
          )}
        </div>
      </div>

      {!collapsed && <>
      <div className="stats-section">
        <div
          className="stats-section-header"
          onClick={() => { const v = !expanded.summary; storage.savePanelCollapsed('stats-summary', !v); setExpanded({ ...expanded, summary: v }); }}
        >
          <h4>Summary {!expanded.summary && '▼'} {expanded.summary && '▲'}</h4>
        </div>
        {expanded.summary && (
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-label">Total Entries</div>
              <div className="stat-value">
                {totalEntries.toLocaleString()}
                {entries.length < totalEntries && (
                  <span className="stat-filtered"> ({(totalEntries - entries.length).toLocaleString()} filtered)</span>
                )}
              </div>
            </div>

            {stats.dateRange && (
              <div className="stat-item">
                <div className="stat-label">Date Range</div>
                <div className="stat-value">
                  {stats.dateRange.min.toLocaleDateString()} → {stats.dateRange.max.toLocaleDateString()}
                </div>
              </div>
            )}

            <div className="stat-item">
              <div className="stat-label">Message Length</div>
              <div className="stat-value">
                <div>Min: {Math.round(stats.messageLength.min)}</div>
                <div>Avg: {Math.round(stats.messageLength.average)}</div>
                <div>Max: {Math.round(stats.messageLength.max)}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="stats-section">
        <div
          className="stats-section-header"
          onClick={() => { const v = !expanded.levels; storage.savePanelCollapsed('stats-levels', !v); setExpanded({ ...expanded, levels: v }); }}
        >
          <h4>Log Levels {!expanded.levels && '▼'} {expanded.levels && '▲'}</h4>
        </div>
        {expanded.levels && (
          <div className="stats-breakdown">
            {Object.entries(stats.levelCounts)
              .sort(([levelA], [levelB]) => {
                const severityOrder: { [key: string]: number } = {
                  'error': 0,
                  'warn': 1,
                  'warning': 1,
                  'info': 2,
                  'log': 3,
                  'debug': 4,
                };
                const severityA = severityOrder[levelA.toLowerCase()] ?? 999;
                const severityB = severityOrder[levelB.toLowerCase()] ?? 999;
                return severityA - severityB;
              })
              .map(([level, count]) => (
                <div key={level} className="stats-row">
                  <span className="stats-label">
                    <span
                      className="color-indicator"
                      style={{ backgroundColor: getLevelColor(level) }}
                    />
                    {level.toUpperCase()}
                  </span>
                  <span className="stats-bar-container">
                    <span
                      className="stats-bar"
                      style={{
                        width: `${(count / stats.totalEntries) * 100}%`,
                        backgroundColor: getLevelColor(level),
                      }}
                    />
                  </span>
                  <span className="stats-count">{count}</span>
                </div>
              ))}
          </div>
        )}
      </div>

      <div className="stats-section">
        <div
          className="stats-section-header"
          onClick={() => { const v = !expanded.sources; storage.savePanelCollapsed('stats-sources', !v); setExpanded({ ...expanded, sources: v }); }}
        >
          <h4>Logging Sources {!expanded.sources && '▼'} {expanded.sources && '▲'}</h4>
        </div>
        {expanded.sources && (
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
            {availableSources
              .slice()
              .filter(s => s.toLowerCase().includes(sourceFilter.toLowerCase()))
              .sort((a, b) => {
                const asc = sortDir === 'asc' ? 1 : -1;
                return sourceSort === 'name'
                  ? asc * a.toLowerCase().localeCompare(b.toLowerCase())
                  : asc * ((stats.sourceCounts[a] ?? 0) - (stats.sourceCounts[b] ?? 0));
              })
              .map(source => {
                const count = stats.sourceCounts[source] ?? 0;
                return (
                  <label key={source} className="stats-row">
                    <span className="stats-label truncate" title={source}>
                      <input
                        type="checkbox"
                        checked={displaySources.has(source)}
                        onChange={e => onSourceChange(source, e.target.checked)}
                        className="app-checkbox"
                      />
                      {source.length > 35 ? source.slice(0, 35) + '…' : source}
                    </span>
                    <span className="stats-bar-container">
                      <span
                        className="stats-bar"
                        style={{
                          width: `${(count / maxSourceCount) * 100}%`,
                          backgroundColor: '#4CAF50',
                        }}
                      />
                    </span>
                    <span className="stats-count">{count}</span>
                  </label>
                );
              })}
          </div>
          </>
        )}
      </div>
      </>}
    </div>
  );
}
