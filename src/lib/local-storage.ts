import { FilterConfig } from './filters';
import { Storage, TimeRange, FilterPreset } from './storage';

const STORAGE_PREFIX = 'log-reader-';

export class BrowserStorage implements Storage {
  saveFilterConfigs(configs: FilterConfig[]): void {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}filters`, JSON.stringify(configs));
    } catch (error) {
      console.error('Failed to save filter configs:', error);
    }
  }

  loadFilterConfigs(): FilterConfig[] {
    try {
      const stored = localStorage.getItem(`${STORAGE_PREFIX}filters`);
      if (!stored) return [];
      const configs: FilterConfig[] = JSON.parse(stored);
      return configs.map(c => ({ ...c, enabled: c.enabled ?? true }));
    } catch (error) {
      console.error('Failed to load filter configs:', error);
      return [];
    }
  }

  saveActiveFilterId(filterId: string): void {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}active-filter`, filterId);
    } catch (error) {
      console.error('Failed to save active filter:', error);
    }
  }

  loadActiveFilterId(): string | null {
    try {
      return localStorage.getItem(`${STORAGE_PREFIX}active-filter`);
    } catch (error) {
      console.error('Failed to load active filter:', error);
      return null;
    }
  }

  saveSortPreference(column: string, direction: 'asc' | 'desc'): void {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}sort`, JSON.stringify({ column, direction }));
    } catch (error) {
      console.error('Failed to save sort preference:', error);
    }
  }

  loadSortPreference(): { column: string; direction: 'asc' | 'desc' } | null {
    try {
      const stored = localStorage.getItem(`${STORAGE_PREFIX}sort`);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to load sort preference:', error);
      return null;
    }
  }

  saveUIPreferences(prefs: Record<string, unknown>): void {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}ui-prefs`, JSON.stringify(prefs));
    } catch (error) {
      console.error('Failed to save UI preferences:', error);
    }
  }

  loadUIPreferences(): Record<string, unknown> {
    try {
      const stored = localStorage.getItem(`${STORAGE_PREFIX}ui-prefs`);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Failed to load UI preferences:', error);
      return {};
    }
  }

  saveColumnPreferences(order: string[], widths: Record<string, number>, collapsed?: string[]): void {
    try {
      const stored = localStorage.getItem(`${STORAGE_PREFIX}columns`);
      const existing = stored ? JSON.parse(stored) : {};
      localStorage.setItem(`${STORAGE_PREFIX}columns`, JSON.stringify({
        ...existing,
        order,
        widths,
        ...(collapsed !== undefined ? { collapsed } : {}),
      }));
    } catch (error) {
      console.error('Failed to save column preferences:', error);
    }
  }

  loadColumnPreferences(): { order: string[]; widths: Record<string, number>; collapsed?: string[] } | null {
    try {
      const stored = localStorage.getItem(`${STORAGE_PREFIX}columns`);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to load column preferences:', error);
      return null;
    }
  }

  saveHiddenLevels(levels: string[]): void {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}hidden-levels`, JSON.stringify(levels));
    } catch (error) {
      console.error('Failed to save hidden levels:', error);
    }
  }

  loadHiddenLevels(): string[] {
    try {
      const stored = localStorage.getItem(`${STORAGE_PREFIX}hidden-levels`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  saveHiddenSources(sources: string[]): void {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}hidden-sources`, JSON.stringify(sources));
    } catch (error) {
      console.error('Failed to save hidden sources:', error);
    }
  }

  loadHiddenSources(): string[] {
    try {
      const stored = localStorage.getItem(`${STORAGE_PREFIX}hidden-sources`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  saveSearchState(query: string, useRegex: boolean): void {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}search`, JSON.stringify({ query, useRegex }));
    } catch (error) {
      console.error('Failed to save search state:', error);
    }
  }

  loadSearchState(): { query: string; useRegex: boolean } {
    try {
      const stored = localStorage.getItem(`${STORAGE_PREFIX}search`);
      return stored ? JSON.parse(stored) : { query: '', useRegex: false };
    } catch {
      return { query: '', useRegex: false };
    }
  }

  saveExpandedFilters(ids: string[]): void {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}expanded-filters`, JSON.stringify(ids));
    } catch (error) {
      console.error('Failed to save expanded filters:', error);
    }
  }

  loadExpandedFilters(): string[] {
    try {
      const stored = localStorage.getItem(`${STORAGE_PREFIX}expanded-filters`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  savePanelCollapsed(panelId: string, collapsed: boolean): void {
    try {
      const stored = localStorage.getItem(`${STORAGE_PREFIX}panel-collapsed`);
      const panels: Record<string, boolean> = stored ? JSON.parse(stored) : {};
      panels[panelId] = collapsed;
      localStorage.setItem(`${STORAGE_PREFIX}panel-collapsed`, JSON.stringify(panels));
    } catch (error) {
      console.error('Failed to save panel state:', error);
    }
  }

  loadPanelCollapsed(panelId: string): boolean {
    try {
      const stored = localStorage.getItem(`${STORAGE_PREFIX}panel-collapsed`);
      if (!stored) return false;
      const panels: Record<string, boolean> = JSON.parse(stored);
      return panels[panelId] ?? false;
    } catch {
      return false;
    }
  }

  saveSourcesState(filter: string, sort: 'name' | 'count', dir: 'asc' | 'desc' = 'asc'): void {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}sources-state`, JSON.stringify({ filter, sort, dir }));
    } catch (error) {
      console.error('Failed to save sources state:', error);
    }
  }

  loadSourcesState(): { filter: string; sort: 'name' | 'count'; dir: 'asc' | 'desc' } {
    try {
      const stored = localStorage.getItem(`${STORAGE_PREFIX}sources-state`);
      if (!stored) return { filter: '', sort: 'name', dir: 'asc' };
      const parsed = JSON.parse(stored);
      return {
        filter: typeof parsed.filter === 'string' ? parsed.filter : '',
        sort: parsed.sort === 'count' ? 'count' : 'name',
        dir: parsed.dir === 'desc' ? 'desc' : 'asc',
      };
    } catch {
      return { filter: '', sort: 'name', dir: 'asc' };
    }
  }

  saveTimeRange(range: TimeRange | null): void {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}time-range`, JSON.stringify(
        range ? { from: range.from?.toISOString() ?? null, to: range.to?.toISOString() ?? null } : null
      ));
    } catch (error) {
      console.error('Failed to save time range:', error);
    }
  }

  loadTimeRange(): TimeRange | null {
    try {
      const stored = localStorage.getItem(`${STORAGE_PREFIX}time-range`);
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      if (!parsed) return null;
      const from = parsed.from ? new Date(parsed.from) : null;
      const to = parsed.to ? new Date(parsed.to) : null;
      if (!from && !to) return null;
      return { from, to };
    } catch {
      return null;
    }
  }

  saveFilterPresets(presets: FilterPreset[]): void {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}presets`, JSON.stringify(presets));
    } catch (error) {
      console.error('Failed to save presets:', error);
    }
  }

  loadFilterPresets(): FilterPreset[] {
    try {
      const stored = localStorage.getItem(`${STORAGE_PREFIX}presets`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  saveSplitPct(pct: number): void {
    try {
      localStorage.setItem('splitPct', String(pct));
    } catch (error) {
      console.error('Failed to save split pct:', error);
    }
  }

  loadSplitPct(): number | null {
    try {
      const stored = localStorage.getItem('splitPct');
      return stored ? parseFloat(stored) : null;
    } catch {
      return null;
    }
  }

  saveTheme(theme: string): void {
    try {
      localStorage.setItem('log-reader-theme', theme);
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  }

  loadTheme(): string | null {
    try {
      return localStorage.getItem('log-reader-theme');
    } catch {
      return null;
    }
  }

  saveFeatureOverrides(overrides: Record<string, boolean>): void {
    try {
      localStorage.setItem('log-reader-features', JSON.stringify(overrides));
    } catch (error) {
      console.error('Failed to save feature overrides:', error);
    }
  }

  loadFeatureOverrides(): Record<string, boolean> {
    try {
      const stored = localStorage.getItem('log-reader-features');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  saveDetailSectionCollapsed(state: Record<string, boolean>): void {
    try {
      localStorage.setItem('detail-section-collapsed', JSON.stringify(state));
    } catch { /* ignore */ }
  }

  loadDetailSectionCollapsed(): Record<string, boolean> {
    try {
      return JSON.parse(localStorage.getItem('detail-section-collapsed') ?? '{}');
    } catch {
      return {};
    }
  }

  saveStarredEntryIds(ids: string[]): void {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}starred-entries`, JSON.stringify(ids));
    } catch { /* ignore */ }
  }

  loadStarredEntryIds(): string[] {
    try {
      const stored = localStorage.getItem(`${STORAGE_PREFIX}starred-entries`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  exportAllData(): Record<string, string> {
    const data: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)!;
      data[key] = localStorage.getItem(key)!;
    }
    return data;
  }

  importAllData(data: Record<string, string>): void {
    Object.entries(data).forEach(([key, value]) => localStorage.setItem(key, value));
  }

  clearAllStoredData(): void {
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith(STORAGE_PREFIX));
      keys.forEach(k => localStorage.removeItem(k));
    } catch (error) {
      console.error('Failed to clear stored data:', error);
    }
  }
}

export const storage: Storage = new BrowserStorage();
