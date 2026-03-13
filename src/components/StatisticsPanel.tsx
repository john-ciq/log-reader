import { calculateStatistics, savePanelCollapsed, loadPanelCollapsed, saveSourcesState, loadSourcesState } from '../lib/statistics';
import { LogEntry } from '../lib/parser';
import { useState, useMemo } from 'react';

interface StatisticsPanelProps {
  entries: LogEntry[];
  totalEntries: number;
  onExport: () => void;
  onExportAll: () => void;
  availableSources: string[];
  displaySources: Set<string>;
  onSourceChange: (source: string, checked: boolean) => void;
}

export default function StatisticsPanel({
  entries,
  totalEntries,
  onExport,
  onExportAll,
  availableSources,
  displaySources,
  onSourceChange,
}: StatisticsPanelProps) {
  const [collapsed, setCollapsed] = useState(() => loadPanelCollapsed('statistics'));
  const [expanded, setExpanded] = useState({
    summary: !loadPanelCollapsed('stats-summary'),
    levels: !loadPanelCollapsed('stats-levels'),
    sources: !loadPanelCollapsed('stats-sources'),
  });
  const [sourceFilter, setSourceFilter] = useState(() => loadSourcesState().filter);
  const [sourceSort, setSourceSort] = useState<'name' | 'count'>(() => loadSourcesState().sort);

  const stats = useMemo(() => calculateStatistics(entries), [entries]);

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
        <h3 className="collapsible-heading" onClick={() => setCollapsed(c => { savePanelCollapsed('statistics', !c); return !c; })}>
          <span className="collapse-arrow">{collapsed ? '▶' : '▼'}</span>
          📊 Statistics
        </h3>
        <div className="stats-actions">
          <span className="total-count">
            Total: {totalEntries} | Filtered: {entries.length}
          </span>
          {entries.length > 0 && (
            <button onClick={onExport} className="export-btn">
              📥 Export Filtered
            </button>
          )}
          {totalEntries > 0 && (
            <button onClick={onExportAll} className="export-btn">
              📥 Export All
            </button>
          )}
        </div>
      </div>

      {!collapsed && <>
      <div className="stats-section">
        <div
          className="stats-section-header"
          onClick={() => { const v = !expanded.summary; savePanelCollapsed('stats-summary', !v); setExpanded({ ...expanded, summary: v }); }}
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
          onClick={() => { const v = !expanded.levels; savePanelCollapsed('stats-levels', !v); setExpanded({ ...expanded, levels: v }); }}
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
          onClick={() => { const v = !expanded.sources; savePanelCollapsed('stats-sources', !v); setExpanded({ ...expanded, sources: v }); }}
        >
          <h4>Logging Sources {!expanded.sources && '▼'} {expanded.sources && '▲'}</h4>
        </div>
        {expanded.sources && (
          <>
          <div className="source-controls">
            <input
              type="text"
              value={sourceFilter}
              onChange={e => { setSourceFilter(e.target.value); saveSourcesState(e.target.value, sourceSort); }}
              placeholder="Filter sources…"
              className="source-filter-input"
            />
            <div className="source-sort-btns">
              <button
                className={`source-sort-btn${sourceSort === 'name' ? ' active' : ''}`}
                onClick={() => { setSourceSort('name'); saveSourcesState(sourceFilter, 'name'); }}
                title="Sort by name"
              >A–Z</button>
              <button
                className={`source-sort-btn${sourceSort === 'count' ? ' active' : ''}`}
                onClick={() => { setSourceSort('count'); saveSourcesState(sourceFilter, 'count'); }}
                title="Sort by count"
              >#</button>
            </div>
          </div>
          <div className="stats-breakdown stats-breakdown--scrollable">
            {availableSources
              .slice()
              .filter(s => s.toLowerCase().includes(sourceFilter.toLowerCase()))
              .sort((a, b) => sourceSort === 'name'
                ? a.toLowerCase().localeCompare(b.toLowerCase())
                : (stats.sourceCounts[b] ?? 0) - (stats.sourceCounts[a] ?? 0)
              )
              .map(source => {
                const count = stats.sourceCounts[source] ?? 0;
                return (
                  <label key={source} className="stats-row">
                    <span className="stats-label truncate" title={source}>
                      <input
                        type="checkbox"
                        checked={displaySources.has(source)}
                        onChange={e => onSourceChange(source, e.target.checked)}
                        style={{ accentColor: 'var(--primary)', width: 14, height: 14, flexShrink: 0 }}
                      />
                      {source.length > 35 ? source.slice(0, 35) + '…' : source}
                    </span>
                    <span className="stats-bar-container">
                      <span
                        className="stats-bar"
                        style={{
                          width: `${stats.totalEntries > 0 ? (count / stats.totalEntries) * 100 : 0}%`,
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
