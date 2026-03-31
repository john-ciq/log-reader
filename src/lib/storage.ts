import { FilterConfig } from './filters';

export interface TimeRange {
  from: Date | null;
  to: Date | null;
}

export interface FilterPreset {
  id: string;
  name: string;
  filters: FilterConfig[];
  search: { query: string; useRegex: boolean };
  timeRange: { from: string | null; to: string | null } | null;
  createdAt: string;
}

export interface Storage {
  saveFilterConfigs(configs: FilterConfig[]): void;
  loadFilterConfigs(): FilterConfig[];
  saveActiveFilterId(filterId: string): void;
  loadActiveFilterId(): string | null;
  saveSortPreference(column: string, direction: 'asc' | 'desc'): void;
  loadSortPreference(): { column: string; direction: 'asc' | 'desc' } | null;
  saveUIPreferences(prefs: Record<string, unknown>): void;
  loadUIPreferences(): Record<string, unknown>;
  saveColumnPreferences(order: string[], widths: Record<string, number>, collapsed?: string[]): void;
  loadColumnPreferences(): { order: string[]; widths: Record<string, number>; collapsed?: string[] } | null;
  saveHiddenLevels(levels: string[]): void;
  loadHiddenLevels(): string[];
  saveHiddenSources(sources: string[]): void;
  loadHiddenSources(): string[];
  saveSearchState(query: string, useRegex: boolean): void;
  loadSearchState(): { query: string; useRegex: boolean };
  saveExpandedFilters(ids: string[]): void;
  loadExpandedFilters(): string[];
  savePanelCollapsed(panelId: string, collapsed: boolean): void;
  loadPanelCollapsed(panelId: string): boolean;
  saveSourcesState(filter: string, sort: 'name' | 'count', dir?: 'asc' | 'desc'): void;
  loadSourcesState(): { filter: string; sort: 'name' | 'count'; dir: 'asc' | 'desc' };
  saveTimeRange(range: TimeRange | null): void;
  loadTimeRange(): TimeRange | null;
  saveFilterPresets(presets: FilterPreset[]): void;
  loadFilterPresets(): FilterPreset[];
  saveSplitPct(pct: number): void;
  loadSplitPct(): number | null;
  saveTheme(theme: string): void;
  loadTheme(): string | null;
  saveFeatureOverrides(overrides: Record<string, boolean>): void;
  loadFeatureOverrides(): Record<string, boolean>;
  saveDetailSectionCollapsed(state: Record<string, boolean>): void;
  loadDetailSectionCollapsed(): Record<string, boolean>;
  saveStarredEntryIds(ids: string[]): void;
  loadStarredEntryIds(): string[];
  exportAllData(): Record<string, string>;
  importAllData(data: Record<string, string>): void;
  clearAllStoredData(): void;
}
