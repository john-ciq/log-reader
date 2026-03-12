import { useState, useEffect, useCallback } from 'react';
import { LogEntry } from './lib/parser';
import { FilterConfig } from './lib/filters';
import { loadFilterConfigs, saveFilterConfigs, loadActiveFilterId, saveActiveFilterId, saveHiddenLevels, loadHiddenLevels, saveHiddenSources, loadHiddenSources, saveSearchState, loadSearchState } from './lib/statistics';
import FileUploader from './components/FileUploader';
import FilterPanel from './components/FilterPanel';
import SearchBar from './components/SearchBar';
import LogTable from './components/LogTable';
import StatisticsPanel from './components/StatisticsPanel';
import LevelSelector from './components/LevelSelector';
import FileSelector from './components/FileSelector';

// import version from package.json (Vite allows direct import)
import pkg from '../package.json';

import './App.css';

function App() {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<LogEntry[]>([]);
  const [filters, setFilters] = useState<FilterConfig[]>(() => loadFilterConfigs());
  const [activeFilterId, setActiveFilterId] = useState<string | null>(() => {
    const savedId = loadActiveFilterId();
    const savedFilters = loadFilterConfigs();
    return (savedId && savedFilters.some(f => f.id === savedId)) ? savedId : null;
  });
  const [searchQuery, setSearchQuery] = useState(() => loadSearchState().query);
  const [useRegexSearch, setUseRegexSearch] = useState(() => loadSearchState().useRegex);

  // level visibility controls
  const [availableLevels, setAvailableLevels] = useState<string[]>([]);
  const [displayLevels, setDisplayLevels] = useState<Set<string>>(new Set());
  const [hiddenLevels, setHiddenLevels] = useState<Set<string>>(() => new Set(loadHiddenLevels()));

  // file visibility controls
  const [availableFiles, setAvailableFiles] = useState<string[]>([]);
  const [displayFiles, setDisplayFiles] = useState<Set<string>>(new Set());

  // source visibility controls
  const [availableSources, setAvailableSources] = useState<string[]>([]);
  const [displaySources, setDisplaySources] = useState<Set<string>>(new Set());
  const [hiddenSources, setHiddenSources] = useState<Set<string>>(() => new Set(loadHiddenSources()));

  // Save filters whenever they change
  useEffect(() => {
    saveFilterConfigs(filters);
  }, [filters]);

  // Save active filter ID
  useEffect(() => {
    if (activeFilterId) {
      saveActiveFilterId(activeFilterId);
    }
  }, [activeFilterId]);

  // Save search state
  useEffect(() => {
    saveSearchState(searchQuery, useRegexSearch);
  }, [searchQuery, useRegexSearch]);

  const activeFilter = activeFilterId ? filters.find(f => f.id === activeFilterId) : null;

  // Apply filters, level visibility, and file visibility
  useEffect(() => {
    let result = entries;

    // Apply active filter
    if (activeFilter) {
      result = result.filter(entry => {
        const searchText = `${entry.timestamp.toISOString()} ${entry.level} ${entry.source} ${entry.filename || ''} ${entry.message}`;

        // Include patterns — a match forces inclusion, bypassing all other filters
        if (activeFilter.includePatterns.length > 0) {
          const includeMatch = activeFilter.includePatterns.some(pattern => {
            try {
              return new RegExp(pattern, 'i').test(searchText);
            } catch {
              return false;
            }
          });
          if (includeMatch) return true;
          return false;
        }

        // Exclude patterns
        if (activeFilter.excludePatterns.length > 0) {
          const excludeMatch = activeFilter.excludePatterns.some(pattern => {
            try {
              return new RegExp(pattern, 'i').test(searchText);
            } catch {
              return false;
            }
          });
          if (excludeMatch) return false;
        }

        // Level filters
        if (activeFilter.levelFilters.length > 0) {
          if (!activeFilter.levelFilters.includes(entry.level.toLowerCase())) {
            return false;
          }
        }

        // Source filters
        if (activeFilter.sourceFilters.length > 0) {
          if (!activeFilter.sourceFilters.includes(entry.source)) {
            return false;
          }
        }

        // File filters
        if (activeFilter.fileFilters.length > 0) {
          const filename = entry.filename || '';
          if (!activeFilter.fileFilters.includes(filename)) {
            return false;
          }
        }

        return true;
      });
    }

    // Apply global level visibility
    result = result.filter(entry => displayLevels.has(entry.level.toLowerCase()));

    // Apply global file visibility
    result = result.filter(entry => displayFiles.has(entry.filename || ''));

    // Apply global source visibility
    result = result.filter(entry => displaySources.has(entry.source));

    setFilteredEntries(result);
  }, [entries, activeFilter, displayLevels, displayFiles, displaySources]);

  const handleFileUpload = useCallback((uploadedEntries: LogEntry[]) => {
    setEntries(prev => [...prev, ...uploadedEntries]);
  }, []);

  const handleAddFilter = useCallback(() => {
    const newFilter: FilterConfig = {
      id: `filter-${Date.now()}`,
      name: `Filter ${filters.length + 1}`,
      includePatterns: [],
      excludePatterns: [],
      levelFilters: [],
      sourceFilters: [],
      fileFilters: [],
    };
    setFilters([...filters, newFilter]);
    setActiveFilterId(newFilter.id);
  }, [filters]);

  // keep track of available levels when entries change
  useEffect(() => {
    const severityOrder: { [key: string]: number } = {
      'error': 0,
      'warn': 1,
      'warning': 1,
      'info': 2,
      'log': 3,
      'debug': 4,
    };

    const unique = Array.from(new Set(entries.map(e => e.level.toLowerCase()))).sort((a, b) => {
      const severityA = severityOrder[a] ?? 999; // Unknown levels go to the end
      const severityB = severityOrder[b] ?? 999;
      return severityA - severityB;
    });

    setAvailableLevels(unique);
    setDisplayLevels(prev => {
      const next = new Set(prev);
      unique.forEach(l => { if (!hiddenLevels.has(l)) next.add(l); });
      return next;
    });
  }, [entries, hiddenLevels]);

  // keep track of available files when entries change
  useEffect(() => {
    const unique = Array.from(new Set(entries.map(e => e.filename).filter((f): f is string => Boolean(f)))).sort();
    setAvailableFiles(unique);
    setDisplayFiles(prev => {
      const next = new Set(prev);
      unique.forEach(f => next.add(f));
      return next;
    });
  }, [entries]);

  // keep track of available sources when entries change
  useEffect(() => {
    const unique = Array.from(new Set(entries.map(e => e.source).filter(Boolean))).sort();
    setAvailableSources(unique);
    setDisplaySources(prev => {
      const next = new Set(prev);
      unique.forEach(s => { if (!hiddenSources.has(s)) next.add(s); });
      return next;
    });
  }, [entries, hiddenSources]);

  const handleLevelCheckbox = useCallback((level: string, checked: boolean) => {
    setDisplayLevels(prev => {
      const next = new Set(prev);
      if (checked) next.add(level);
      else next.delete(level);
      return next;
    });
    setHiddenLevels(prev => {
      const next = new Set(prev);
      if (!checked) next.add(level); else next.delete(level);
      saveHiddenLevels([...next]);
      return next;
    });
  }, []);

  const handleFileCheckbox = useCallback((file: string, checked: boolean) => {
    setDisplayFiles(prev => {
      const next = new Set(prev);
      if (checked) next.add(file);
      else next.delete(file);
      return next;
    });
  }, []);

  const handleFileRemove = useCallback((file: string) => {
    setEntries(prev => prev.filter(e => e.filename !== file));
    setDisplayFiles(prev => { const next = new Set(prev); next.delete(file); return next; });
    setAvailableFiles(prev => prev.filter(f => f !== file));
  }, []);

  const handleSourceCheckbox = useCallback((source: string, checked: boolean) => {
    setDisplaySources(prev => {
      const next = new Set(prev);
      if (checked) next.add(source);
      else next.delete(source);
      return next;
    });
    setHiddenSources(prev => {
      const next = new Set(prev);
      if (!checked) next.add(source); else next.delete(source);
      saveHiddenSources([...next]);
      return next;
    });
  }, []);

  const handleUpdateFilter = useCallback((filterId: string, updates: Partial<FilterConfig>) => {
    setFilters(filters.map(f => f.id === filterId ? { ...f, ...updates } : f));
  }, [filters]);

  const handleDeleteFilter = useCallback((filterId: string) => {
    setFilters(filters.filter(f => f.id !== filterId));
    if (activeFilterId === filterId) {
      setActiveFilterId(filters[0]?.id || null);
    }
  }, [filters, activeFilterId]);

  const handleMoveFilter = useCallback((filterId: string, direction: 'up' | 'down') => {
    setFilters(prev => {
      const idx = prev.findIndex(f => f.id === filterId);
      if (idx === -1) return prev;
      const next = [...prev];
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= next.length) return prev;
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
      return next;
    });
  }, []);

  const handleReorderFilter = useCallback((fromId: string, toId: string) => {
    setFilters(prev => {
      const fromIdx = prev.findIndex(f => f.id === fromId);
      const toIdx = prev.findIndex(f => f.id === toId);
      if (fromIdx === -1 || toIdx === -1) return prev;
      const next = [...prev];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      return next;
    });
  }, []);

  const handleDuplicateFilter = useCallback((filterId: string) => {
    const source = filters.find(f => f.id === filterId);
    if (!source) return;
    const copy: FilterConfig = {
      ...source,
      id: `filter-${Date.now()}`,
      name: `${source.name} (copy)`,
    };
    setFilters(prev => {
      const idx = prev.findIndex(f => f.id === filterId);
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return next;
    });
    setActiveFilterId(copy.id);
  }, [filters]);

  const handleExportJSON = useCallback(() => {
    const dataStr = JSON.stringify(filteredEntries, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `logs-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [filteredEntries]);

  const handleExportAllJSON = useCallback(() => {
    const dataStr = JSON.stringify(entries, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `logs-all-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [entries]);

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-title">
        <h1>📋 Full View</h1>
        <span className="app-version">v{pkg.version}</span>
      </div>
      <p>Parse, filter, and analyze log files with ease</p>
      </header>

      <div className="app-container">
        <aside className="sidebar">
          <FileUploader onUpload={handleFileUpload} />
          <div className="sidebar-section">
            <LevelSelector
              levels={availableLevels}
              selected={displayLevels}
              onChange={handleLevelCheckbox}
            />
            <FileSelector
              files={availableFiles}
              selected={displayFiles}
              onChange={handleFileCheckbox}
              onRemove={handleFileRemove}
              parsers={Object.fromEntries(
                entries
                  .filter(e => e.filename && e.parser)
                  .map(e => [e.filename!, e.parser!])
              )}
              counts={entries.reduce<Record<string, number>>((acc, e) => {
                if (e.filename) acc[e.filename] = (acc[e.filename] ?? 0) + 1;
                return acc;
              }, {})}
            />
          </div>
          <div className="sidebar-section">
            <h3>Filters & Search</h3>
            <SearchBar
              query={searchQuery}
              onQueryChange={setSearchQuery}
              useRegex={useRegexSearch}
              onRegexChange={setUseRegexSearch}
            />
            <FilterPanel
              filters={filters}
              activeFilterId={activeFilterId}
              onActiveFilterChange={setActiveFilterId}
              onAddFilter={handleAddFilter}
              onUpdateFilter={handleUpdateFilter}
              onDeleteFilter={handleDeleteFilter}
              onMoveFilter={handleMoveFilter}
              onDuplicateFilter={handleDuplicateFilter}
              onReorderFilter={handleReorderFilter}
              availableFiles={[...new Set(entries.map(e => e.filename).filter((f): f is string => Boolean(f)))]}
            />
          </div>
        </aside>

        <main className="main-content">
          <StatisticsPanel
            entries={filteredEntries}
            totalEntries={entries.length}
            onExport={handleExportJSON}
            onExportAll={handleExportAllJSON}
            availableSources={availableSources}
            displaySources={displaySources}
            onSourceChange={handleSourceCheckbox}
          />
          <LogTable entries={filteredEntries} searchQuery={searchQuery} useRegex={useRegexSearch} />
        </main>
      </div>
    </div>
  );
}

export default App;
