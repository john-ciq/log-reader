const STORAGE_KEY = 'log-reader-features';

export type FeatureKey = 'autoSizeColumns' | 'advancedFilters' | 'deduplication' | 'savedPresets' | 'timeRange';

export type Features = Record<FeatureKey, boolean>;

export const featureDefaults: Features = {
  autoSizeColumns: false,
  advancedFilters: false,
  deduplication: false,
  savedPresets: false,
  timeRange: false,
};

export const featureDescriptions: Record<FeatureKey, string> = {
  autoSizeColumns: 'Auto-size "Timestamp" and "Level" columns to fit their content when entries are loaded',
  advancedFilters: 'Show "Log Levels" and "Log Files" filter sections in the filter panel',
  deduplication: 'Merge consecutive identical log entries (same message, level, and source) into a single row with a count badge',
  savedPresets: 'Show a Presets panel in the sidebar to save and restore named filter + search configurations',
  timeRange: 'Show a Time Range filter in the sidebar and a log density histogram above the table',
};

export function loadFeatureOverrides(): Partial<Features> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

export function saveFeatureOverrides(overrides: Partial<Features>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  } catch (error) {
    console.error('Failed to save feature overrides:', error);
  }
}
