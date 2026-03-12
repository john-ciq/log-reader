import { LogEntry } from './parser';
import { FilterConfig } from './filters';

/**
 * Statistics about a collection of log entries
 */
export interface LogStatistics {
  totalEntries: number;
  levelCounts: Record<string, number>;
  sourceCounts: Record<string, number>;
  dateRange?: {
    min: Date;
    max: Date;
  };
  messageLength: {
    min: number;
    max: number;
    average: number;
  };
}

/**
 * Calculate statistics for log entries
 */
export function calculateStatistics(entries: LogEntry[]): LogStatistics {
  const stats: LogStatistics = {
    totalEntries: entries.length,
    levelCounts: {},
    sourceCounts: {},
    messageLength: {
      min: entries.length > 0 ? Math.min(...entries.map(e => e.message.length)) : 0,
      max: entries.length > 0 ? Math.max(...entries.map(e => e.message.length)) : 0,
      average: entries.length > 0 ? entries.reduce((sum, e) => sum + e.message.length, 0) / entries.length : 0,
    },
  };

  if (entries.length > 0) {
    stats.dateRange = {
      min: new Date(Math.min(...entries.map(e => e.timestamp.getTime()))),
      max: new Date(Math.max(...entries.map(e => e.timestamp.getTime()))),
    };
  }

  // Count levels and sources
  entries.forEach(entry => {
    const level = entry.level.toLowerCase();
    stats.levelCounts[level] = (stats.levelCounts[level] || 0) + 1;
    stats.sourceCounts[entry.source] = (stats.sourceCounts[entry.source] || 0) + 1;
  });

  return stats;
}

/**
 * localStorage key prefix
 */
const STORAGE_PREFIX = 'log-reader-';

/**
 * Save filter configurations to localStorage
 */
export function saveFilterConfigs(configs: FilterConfig[]): void {
  try {
    localStorage.setItem(
      `${STORAGE_PREFIX}filters`,
      JSON.stringify(configs)
    );
  } catch (error) {
    console.error('Failed to save filter configs:', error);
  }
}

/**
 * Load filter configurations from localStorage
 */
export function loadFilterConfigs(): FilterConfig[] {
  try {
    const stored = localStorage.getItem(`${STORAGE_PREFIX}filters`);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load filter configs:', error);
    return [];
  }
}

/**
 * Save the current active filter ID
 */
export function saveActiveFilterId(filterId: string): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}active-filter`, filterId);
  } catch (error) {
    console.error('Failed to save active filter:', error);
  }
}

/**
 * Load the active filter ID
 */
export function loadActiveFilterId(): string | null {
  try {
    return localStorage.getItem(`${STORAGE_PREFIX}active-filter`);
  } catch (error) {
    console.error('Failed to load active filter:', error);
    return null;
  }
}

/**
 * Save table sort preferences
 */
export function saveSortPreference(column: string, direction: 'asc' | 'desc'): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}sort`, JSON.stringify({ column, direction }));
  } catch (error) {
    console.error('Failed to save sort preference:', error);
  }
}

/**
 * Load table sort preferences
 */
export function loadSortPreference(): { column: string; direction: 'asc' | 'desc' } | null {
  try {
    const stored = localStorage.getItem(`${STORAGE_PREFIX}sort`);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Failed to load sort preference:', error);
    return null;
  }
}

/**
 * Save UI preferences (expanded sections, etc.)
 */
export function saveUIPreferences(prefs: Record<string, unknown>): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}ui-prefs`, JSON.stringify(prefs));
  } catch (error) {
    console.error('Failed to save UI preferences:', error);
  }
}

/**
 * Load UI preferences
 */
export function loadUIPreferences(): Record<string, unknown> {
  try {
    const stored = localStorage.getItem(`${STORAGE_PREFIX}ui-prefs`);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Failed to load UI preferences:', error);
    return {};
  }
}

/**
 * Save column order and widths
 */
export function saveColumnPreferences(order: string[], widths: Record<string, number>): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}columns`, JSON.stringify({ order, widths }));
  } catch (error) {
    console.error('Failed to save column preferences:', error);
  }
}

/**
 * Load column order and widths
 */
export function loadColumnPreferences(): { order: string[]; widths: Record<string, number> } | null {
  try {
    const stored = localStorage.getItem(`${STORAGE_PREFIX}columns`);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Failed to load column preferences:', error);
    return null;
  }
}

/**
 * Save/load hidden level names (unchecked in sidebar)
 */
export function saveHiddenLevels(levels: string[]): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}hidden-levels`, JSON.stringify(levels));
  } catch (error) {
    console.error('Failed to save hidden levels:', error);
  }
}

export function loadHiddenLevels(): string[] {
  try {
    const stored = localStorage.getItem(`${STORAGE_PREFIX}hidden-levels`);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Save/load hidden source names (unchecked in sidebar)
 */
export function saveHiddenSources(sources: string[]): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}hidden-sources`, JSON.stringify(sources));
  } catch (error) {
    console.error('Failed to save hidden sources:', error);
  }
}

export function loadHiddenSources(): string[] {
  try {
    const stored = localStorage.getItem(`${STORAGE_PREFIX}hidden-sources`);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Save/load search bar state
 */
export function saveSearchState(query: string, useRegex: boolean): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}search`, JSON.stringify({ query, useRegex }));
  } catch (error) {
    console.error('Failed to save search state:', error);
  }
}

export function loadSearchState(): { query: string; useRegex: boolean } {
  try {
    const stored = localStorage.getItem(`${STORAGE_PREFIX}search`);
    return stored ? JSON.parse(stored) : { query: '', useRegex: false };
  } catch {
    return { query: '', useRegex: false };
  }
}

/**
 * Clear all stored data
 */
export function clearAllStoredData(): void {
  try {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(STORAGE_PREFIX));
    keys.forEach(k => localStorage.removeItem(k));
  } catch (error) {
    console.error('Failed to clear stored data:', error);
  }
}
