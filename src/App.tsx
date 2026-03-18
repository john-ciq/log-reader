import { useState, useEffect, useCallback, useRef } from 'react';
import { downloadTimestamp } from './lib/utils';
import { LogEntry } from './lib/parser';
import { FilterConfig, getFilterDecision, migrateFilter } from './lib/filters';
import {
  loadFilterConfigs, saveFilterConfigs,
  saveHiddenLevels, loadHiddenLevels,
  saveHiddenSources, loadHiddenSources,
  saveSearchState, loadSearchState,
  savePanelCollapsed, loadPanelCollapsed,
  TimeRange, FilterPreset,
  saveTimeRange, loadTimeRange,
  saveFilterPresets, loadFilterPresets,
} from './lib/statistics';
import { useFeatures } from './lib/FeaturesContext';
import FileUploader, { RawFile } from './components/FileUploader';
import FilterPanel from './components/FilterPanel';
import SearchBar from './components/SearchBar';
import LogTable from './components/LogTable';
import StatisticsPanel from './components/StatisticsPanel';
import LevelSelector from './components/LevelSelector';
import FileSelector from './components/FileSelector';
import RawFileViewer from './components/RawFileViewer';
import FeaturesPanel from './components/FeaturesPanel';
import TimeRangeFilter from './components/TimeRangeFilter';
import RowDetailPanel from './components/RowDetailPanel';
import LogDensityHistogram from './components/LogDensityHistogram';
import PresetsPanel from './components/PresetsPanel';

// import version from package.json (Vite allows direct import)
import pkg from '../package.json';

import './App.css';

function App() {
  const { features } = useFeatures();
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<LogEntry[]>([]);
  const [filters, setFilters] = useState<FilterConfig[]>(() => loadFilterConfigs().map(migrateFilter));
  const [searchQuery, setSearchQuery] = useState(() => loadSearchState().query);
  const [useRegexSearch, setUseRegexSearch] = useState(() => loadSearchState().useRegex);

  // level visibility controls
  const [availableLevels, setAvailableLevels] = useState<string[]>([]);
  const [displayLevels, setDisplayLevels] = useState<Set<string>>(new Set());
  const [hiddenLevels, setHiddenLevels] = useState<Set<string>>(() => new Set(loadHiddenLevels()));

  // file visibility controls
  const [availableFiles, setAvailableFiles] = useState<string[]>([]);
  const [displayFiles, setDisplayFiles] = useState<Set<string>>(new Set());

  const [filtersCollapsed, setFiltersCollapsed] = useState(() => loadPanelCollapsed('filters'));
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => loadPanelCollapsed('sidebar'));

  // raw file tabs
  const [rawFiles, setRawFiles] = useState<RawFile[]>([]);
  const [openTabIds, setOpenTabIds] = useState<Set<string>>(new Set());
  const [tabOrder, setTabOrder] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>('viewer');
  const [activeSubTabs, setActiveSubTabs] = useState<Record<string, string>>({});
  const [subTabOrders, setSubTabOrders] = useState<Record<string, string[]>>({});
  const dragTabId = useRef<string | null>(null);
  const dragSubTabId = useRef<string | null>(null);
  const importConfigRef = useRef<HTMLInputElement>(null);
  const [featuresPanelOpen, setFeaturesPanelOpen] = useState(false);

  // Split pane
  const [splitPct, setSplitPct] = useState(() => {
    const saved = localStorage.getItem('splitPct');
    return saved ? parseFloat(saved) : 50;
  });
  const splitDragging = useRef(false);
  const splitContainerRef = useRef<HTMLDivElement>(null);

  const handleSplitMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    splitDragging.current = true;
    const onMove = (ev: MouseEvent) => {
      if (!splitDragging.current || !splitContainerRef.current) return;
      const rect = splitContainerRef.current.getBoundingClientRect();
      const pct = Math.min(80, Math.max(10, ((ev.clientY - rect.top) / rect.height) * 100));
      setSplitPct(pct);
      localStorage.setItem('splitPct', String(pct));
    };
    const onUp = () => {
      splitDragging.current = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, []);

  // source visibility controls
  const [availableSources, setAvailableSources] = useState<string[]>([]);
  const [displaySources, setDisplaySources] = useState<Set<string>>(new Set());
  const [hiddenSources, setHiddenSources] = useState<Set<string>>(() => new Set(loadHiddenSources()));

  // new: time range, row detail, search ref, presets
  const [timeRange, setTimeRange] = useState<TimeRange | null>(() => features.persistTimeRange ? loadTimeRange() : null);
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const [detailEntry, setDetailEntry] = useState<LogEntry | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [presets, setPresets] = useState<FilterPreset[]>(() => loadFilterPresets());

  // Save filters whenever they change
  useEffect(() => {
    saveFilterConfigs(filters);
  }, [filters]);

  // Save search state
  useEffect(() => {
    saveSearchState(searchQuery, useRegexSearch);
  }, [searchQuery, useRegexSearch]);

  // Save time range (only when persistence is enabled; clear stored value when disabled)
  useEffect(() => {
    saveTimeRange(features.persistTimeRange ? timeRange : null);
  }, [timeRange, features.persistTimeRange]);

  // Save presets
  useEffect(() => {
    saveFilterPresets(presets);
  }, [presets]);

  // Apply filters, level visibility, file visibility, and time range
  useEffect(() => {
    let result = entries;

    // Apply enabled filters — entry passes if it matches ANY enabled filter
    const enabledFilters = filters.filter(f => f.enabled);
    if (enabledFilters.length > 0) {
      result = result.filter(entry => {
        for (const filter of enabledFilters) {
          const decision = getFilterDecision(entry, filter);
          if (decision !== null) return decision;
        }
        return !features.showOnlyMatches; // no filter claimed this entry → include unless "must match" is on
      });
    }

    // Apply global level visibility
    result = result.filter(entry => displayLevels.has(entry.level.toLowerCase()));

    // Apply global file visibility
    result = result.filter(entry => displayFiles.has(entry.filename || ''));

    // Apply global source visibility
    result = result.filter(entry => displaySources.has(entry.source));

    // Apply time range (only when feature is enabled)
    if (features.timeRange && timeRange) {
      const from = timeRange.from?.getTime();
      const to = timeRange.to?.getTime();
      result = result.filter(entry => {
        const t = entry.timestamp.getTime();
        return (from === undefined || t >= from) && (to === undefined || t <= to);
      });
    }

    setFilteredEntries(result);
  }, [entries, filters, features.showOnlyMatches, displayLevels, displayFiles, displaySources, timeRange]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // '/' focuses search bar (unless already in an input/textarea)
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      // Escape closes detail panel
      if (e.key === 'Escape' && detailEntry) {
        setDetailEntry(null);
        setActiveEntryId(null);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [detailEntry]);

  const handleFileUpload = useCallback((uploadedEntries: LogEntry[]) => {
    setEntries(prev => [...prev, ...uploadedEntries]);
  }, []);

  const handleRawFiles = useCallback((files: RawFile[]) => {
    setRawFiles(prev => [...prev, ...files]);
  }, []);

  const handleOpenRawFile = useCallback((filename: string) => {
    for (const rf of rawFiles) {
      if (rf.name === filename) {
        setOpenTabIds(ids => new Set([...ids, rf.id]));
        setTabOrder(prev => prev.includes(rf.id) ? prev : [...prev, rf.id]);
        setActiveTab(rf.id);
        return;
      }
      if (rf.children?.some(c => c.name === filename)) {
        setOpenTabIds(ids => new Set([...ids, rf.id]));
        setTabOrder(prev => prev.includes(rf.id) ? prev : [...prev, rf.id]);
        setActiveTab(rf.id);
        setActiveSubTabs(st => ({ ...st, [rf.id]: filename }));
        return;
      }
    }
  }, [rawFiles]);

  const handleCloseTab = useCallback((tabId: string) => {
    setTabOrder(prev => {
      const newOrder = prev.filter(id => id !== tabId);
      setOpenTabIds(ids => { const next = new Set(ids); next.delete(tabId); return next; });
      setActiveTab(active => {
        if (active !== tabId) return active;
        if (newOrder.length > 0) {
          const closedIdx = prev.indexOf(tabId);
          return newOrder[Math.min(closedIdx, newOrder.length - 1)] ?? 'viewer';
        }
        return 'viewer';
      });
      return newOrder;
    });
  }, []);

  const handleAddFilter = useCallback(() => {
    const newFilter: FilterConfig = {
      id: `filter-${Date.now()}`,
      name: `Filter ${filters.length + 1}`,
      enabled: true,
      mode: 'include',
      patterns: [],
      operator: 'or',
      levelFilters: [],
      sourceFilters: [],
      fileFilters: [],
    };
    setFilters([newFilter, ...filters]);
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
      const severityA = severityOrder[a] ?? 999;
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
  }, [filters]);

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
  }, [filters]);

  const handleExportConfig = useCallback(() => {
    const config = {
      version: 1,
      filters,
      search: { query: searchQuery, useRegex: useRegexSearch },
    };
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `full-view-config-${downloadTimestamp()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [filters, searchQuery, useRegexSearch]);

  const handleImportConfig = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const config = JSON.parse(ev.target?.result as string);
        if (config.filters && Array.isArray(config.filters)) {
          setFilters(config.filters.map((f: FilterConfig) => ({ ...f, enabled: f.enabled ?? true })));
        }
        if (config.search) {
          setSearchQuery(config.search.query ?? '');
          setUseRegexSearch(config.search.useRegex ?? false);
        }
      } catch {
        alert('Failed to import config: invalid JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, []);

  const handleExportJSON = useCallback(() => {
    const dataStr = JSON.stringify(filteredEntries, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `logs-filtered-${downloadTimestamp()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [filteredEntries]);

  const handleExportAllJSON = useCallback(() => {
    const dataStr = JSON.stringify(entries, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `logs-all-${downloadTimestamp()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [entries]);

  // ── Row detail navigation ─────────────────────────────────────────────────────
  const handleRowClick = useCallback((entry: LogEntry) => {
    setActiveEntryId(entry.id);
    setDetailEntry(entry);
  }, []);

  const detailIdx = detailEntry ? filteredEntries.findIndex(e => e.id === detailEntry.id) : -1;
  const hasPrev = detailIdx > 0;
  const hasNext = detailIdx !== -1 && detailIdx < filteredEntries.length - 1;

  const handleDetailPrev = useCallback(() => {
    if (detailIdx > 0) {
      const prev = filteredEntries[detailIdx - 1];
      setDetailEntry(prev);
      setActiveEntryId(prev.id);
    }
  }, [detailIdx, filteredEntries]);

  const handleDetailNext = useCallback(() => {
    if (detailIdx !== -1 && detailIdx < filteredEntries.length - 1) {
      const next = filteredEntries[detailIdx + 1];
      setDetailEntry(next);
      setActiveEntryId(next.id);
    }
  }, [detailIdx, filteredEntries]);

  const handleCloseDetail = useCallback(() => {
    setDetailEntry(null);
    setActiveEntryId(null);
  }, []);

  // ── Convert search to filter ──────────────────────────────────────────────────
  const handleConvertToFilter = useCallback(() => {
    if (!searchQuery.trim()) return;
    const pattern = useRegexSearch
      ? searchQuery
      : searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const newFilter: FilterConfig = {
      id: `filter-${Date.now()}`,
      name: searchQuery.slice(0, 30),
      enabled: true,
      mode: 'include',
      patterns: [pattern],
      operator: 'or',
      levelFilters: [],
      sourceFilters: [],
      fileFilters: [],
    };
    setFilters(prev => [newFilter, ...prev]);
    setSearchQuery('');
  }, [searchQuery, useRegexSearch]);

  // ── Presets ───────────────────────────────────────────────────────────────────
  const handleSavePreset = useCallback((name: string) => {
    const preset: FilterPreset = {
      id: `preset-${Date.now()}`,
      name,
      filters,
      search: { query: searchQuery, useRegex: useRegexSearch },
      timeRange: timeRange ? { from: timeRange.from?.toISOString() ?? null, to: timeRange.to?.toISOString() ?? null } : null,
      createdAt: new Date().toISOString(),
    };
    setPresets(prev => [...prev, preset]);
  }, [filters, searchQuery, useRegexSearch, timeRange]);

  const handleApplyPreset = useCallback((preset: FilterPreset) => {
    setFilters(preset.filters);
    setSearchQuery(preset.search.query);
    setUseRegexSearch(preset.search.useRegex);
    setTimeRange(preset.timeRange ? { from: preset.timeRange.from ? new Date(preset.timeRange.from) : null, to: preset.timeRange.to ? new Date(preset.timeRange.to) : null } : null);
  }, []);

  const handleDeletePreset = useCallback((id: string) => {
    setPresets(prev => prev.filter(p => p.id !== id));
  }, []);

  const handleUpdatePreset = useCallback((id: string) => {
    setPresets(prev => prev.map(p => p.id !== id ? p : {
      ...p,
      filters,
      search: { query: searchQuery, useRegex: useRegexSearch },
      timeRange: timeRange ? { from: timeRange.from?.toISOString() ?? null, to: timeRange.to?.toISOString() ?? null } : null,
    }));
  }, [filters, searchQuery, useRegexSearch, timeRange]);

  const handleImportPresets = useCallback((imported: FilterPreset[]) => {
    setPresets(imported);
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-title">
          <h1>📋 Full View</h1>
          <span className="app-version">v{pkg.version}</span>
        </div>
        <button className="features-toggle-btn" onClick={() => setFeaturesPanelOpen(true)} title="Features">⚙</button>
      </header>
      {featuresPanelOpen && <FeaturesPanel onClose={() => setFeaturesPanelOpen(false)} />}

      {!features.entryDetailSidebar && (
        <RowDetailPanel
          entry={detailEntry}
          onClose={handleCloseDetail}
          onPrev={handleDetailPrev}
          onNext={handleDetailNext}
          hasPrev={hasPrev}
          hasNext={hasNext}
        />
      )}

      <div className="app-container">
        <aside className={`sidebar${sidebarCollapsed ? ' sidebar--collapsed' : ''}`}>
          <button
            className="sidebar-toggle-btn"
            onClick={() => setSidebarCollapsed(c => { savePanelCollapsed('sidebar', !c); return !c; })}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? '›' : '‹'}
          </button>
          {!sidebarCollapsed && (
            <>
              <FileUploader onUpload={handleFileUpload} onRawFiles={handleRawFiles} />
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
                  onOpenRaw={handleOpenRawFile}
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
                <h3 className="collapsible-heading" onClick={() => setFiltersCollapsed(c => { savePanelCollapsed('filters', !c); return !c; })}>
                  <span className="collapse-arrow">{filtersCollapsed ? '▶' : '▼'}</span>
                  Filters & Search
                  <span className="filter-config-actions" onClick={e => e.stopPropagation()}>
                    <button className="config-action-btn" title="Export filters & search config" onClick={handleExportConfig}>⬇ Export</button>
                    <button className="config-action-btn" title="Import filters & search config" onClick={() => importConfigRef.current?.click()}>⬆ Import</button>
                    <input ref={importConfigRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImportConfig} />
                  </span>
                </h3>
                {!filtersCollapsed && (
                  <>
                    <SearchBar
                      query={searchQuery}
                      onQueryChange={setSearchQuery}
                      useRegex={useRegexSearch}
                      onRegexChange={setUseRegexSearch}
                      onConvertToFilter={handleConvertToFilter}
                      inputRef={searchInputRef}
                    />
                    {features.timeRange && (
                      <TimeRangeFilter value={timeRange} onChange={setTimeRange} />
                    )}
                    <FilterPanel
                      filters={filters}
                      onAddFilter={handleAddFilter}
                      onUpdateFilter={handleUpdateFilter}
                      onDeleteFilter={handleDeleteFilter}
                      onMoveFilter={handleMoveFilter}
                      onDuplicateFilter={handleDuplicateFilter}
                      onReorderFilter={handleReorderFilter}
                      availableFiles={[...new Set(entries.map(e => e.filename).filter((f): f is string => Boolean(f)))]}
                    />
                    {features.savedPresets && (
                      <PresetsPanel
                        presets={presets}
                        onApply={handleApplyPreset}
                        onDelete={handleDeletePreset}
                        onSaveCurrent={handleSavePreset}
                        onUpdate={handleUpdatePreset}
                        onImport={handleImportPresets}
                      />
                    )}
                  </>
                )}
              </div>
              {/* {features.savedPresets && (
                <div className="sidebar-section">
                  <PresetsPanel
                    presets={presets}
                    onApply={handleApplyPreset}
                    onDelete={handleDeletePreset}
                    onSaveCurrent={handleSavePreset}
                  />
                </div>
              )} */}
            </>
          )}
        </aside>

        <main className="main-content">
          <div className="tab-bar">
            <button
              className={`tab-btn${activeTab === 'viewer' ? ' active' : ''}`}
              onClick={() => setActiveTab('viewer')}
            >
              Log Viewer
            </button>
            {tabOrder.map(id => rawFiles.find(rf => rf.id === id)).filter((rf): rf is RawFile => !!rf && openTabIds.has(rf.id)).map(rf => (
              <button
                key={rf.id}
                className={`tab-btn${activeTab === rf.id ? ' active' : ''}`}
                onClick={() => setActiveTab(rf.id)}
                title={rf.name}
                draggable
                onDragStart={() => { dragTabId.current = rf.id; }}
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                  e.preventDefault();
                  const fromId = dragTabId.current;
                  dragTabId.current = null;
                  if (!fromId || fromId === rf.id) return;
                  setTabOrder(prev => {
                    const next = prev.filter(id => id !== fromId);
                    const toIdx = next.indexOf(rf.id);
                    next.splice(toIdx, 0, fromId);
                    return next;
                  });
                }}
              >
                {rf.name.length > 20 ? `${rf.name.slice(0, 17)}…` : rf.name}
                <span
                  className="tab-close"
                  onClick={e => { e.stopPropagation(); handleCloseTab(rf.id); }}
                  aria-label={`Close ${rf.name}`}
                >
                  ×
                </span>
              </button>
            ))}
          </div>

          {activeTab === 'viewer' ? (
            <div className="split-pane" ref={splitContainerRef}>
              <div className="split-pane__top" style={{ height: `${splitPct}%` }}>
                <StatisticsPanel
                  entries={filteredEntries}
                  totalEntries={entries.length}
                  onExport={handleExportJSON}
                  onExportAll={handleExportAllJSON}
                  availableSources={availableSources}
                  displaySources={displaySources}
                  onSourceChange={handleSourceCheckbox}
                />
              </div>
              <div className="split-pane__divider" onMouseDown={handleSplitMouseDown}>
                <div className="split-pane__handle" />
              </div>
              <div className="split-pane__bottom">
                {features.timeRange && (
                  <LogDensityHistogram
                    entries={filteredEntries}
                    timeRange={timeRange}
                    onTimeRangeChange={setTimeRange}
                  />
                )}
                <LogTable
                  entries={filteredEntries}
                  searchQuery={searchQuery}
                  useRegex={useRegexSearch}
                  activeEntryId={activeEntryId}
                  onRowClick={handleRowClick}
                />
              </div>
            </div>
          ) : (() => {
            const rf = rawFiles.find(f => f.id === activeTab && openTabIds.has(f.id));
            if (!rf) return null;
            if (rf.children && rf.children.length > 0) {
              const children = rf.children;
              const activeChild = activeSubTabs[rf.id] ?? children[0].name;
              const childContent = children.find(c => c.name === activeChild)?.content ?? '';
              return (
                <div className="tab-content">
                  <div className="sub-tab-bar">
                    {(subTabOrders[rf.id] ?? children.map(c => c.name))
                      .map(name => children.find(c => c.name === name))
                      .filter((c): c is { name: string; content: string } => !!c)
                      .map(child => (
                        <button
                          key={child.name}
                          className={`sub-tab-btn${activeChild === child.name ? ' active' : ''}`}
                          onClick={() => setActiveSubTabs(prev => ({ ...prev, [rf.id]: child.name }))}
                          title={child.name}
                          draggable
                          onDragStart={() => { dragSubTabId.current = child.name; }}
                          onDragOver={e => e.preventDefault()}
                          onDrop={e => {
                            e.preventDefault();
                            const fromName = dragSubTabId.current;
                            dragSubTabId.current = null;
                            if (!fromName || fromName === child.name) return;
                            setSubTabOrders(prev => {
                              const current = prev[rf.id] ?? children.map(c => c.name);
                              const next = current.filter(n => n !== fromName);
                              const toIdx = next.indexOf(child.name);
                              next.splice(toIdx, 0, fromName);
                              return { ...prev, [rf.id]: next };
                            });
                          }}
                        >
                          {child.name.length > 28 ? `${child.name.slice(0, 25)}…` : child.name}
                        </button>
                      ))}
                  </div>
                  <RawFileViewer content={childContent} />
                </div>
              );
            }
            return (
              <div className="tab-content">
                <RawFileViewer content={rf.content} />
              </div>
            );
          })()}
        </main>
        {features.entryDetailSidebar && (
          <RowDetailPanel
            entry={detailEntry}
            onClose={handleCloseDetail}
            onPrev={handleDetailPrev}
            onNext={handleDetailNext}
            hasPrev={hasPrev}
            hasNext={hasNext}
            sidebar
          />
        )}
      </div>
    </div>
  );
}

export default App;
