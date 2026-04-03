import { storage } from './local-storage';

export type FeatureKey = 'autoSizeColumns' | 'advancedFilters' | 'deduplication' | 'savedPresets' | 'timeRange' | 'persistTimeRange' | 'importExportStorage' | 'scrollLogSources' | 'scrollLogFiles' | 'showOnlyMatches' | 'entryDetailSidebar' | 'filterComments' | 'supportBundle' | 'removeAllFilters' | 'autoScrollToEntry' | 'showSequenceColumn' | 'filterColors' | 'timestampSequence' | 'starredEntries' | 'entryComments' | 'closeTabOnFileRemove' | 'messageScrollable' | 'rawFileLineNumbers' | 'columnPicker' | 'filterMatchCounts' | 'expandJsonOnShowMore' | 'filterSplitPane' | 'resizableSidebar';

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
    category: 'Log Table',
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
    category: 'Log Table',
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
    category: 'Filters',
  },
  scrollLogFiles: {
    name: 'Scroll in Log Files',
    defaultValue: true,
    description: 'Scroll in Log Files — limit the files list height and add a scrollbar',
    visible: false,
    category: 'Filters',
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
    visible: false,
    category: 'Entry Detail',
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
    visible: false,
    category: 'Log Table',
  },
  showSequenceColumn: {
    name: 'Sequence Column',
    defaultValue: false,
    description: 'Show a "#" column on the far left of the log table with a sequential row number',
    visible: true,
    category: 'Log Table',
  },
  timestampSequence: {
    name: 'Timestamp-based Sequence Numbers',
    defaultValue: false,
    description: 'Number entries by their timestamp order across all loaded entries, so the sequence number is stable regardless of filtering or sort order',
    visible: true,
    category: 'Log Table',
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
    category: 'Log Table',
  },
  entryComments: {
    name: 'Entry Comments',
    defaultValue: true,
    description: 'Allow adding a free-text comment to individual log entries; comments are included in bundle exports',
    visible: true,
    category: 'Log Table',
  },
  closeTabOnFileRemove: {
    name: 'Close Tab on File Remove',
    defaultValue: true,
    description: 'Automatically close the file viewer tab when its log file is removed from the log sources',
    visible: true,
    category: 'File Tabs',
  },
  messageScrollable: {
    name: 'Scrollable Details in Entry Panel',
    defaultValue: true,
    description: 'Make the message area in the entry detail panel scrollable horizontally and vertically instead of wrapping',
    visible: false,
    category: 'Entry Detail',
  },
  rawFileLineNumbers: {
    name: 'Line Numbers in File Viewer',
    defaultValue: true,
    description: 'Show line numbers in the gutter of the raw file viewer tab',
    visible: true,
    category: 'File Tabs',
  },
  columnPicker: {
    name: 'Column Picker',
    defaultValue: true,
    description: 'Allow columns to be shown or hidden from the log table',
    visible: true,
    category: 'Log Table',
  },
  filterMatchCounts: {
    name: 'Filter Match Counts',
    defaultValue: true,
    description: 'Show a count badge on each filter indicating how many log entries it matches',
    visible: true,
    category: 'Filters',
  },
  expandJsonOnShowMore: {
    name: 'Expand JSON on Show More',
    defaultValue: false,
    description: 'Automatically expand inline JSON objects when "show more" is clicked in the log table',
    visible: true,
    category: 'Log Table',
  },
  filterSplitPane: {
    name: 'Resizable Left Sidebar',
    defaultValue: false,
    description: 'Allow the left sidebar to be resized by dragging its right edge',
    visible: false,
    category: 'Filters',
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
