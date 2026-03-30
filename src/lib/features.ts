import { storage } from './local-storage';

export type FeatureKey = 'autoSizeColumns' | 'advancedFilters' | 'deduplication' | 'savedPresets' | 'timeRange' | 'persistTimeRange' | 'importExportStorage' | 'scrollLogSources' | 'showOnlyMatches' | 'entryDetailSidebar' | 'filterComments' | 'supportBundle' | 'removeAllFilters' | 'autoScrollToEntry' | 'showSequenceColumn' | 'filterColors';

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
    defaultValue: true,
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
  entryDetailSidebar: {
    name: 'Entry Detail as Sidebar',
    defaultValue: false,
    description: 'Show the "Entry Detail" panel as a persistent right sidebar, always visible alongside the log table',
    visible: true,
  },
  filterComments: {
    name: 'Filter Comments',
    defaultValue: false,
    description: 'Show and edit a free-text comment on each filter',
    visible: true,
  },
  supportBundle: {
    name: 'Support Bundle',
    defaultValue: true,
    description: 'Show buttons to download and import a support bundle (filters, log entries, and settings)',
    visible: true,
  },
  removeAllFilters: {
    name: 'Remove All Filters',
    defaultValue: false,
    description: 'Show a "Remove All" button in the Filters panel to clear all filters at once',
    visible: true,
  },
  autoScrollToEntry: {
    name: 'Auto-scroll to Active Entry',
    defaultValue: false,
    description: 'Automatically scroll the log table to keep the active entry in view when navigating',
    visible: true,
  },
  showSequenceColumn: {
    name: 'Sequence Column',
    defaultValue: true,
    description: 'Show a "#" column on the far left of the log table with a sequential row number',
    visible: true,
  },
  filterColors: {
    name: 'Filter Colors',
    defaultValue: true,
    description: 'Allow filters to highlight matched log entries with a chosen color',
    visible: true,
  },
};

export type Features = Record<FeatureKey, boolean>;

export const featureDefaults: Features = Object.fromEntries(
  (Object.keys(featureDefinitions) as FeatureKey[]).map(k => [k, featureDefinitions[k].defaultValue])
) as Features;

export function loadFeatureOverrides(): Partial<Features> {
  return storage.loadFeatureOverrides();
}

export function saveFeatureOverrides(overrides: Partial<Features>): void {
  storage.saveFeatureOverrides(overrides);
}
