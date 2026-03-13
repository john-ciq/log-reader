const STORAGE_KEY = 'log-reader-features';

export type FeatureKey = 'autoSizeColumns' | 'advancedFilters' | 'deduplication' | 'savedPresets' | 'timeRange';

export interface FeatureDefinition {
  defaultValue: boolean;
  description: string;
  visible: boolean;
}

export const featureDefinitions: Record<FeatureKey, FeatureDefinition> = {
  autoSizeColumns: {
    defaultValue: false,
    description: 'Auto-size "Timestamp" and "Level" columns to fit their content when entries are loaded',
    visible: true,
  },
  advancedFilters: {
    defaultValue: false,
    description: 'Show "Log Levels" and "Log Files" filter sections in the filter panel',
    visible: false,
  },
  deduplication: {
    defaultValue: false,
    description: 'Merge consecutive identical log entries (same message, level, and source) into a single row with a count badge',
    visible: true,
  },
  savedPresets: {
    defaultValue: false,
    description: 'Show a Presets panel in the sidebar to save and restore named filter + search configurations',
    visible: true,
  },
  timeRange: {
    defaultValue: true,
    description: 'Show a Time Range filter and a log density histogram above the table',
    visible: true,
  },
};

export type Features = Record<FeatureKey, boolean>;

export const featureDefaults: Features = Object.fromEntries(
  (Object.keys(featureDefinitions) as FeatureKey[]).map(k => [k, featureDefinitions[k].defaultValue])
) as Features;

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
