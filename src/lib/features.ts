import { storage } from './local-storage';

export type FeatureKey = 'autoSizeColumns' | 'advancedFilters' | 'deduplication' | 'savedPresets' | 'timeRange' | 'persistTimeRange' | 'importExportStorage' | 'scrollLogSources' | 'showOnlyMatches' | 'entryDetailSidebar' | 'filterComments' | 'supportBundle' | 'removeAllFilters' | 'autoScrollToEntry' | 'showSequenceColumn' | 'filterColors' | 'timestampSequence' | 'starredEntries' | 'entryComments' | 'closeTabOnFileRemove' | 'messageScrollable';

// The "visible" property allows us to hide features that are still in development or not
// ready/intended for users, without removing their definitions from the code.
export interface FeatureDefinition {
  name: string;
  defaultValue: boolean;
  description: string;
  visible: boolean;
  category: string;
}

export const featureDefinitions: Record<FeatureKey, FeatureDefinition> = {
  autoSizeColumns: {
    name: 'Auto-size Columns on Log Import',
    defaultValue: true,
    description: 'Auto-size "Timestamp" and "Level" columns to fit log files are loaded',
    visible: true,
    category: 'Table',
  },
  advancedFilters: {
    name: 'Advanced Filters',
    defaultValue: false,
    description: 'Show "Log Levels" and "Log Files" filter sections in the filter panel',
    visible: false,
    category: 'Filters',
  },
  deduplication: {
    name: 'Duplicate Entry Merging',
    defaultValue: false,
    description: 'Merge consecutive identical log entries (same message, level, and source) into a single row with a count badge',
    visible: true,
    category: 'Table',
  },
  savedPresets: {
    name: 'Preset Saving',
    defaultValue: true,
    description: 'Show a "Presets" panel in the sidebar to save and restore named filter + search configurations',
    visible: true,
    category: 'Filters',
  },
  timeRange: {
    name: 'Time Ranges',
    defaultValue: true,
    description: 'Show a "Time Range" filter and a "log density histogram" above the table',
    visible: true,
    category: 'Filters',
  },
  persistTimeRange: {
    name: 'Persist Time Range',
    defaultValue: false,
    description: 'Remember the selected time range filter across page loads',
    visible: true,
    category: 'Filters',
  },
  importExportStorage: {
    name: 'Import / Export Storage',
    defaultValue: false,
    description: 'Allow import and export of all settings to share with others or across devices',
    visible: true,
    category: 'Data',
  },
  scrollLogSources: {
    name: 'Scroll in Log Sources',
    defaultValue: true,
    description: 'Scroll in Log Sources — limit the sources list height and add a scrollbar',
    visible: false,
    category: 'Misc UI',
  },
  showOnlyMatches: {
    name: 'Show Only Matches',
    defaultValue: true,
    description: 'Only show log entries that match at least one enabled filter',
    visible: false,
    category: 'Filters',
  },
  entryDetailSidebar: {
    name: 'Entry Detail as Sidebar',
    defaultValue: false,
    description: 'Show the "Entry Detail" panel as a persistent right sidebar, always visible alongside the log table',
    visible: true,
    category: 'Misc UI',
  },
  filterComments: {
    name: 'Filter Comments',
    defaultValue: false,
    description: 'Show and edit a free-text comment on each filter',
    visible: true,
    category: 'Filters',
  },
  supportBundle: {
    name: 'Support Bundle',
    defaultValue: true,
    description: 'Show buttons to download and import a support bundle (filters, log entries, and settings)',
    visible: true,
    category: 'Data',
  },
  removeAllFilters: {
    name: 'Remove All Filters',
    defaultValue: false,
    description: 'Show a "Remove All" button in the Filters panel to clear all filters at once',
    visible: true,
    category: 'Filters',
  },
  autoScrollToEntry: {
    name: 'Auto-scroll to Active Entry',
    defaultValue: false,
    description: 'Automatically scroll the log table to keep the active entry in view when navigating',
    visible: true,
    category: 'Table',
  },
  showSequenceColumn: {
    name: 'Sequence Column',
    defaultValue: false,
    description: 'Show a "#" column on the far left of the log table with a sequential row number',
    visible: true,
    category: 'Table',
  },
  timestampSequence: {
    name: 'Timestamp-based Sequence Numbers',
    defaultValue: false,
    description: 'Number entries by their timestamp order across all loaded entries, so the sequence number is stable regardless of filtering or sort order',
    visible: true,
    category: 'Table',
  },
  filterColors: {
    name: 'Filter Colors',
    defaultValue: true,
    description: 'Allow filters to highlight matched log entries with a chosen color',
    visible: true,
    category: 'Filters',
  },
  starredEntries: {
    name: 'Starred Entries',
    defaultValue: true,
    description: 'Allow log entries to be starred for easy reference; starred entries are included in bundle exports',
    visible: true,
    category: 'Table',
  },
  entryComments: {
    name: 'Entry Comments',
    defaultValue: true,
    description: 'Allow adding a free-text comment to individual log entries; comments are included in bundle exports',
    visible: true,
    category: 'Table',
  },
  closeTabOnFileRemove: {
    name: 'Close Tab on File Remove',
    defaultValue: true,
    description: 'Automatically close the file viewer tab when its log file is removed from the log sources',
    visible: true,
    category: 'Misc UI',
  },
  messageScrollable: {
    name: 'Scrollable Details in Entry Panel',
    defaultValue: true,
    description: 'Make the message area in the entry detail panel scrollable horizontally and vertically instead of wrapping',
    visible: true,
    category: 'Misc UI',
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
