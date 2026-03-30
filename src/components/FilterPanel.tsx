import { useState, useRef } from 'react';
import { FilterConfig } from '../lib/filters';
import { storage } from '../lib/local-storage';
import { useFeatures } from '../lib/FeaturesContext';

interface FilterPanelProps {
  filters: FilterConfig[];
  onAddFilter: () => string;
  onUpdateFilter: (filterId: string, updates: Partial<FilterConfig>) => void;
  onDeleteFilter: (filterId: string) => void;
  onRemoveAllFilters: () => void;
  onDuplicateFilter: (filterId: string) => void;
  onMoveFilter: (filterId: string, direction: 'up' | 'down') => void;
  onReorderFilter: (fromId: string, toId: string) => void;
  availableFiles: string[];
}

export default function FilterPanel({
  filters,
  onAddFilter,
  onUpdateFilter,
  onDeleteFilter,
  onRemoveAllFilters,
  onDuplicateFilter,
  onMoveFilter,
  onReorderFilter,
  availableFiles,
}: FilterPanelProps) {
  const { features, setFeature } = useFeatures();
  const [expandedFilters, setExpandedFilters] = useState<Set<string>>(() => new Set(storage.loadExpandedFilters()));
  const [patternErrors, setPatternErrors] = useState<Record<string, string>>({});
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const dragIdRef = useRef<string | null>(null);
  const validatePattern = (pattern: string): boolean => {
    try {
      new RegExp(pattern);
      return true;
    } catch {
      return false;
    }
  };

  const handleAddPattern = (filterId: string, pattern: string) => {
    if (!pattern.trim()) return;
    if (!validatePattern(pattern)) {
      setPatternErrors({ ...patternErrors, [filterId]: 'Invalid regex pattern' });
      return;
    }
    setPatternErrors({ ...patternErrors, [filterId]: '' });
    const filter = filters.find(f => f.id === filterId);
    if (!filter) return;
    onUpdateFilter(filterId, { patterns: [...(filter.patterns ?? []), pattern] });
  };

  const commonLevels = ['error', 'warn', 'info', 'log', 'debug'];

  return (
    <div className="filter-panel">
      <div className="filter-header">
        <h4>🔍 Filters</h4>
        {features.removeAllFilters && filters.length > 0 && (
          <button onClick={onRemoveAllFilters} className="delete-btn" title="Remove all filters">
            ✕ All
          </button>
        )}
        <button
          className={`require-match-btn${features.showOnlyMatches ? ' active' : ''}`}
          onClick={() => setFeature('showOnlyMatches', !features.showOnlyMatches)}
          title="Only show entries that match a filter"
        >Matches</button>
        <button onClick={() => {
          const id = onAddFilter();
          setExpandedFilters(prev => {
            const next = new Set(prev);
            next.add(id);
            storage.saveExpandedFilters([...next]);
            return next;
          });
        }} className="add-filter-btn">
          + New
        </button>
      </div>

      {filters.length === 0 ? (
        <p className="empty-message">No filters yet. Create one to get started!</p>
      ) : (
        <div className="filters-list">
          {filters.map(filter => {
            const hasPatterns = (filter.patterns?.length ?? 0) > 0;
            const hasCriteria = filter.levelFilters.length > 0 || filter.fileFilters.length > 0;
            return (
            <div
              key={filter.id}
              className={`filter-item${dragOverId === filter.id ? ' drag-over' : ''}`}
              draggable
              onDragStart={() => { dragIdRef.current = filter.id; }}
              onDragOver={e => { e.preventDefault(); setDragOverId(filter.id); }}
              onDragLeave={() => setDragOverId(null)}
              onDrop={() => {
                setDragOverId(null);
                if (dragIdRef.current && dragIdRef.current !== filter.id) {
                  onReorderFilter(dragIdRef.current, filter.id);
                }
                dragIdRef.current = null;
              }}
              onDragEnd={() => { setDragOverId(null); dragIdRef.current = null; }}
            >
              <div className="filter-header-bar">
                <span className="filter-drag-handle" title="Drag to reorder">⠿</span>
                {features.filterColors && filter.color && (
                  <span className="filter-color-swatch" style={{ backgroundColor: filter.color }} title={`Color: ${filter.color}`} />
                )}
                <div className="filter-radio">
                  <input
                    type="checkbox"
                    id={`filter-${filter.id}`}
                    checked={filter.enabled}
                    onChange={() => onUpdateFilter(filter.id, { enabled: !filter.enabled })}
                  />
                  <div className="filter-title-group">
                    <label htmlFor={`filter-${filter.id}`}>
                      <span className="filter-name-text" title={filter.name || 'Unnamed Filter'}>{filter.name || 'Unnamed Filter'}</span>
                      {features.filterComments && filter.comment && (
                        <span className="filter-comment-preview" title={filter.comment}>{filter.comment}</span>
                      )}
                      <span
                        className={`filter-mode-badge filter-mode-badge--${filter.mode ?? 'include'} filter-mode-badge--clickable filter-mode-badge--first`}
                        onClick={e => { e.preventDefault(); onUpdateFilter(filter.id, { mode: filter.mode === 'exclude' ? 'include' : 'exclude' }); }}
                        title="Click to toggle include/exclude"
                      >
                        {filter.mode ?? 'include'}
                      </span>
                      <span
                        className="filter-mode-badge filter-mode-badge--operator filter-mode-badge--clickable"
                        onClick={e => { e.preventDefault(); onUpdateFilter(filter.id, { operator: filter.operator === 'and' ? 'or' : 'and' }); }}
                        title="Click to toggle and/or"
                      >
                        {filter.operator ?? 'or'}
                      </span>
                    </label>
                    <div className="filter-actions">
                      <button
                        onClick={() => onMoveFilter(filter.id, 'up')}
                        className="move-btn"
                        title="Move up"
                        disabled={filters.indexOf(filter) === 0}
                      >
                          ↑ Up
                      </button>
                      <button
                        onClick={() => onMoveFilter(filter.id, 'down')}
                        className="move-btn"
                        title="Move down"
                        disabled={filters.indexOf(filter) === filters.length - 1}
                        >
                          ↓ Down
                      </button>
                      <button
                        onClick={() => onDuplicateFilter(filter.id)}
                        className="duplicate-btn"
                        title="Duplicate filter"
                      >
                        ⧉ Duplicate
                      </button>
                      <button
                        onClick={() => onDeleteFilter(filter.id)}
                        className="delete-btn"
                        title="Delete filter"
                      >
                        ✕ Remove
                      </button>
                      <button
                        onClick={() => setExpandedFilters(prev => {
                          const next = new Set(prev);
                          if (next.has(filter.id)) next.delete(filter.id); else next.add(filter.id);
                          storage.saveExpandedFilters([...next]);
                          return next;
                        })}
                        className="duplicate-btn"
                      >
                        {expandedFilters.has(filter.id) ? '✕ Close' : '✎ Edit'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {expandedFilters.has(filter.id) && (
                <div className="filter-content">
                  <div className="filter-name-group">
                    <label>Filter Name:</label>
                    <input
                      type="text"
                      value={filter.name}
                      onChange={e => onUpdateFilter(filter.id, { name: e.target.value })}
                      className="filter-name-input"
                      placeholder="My Filter"
                    />
                  </div>

                  {features.filterColors && (
                    <div className="filter-name-group">
                      <label>Highlight Color:</label>
                      <div className="filter-color-row">
                        <input
                          type="color"
                          value={filter.color || '#ffffff'}
                          onChange={e => onUpdateFilter(filter.id, { color: e.target.value })}
                          className="filter-color-input"
                          title="Pick a highlight color for matched entries"
                        />
                        {filter.color && (
                          <button
                            className="filter-color-clear"
                            onClick={() => onUpdateFilter(filter.id, { color: undefined })}
                            title="Remove color"
                          >Clear</button>
                        )}
                      </div>
                    </div>
                  )}

                  {features.filterComments && (
                    <div className="filter-name-group">
                      <label>Comment:</label>
                      <textarea
                        value={filter.comment ?? ''}
                        onChange={e => onUpdateFilter(filter.id, { comment: e.target.value })}
                        className="filter-comment-input"
                        placeholder="Optional note about this filter..."
                        rows={2}
                      />
                    </div>
                  )}

                  <div className={`filter-patterns${hasCriteria && !hasPatterns ? ' section-inactive' : ''}`}>
                    <div className="pattern-section-header">
                      <h5>Patterns {hasCriteria && !hasPatterns && <span className="inactive-note">inactive — level/file criteria in use</span>}</h5>
                      <div className="operator-toggle">
                        <button
                          className={`operator-btn${(filter.mode ?? 'include') === 'include' ? ' active' : ''}`}
                          onClick={() => onUpdateFilter(filter.id, { mode: 'include' })}
                          title="Include matching entries"
                        >Include</button>
                        <button
                          className={`operator-btn${(filter.mode ?? 'include') === 'exclude' ? ' active' : ''}`}
                          onClick={() => onUpdateFilter(filter.id, { mode: 'exclude' })}
                          title="Exclude matching entries"
                        >Exclude</button>
                      </div>
                      <div className="operator-toggle">
                        <button
                          className={`operator-btn${(filter.operator ?? 'or') === 'or' ? ' active' : ''}`}
                          onClick={() => onUpdateFilter(filter.id, { operator: 'or' })}
                          title="Match any pattern (OR)"
                        >OR</button>
                        <button
                          className={`operator-btn${(filter.operator ?? 'or') === 'and' ? ' active' : ''}`}
                          onClick={() => onUpdateFilter(filter.id, { operator: 'and' })}
                          title="Match all patterns (AND)"
                        >AND</button>
                      </div>
                    </div>
                    <div className="patterns-list">
                      {(filter.patterns ?? []).map((pattern, i) => (
                        <div key={i} className="pattern-tag">
                          <span title={pattern}>{pattern}</span>
                          <button
                            onClick={() => onUpdateFilter(filter.id, { patterns: (filter.patterns ?? []).filter((_, j) => j !== i) })}
                            className="remove-pattern"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                    <PatternInput
                      onAdd={pattern => handleAddPattern(filter.id, pattern)}
                      error={patternErrors[filter.id]}
                      placeholder={`Pattern to ${filter.mode ?? 'include'}...`}
                    />
                  </div>

                  {features.advancedFilters && (
                    <div className={`filter-levels${hasPatterns ? ' section-inactive' : ''}`}>
                      <h5>Log Levels {hasPatterns && <span className="inactive-note">inactive — patterns in use</span>}</h5>
                      <div className="level-buttons">
                        {commonLevels.map(level => (
                          <button
                            key={level}
                            onClick={() => {
                              const newLevels = filter.levelFilters.includes(level)
                                ? filter.levelFilters.filter(l => l !== level)
                                : [...filter.levelFilters, level];
                              onUpdateFilter(filter.id, { levelFilters: newLevels });
                            }}
                            className={`level-btn ${filter.levelFilters.includes(level) ? 'active' : ''}`}
                            disabled={hasPatterns}
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {features.advancedFilters && availableFiles.length > 0 && (
                    <div className={`filter-files${hasPatterns ? ' section-inactive' : ''}`}>
                      <h5>Log Files {hasPatterns && <span className="inactive-note">inactive — patterns in use</span>}</h5>
                      <div className="file-buttons">
                        {availableFiles.map(file => (
                          <button
                            key={file}
                            onClick={() => {
                              const newFiles = filter.fileFilters.includes(file)
                                ? filter.fileFilters.filter(f => f !== file)
                                : [...filter.fileFilters, file];
                              onUpdateFilter(filter.id, { fileFilters: newFiles });
                            }}
                            className={`file-btn ${filter.fileFilters.includes(file) ? 'active' : ''}`}
                            title={file}
                            disabled={hasPatterns}
                          >
                            {file.length > 30 ? `${file.substring(0, 27)}...` : file}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface PatternInputProps {
  onAdd: (pattern: string) => void;
  error?: string;
  placeholder?: string;
}

function PatternInput({ onAdd, error, placeholder }: PatternInputProps) {
  const [pattern, setPattern] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleAdd = () => {
    if (!pattern.trim()) return;

    try {
      new RegExp(pattern);
      setLocalError(null);
      onAdd(pattern);
      setPattern('');
    } catch (err) {
      setLocalError(`Invalid regex: ${(err as Error).message}`);
    }
  };

  return (
    <div className="pattern-input-group">
      <input
        type="text"
        value={pattern}
        onChange={e => setPattern(e.target.value)}
        onKeyPress={e => e.key === 'Enter' && handleAdd()}
        placeholder={placeholder}
        className={`pattern-input ${error || localError ? 'error' : ''}`}
      />
      <button onClick={handleAdd} className="add-pattern-btn">
        Add
      </button>
      {(error || localError) && (
        <div className="error-message">{error || localError}</div>
      )}
    </div>
  );
}
