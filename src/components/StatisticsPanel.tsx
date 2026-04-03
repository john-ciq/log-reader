import { calculateStatistics } from '../lib/statistics';
import { storage } from '../lib/local-storage';
import { LogEntry } from '../lib/parser';
import { useState, useMemo } from 'react';
import { useFeatures } from '../lib/FeaturesContext';

interface StatisticsPanelProps {
  entries: LogEntry[];
  totalEntries: number;
}

export default function StatisticsPanel({ entries, totalEntries }: StatisticsPanelProps) {
  const [collapsed, setCollapsed] = useState(() => storage.loadPanelCollapsed('statistics'));
  const [expanded, setExpanded] = useState({
    summary: !storage.loadPanelCollapsed('stats-summary'),
    levels: !storage.loadPanelCollapsed('stats-levels'),
  });

  const { features } = useFeatures();
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
        <h3 className="collapsible-heading" onClick={() => setCollapsed(c => { storage.savePanelCollapsed('statistics', !c); return !c; })}>
          <span className="collapse-arrow">{collapsed ? '▶' : '▼'}</span>
          📊 Statistics
        </h3>
        <div className="stats-actions">
          <span className="total-count">
            Total: {totalEntries} | Filtered: {entries.length}
          </span>
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

      </>}
    </div>
  );
}
