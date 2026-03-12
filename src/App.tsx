import { useState, useEffect, useCallback } from 'react';
import { LogEntry } from './lib/parser';
import { FilterConfig } from './lib/filters';
import { loadFilterConfigs, saveFilterConfigs, loadActiveFilterId, saveActiveFilterId } from './lib/statistics';
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
  const [filters, setFilters] = useState<FilterConfig[]>([]);
  const [activeFilterId, setActiveFilterId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [useRegexSearch, setUseRegexSearch] = useState(false);

  // level visibility controls
  const [availableLevels, setAvailableLevels] = useState<string[]>([]);
  const [displayLevels, setDisplayLevels] = useState<Set<string>>(new Set());

  // file visibility controls
  const [availableFiles, setAvailableFiles] = useState<string[]>([]);
  const [displayFiles, setDisplayFiles] = useState<Set<string>>(new Set());

  // source visibility controls
  const [availableSources, setAvailableSources] = useState<string[]>([]);
  const [displaySources, setDisplaySources] = useState<Set<string>>(new Set());

  // Load saved filters on mount
  useEffect(() => {
    const savedFilters = loadFilterConfigs();
    setFilters(savedFilters);

    const savedFilterId = loadActiveFilterId();
    if (savedFilterId && savedFilters.some(f => f.id === savedFilterId)) {
      setActiveFilterId(savedFilterId);
    }
  }, []);

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

  const activeFilter = activeFilterId ? filters.find(f => f.id === activeFilterId) : null;

  // Apply filters, level visibility, and file visibility
  useEffect(() => {
    let result = entries;

    // Apply active filter
    if (activeFilter) {
      result = result.filter(entry => {
        const searchText = `${entry.timestamp.toISOString()} ${entry.level} ${entry.source} ${entry.filename || ''} ${entry.message}`;

        // Include patterns
        if (activeFilter.includePatterns.length > 0) {
          const includeMatch = activeFilter.includePatterns.some(pattern => {
            try {
              return new RegExp(pattern, 'i').test(searchText);
            } catch {
              return false;
            }
          });
          if (!includeMatch) return false;
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
    if (displayLevels.size > 0) {
      result = result.filter(entry => displayLevels.has(entry.level.toLowerCase()));
    }

    // Apply global file visibility
    if (displayFiles.size > 0) {
      result = result.filter(entry => {
        const filename = entry.filename || '';
        return displayFiles.has(filename);
      });
    }

    // Apply global source visibility
    if (displaySources.size > 0) {
      result = result.filter(entry => displaySources.has(entry.source));
    }

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
      unique.forEach(l => next.add(l));
      return next;
    });
  }, [entries]);

  // keep track of available files when entries change
  useEffect(() => {
    const unique = Array.from(new Set(entries.map(e => e.filename).filter(Boolean))).sort();
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
      unique.forEach(s => next.add(s));
      return next;
    });
  }, [entries]);

  const handleLevelCheckbox = useCallback((level: string, checked: boolean) => {
    setDisplayLevels(prev => {
      const next = new Set(prev);
      if (checked) next.add(level);
      else next.delete(level);
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
              availableFiles={[...new Set(entries.map(e => e.filename).filter(Boolean))]}
            />
          </div>
        </aside>

        <main className="main-content">
          <StatisticsPanel
            entries={filteredEntries}
            totalEntries={entries.length}
            onExport={handleExportJSON}
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
