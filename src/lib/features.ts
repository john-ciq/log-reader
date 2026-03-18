const STORAGE_KEY = 'log-reader-features';

export type FeatureKey = 'autoSizeColumns' | 'advancedFilters' | 'deduplication' | 'savedPresets' | 'timeRange' | 'persistTimeRange' | 'importExportStorage' | 'scrollLogSources' | 'showOnlyMatches' | 'entryDetailDialog';

// The "visible" property allows us to hide features that are still in development or not
// ready/intended for users, without removing their definitions from the code.
export interface FeatureDefinition {
  name: string;
  defaultValue: boolean;
  description: string;
  visible: boolean;
}

export const featureDefinitions: Record<FeatureKey, FeatureDefinition> = {
  autoSizeColumns: {
    name: 'Auto-size Columns on Log Import',
    defaultValue: true,
    description: 'Auto-size "Timestamp" and "Level" columns to fit log files are loaded',
    visible: true,
  },
  advancedFilters: {
    name: 'Advanced Filters',
    defaultValue: false,
    description: 'Show "Log Levels" and "Log Files" filter sections in the filter panel',
    visible: false,
  },
  deduplication: {
    name: 'Duplicate Entry Merging',
    defaultValue: false,
    description: 'Merge consecutive identical log entries (same message, level, and source) into a single row with a count badge',
    visible: true,
  },
  savedPresets: {
    name: 'Preset Saving',
    defaultValue: false,
    description: 'Show a "Presets" panel in the sidebar to save and restore named filter + search configurations',
    visible: true,
  },
  timeRange: {
    name: 'Time Ranges',
    defaultValue: true,
    description: 'Show a "Time Range" filter and a "log density histogram" above the table',
    visible: true,
  },
  persistTimeRange: {
    name: 'Persist Time Range',
    defaultValue: false,
    description: 'Remember the selected time range filter across page loads',
    visible: true,
  },
  importExportStorage: {
    name: 'Import / Export Storage',
    defaultValue: false,
    description: 'Allow import and export of all settings to share with others or across devices',
    visible: true,
  },
  scrollLogSources: {
    name: 'Scroll in Log Sources',
    defaultValue: true,
    description: 'Scroll in Log Sources — limit the sources list height and add a scrollbar',
    visible: true,
  },
  showOnlyMatches: {
    name: 'Show Only Matches',
    defaultValue: true,
    description: 'Only show log entries that match at least one enabled filter',
    visible: false,
  },
  entryDetailDialog: {
    name: 'Entry Detail as Dialog',
    defaultValue: false,
    description: 'Show the "Entry Detail" panel as a centered dialog instead of a side panel',
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
