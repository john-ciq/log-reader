const STORAGE_KEY = 'log-reader-features';

export type FeatureKey = 'autoSizeColumns' | 'advancedFilters';

export type Features = Record<FeatureKey, boolean>;

export const featureDefaults: Features = {
  autoSizeColumns: false,
  advancedFilters: false,
};

export const featureDescriptions: Record<FeatureKey, string> = {
  autoSizeColumns: 'Auto-size "timestamp" and "Level" columns in the log entry table to fit their content on load',
  advancedFilters: 'Show "LOG LEVELS" and "LOG FILES" filter sections in the filter panel',
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
