import { useState, useRef } from 'react';
import { FilterConfig } from '../lib/filters';
import { saveExpandedFilters, loadExpandedFilters } from '../lib/statistics';

interface FilterPanelProps {
  filters: FilterConfig[];
  onAddFilter: () => void;
  onUpdateFilter: (filterId: string, updates: Partial<FilterConfig>) => void;
  onDeleteFilter: (filterId: string) => void;
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
  onDuplicateFilter,
  onMoveFilter,
  onReorderFilter,
  availableFiles,
}: FilterPanelProps) {
  const [expandedFilters, setExpandedFilters] = useState<Set<string>>(() => new Set(loadExpandedFilters()));
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

  const handleAddPattern = (
    filterId: string,
    type: 'include' | 'exclude',
    pattern: string
  ) => {
    if (!pattern.trim()) return;

    if (!validatePattern(pattern)) {
      setPatternErrors({
        ...patternErrors,
        [`${filterId}-${type}`]: 'Invalid regex pattern',
      });
      return;
    }

    setPatternErrors({
      ...patternErrors,
      [`${filterId}-${type}`]: '',
    });

    const filter = filters.find(f => f.id === filterId);
    if (!filter) return;

    if (type === 'include') {
      onUpdateFilter(filterId, {
        includePatterns: [...filter.includePatterns, pattern],
      });
    } else {
      onUpdateFilter(filterId, {
        excludePatterns: [...filter.excludePatterns, pattern],
      });
    }
  };

  const handleRemovePattern = (
    filterId: string,
    type: 'include' | 'exclude',
    index: number
  ) => {
    const filter = filters.find(f => f.id === filterId);
    if (!filter) return;

    if (type === 'include') {
      const newPatterns = filter.includePatterns.filter((_, i) => i !== index);
      onUpdateFilter(filterId, { includePatterns: newPatterns });
    } else {
      const newPatterns = filter.excludePatterns.filter((_, i) => i !== index);
      onUpdateFilter(filterId, { excludePatterns: newPatterns });
    }
  };

  const commonLevels = ['error', 'warn', 'info', 'log', 'debug'];

  return (
    <div className="filter-panel">
      <div className="filter-header">
        <h4>🔍 Filters</h4>
        <button onClick={onAddFilter} className="add-filter-btn">
          + New
        </button>
      </div>

      {filters.length === 0 ? (
        <p className="empty-message">No filters yet. Create one to get started!</p>
      ) : (
        <div className="filters-list">
          {filters.map(filter => {
            const hasPatterns = filter.includePatterns.length > 0 || filter.excludePatterns.length > 0;
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
                <div className="filter-radio">
                  <input
                    type="checkbox"
                    id={`filter-${filter.id}`}
                    checked={filter.enabled}
                    onChange={() => onUpdateFilter(filter.id, { enabled: !filter.enabled })}
                  />
                  <div className="filter-title-group">
                    <label htmlFor={`filter-${filter.id}`}>
                      {filter.name || 'Unnamed Filter'}
                    </label>
                    <div className="filter-actions">
                      <button
                        onClick={() => onMoveFilter(filter.id, 'up')}
                        className="move-btn"
                        title="Move up"
                        disabled={filters.indexOf(filter) === 0}
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => onMoveFilter(filter.id, 'down')}
                        className="move-btn"
                        title="Move down"
                        disabled={filters.indexOf(filter) === filters.length - 1}
                      >
                        ↓
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
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setExpandedFilters(prev => {
                    const next = new Set(prev);
                    if (next.has(filter.id)) next.delete(filter.id); else next.add(filter.id);
                    saveExpandedFilters([...next]);
                    return next;
                  })}
                  className="expand-btn"
                >
                  {expandedFilters.has(filter.id) ? '▼' : '▶'}
                </button>
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

                  <div className={`filter-patterns${hasCriteria && !hasPatterns ? ' section-inactive' : ''}`}>
                    <h5>Include Patterns {hasCriteria && !hasPatterns && <span className="inactive-note">inactive — level/file criteria in use</span>}</h5>
                    <div className="patterns-list">
                      {filter.includePatterns.map((pattern, i) => (
                        <div key={i} className="pattern-tag">
                          <span>{pattern}</span>
                          <button
                            onClick={() => handleRemovePattern(filter.id, 'include', i)}
                            className="remove-pattern"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                    <PatternInput
                      onAdd={pattern => handleAddPattern(filter.id, 'include', pattern)}
                      error={patternErrors[`${filter.id}-include`]}
                      placeholder="Pattern to include..."
                    />
                  </div>

                  <div className={`filter-patterns${hasCriteria && !hasPatterns ? ' section-inactive' : ''}`}>
                    <h5>Exclude Patterns {hasCriteria && !hasPatterns && <span className="inactive-note">inactive — level/file criteria in use</span>}</h5>
                    <div className="patterns-list">
                      {filter.excludePatterns.map((pattern, i) => (
                        <div key={i} className="pattern-tag">
                          <span>{pattern}</span>
                          <button
                            onClick={() => handleRemovePattern(filter.id, 'exclude', i)}
                            className="remove-pattern"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                    <PatternInput
                      onAdd={pattern => handleAddPattern(filter.id, 'exclude', pattern)}
                      error={patternErrors[`${filter.id}-exclude`]}
                      placeholder="Pattern to exclude..."
                    />
                  </div>

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

                  {availableFiles.length > 0 && (
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
