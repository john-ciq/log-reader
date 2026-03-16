# Changelog

All notable changes to the Log Reader project will be documented in this file.

## [10.054] - 2026-03-16

### Added
- **Update preset** button on each saved preset — overwrites the preset's filters, search, and time range with the current state without renaming it
- **AND/OR operator toggle** on Include and Exclude pattern sections — each pattern group has an OR/AND pill toggle; OR (default) matches if any pattern matches, AND requires all patterns to match; backwards-compatible with existing saved filters
- **Escape key closes settings panel** — pressing Escape while the settings dialog is open dismisses it
- **Gilding log parser** — parses `gilding.log` files produced by Tick42/io.Connect Desktop (format: `YYYY-MM-DD HH:MM:SS,mmm [thread][LEVELrocessid][pid] LEVEL Source - message`); thread and PID stored as metadata; non-matching banner lines are silently skipped
- **ZIP file support for generic archives** — ZIP files without `log_state.json` are now unpacked and each contained file is processed normally; nested ZIP files are handled recursively; ZIP files containing `log_state.json` continue to use the existing structured format
- **"No parser found" shown in red** in the Log Files panel when no parser matches a loaded file
- **Theme-aware datetime pickers** — all hard-coded dark colors replaced with CSS variables so the calendar popup follows the light/dark/system theme
- **Resizable split pane** in the main content area — the statistics panel occupies the top section and the histogram + log table occupy the bottom section; drag the divider to resize; position persists in localStorage
- **Light/dark/system theme selector** in the settings panel

### Changed
- Download file name timestamp format has changed
- Settings panel now closes on Escape key
- All checkboxes across the app (log levels, feature toggles, file list, statistics sources) now use the same custom styled appearance as the filter panel checkboxes
- Preset confirm button styled to match the Save/Export/Import action buttons
- UI made more compact: reduced padding on app container, sidebar sections, file uploader, statistics panel, tab content, stats grid cards, log level rows, and bar heights
- Log table rows reduced to 28 px height with tighter cell padding and smaller font
- Table header control bar (entry count) removed; selection/copy toolbar only shown when rows are selected
- Statistics panel summary cards and log level rows made more compact
- Histogram, time range filter, and presets panel colors converted from hard-coded dark-theme hex values to CSS variables for correct light/dark theming
- App header reduced to a single compact row: title and version left-aligned, settings button right-aligned; subtitle paragraph hidden

## [1.0.53] - 2026-03-13

### Added
- **Browse button** in the "Upload Log File(s)" panel heading — opens the file picker without needing to expand the panel; works whether the panel is collapsed or expanded
- **Reset button** in the settings panel — resets all feature flags to their default values and clears persisted overrides from localStorage
- **`importExportStorage`** feature flag (default: off) — when enabled, Import and Export buttons appear at the bottom of the settings panel to back up and restore all localStorage settings as `log-reader-settings.json`; importing reloads the page to apply
- **`persistTimeRange`** feature flag (default: off) — when enabled, the selected time range filter is saved to localStorage and restored on the next page load; disabling the flag clears any previously stored range
- **Import/Export for filter presets** — Import and Export buttons in the Filter Presets panel header to save presets to `log-reader-presets.json` and restore them from a previously exported file

## [1.0.52] - 2026-03-13

### Added
- **Row detail panel** — click any log row to open a slide-in panel on the right showing all fields (timestamp, level, file, source, parser, message, metadata, raw); navigate with ← → arrow keys or the ‹ › buttons; close with Esc
- **Log density histogram** — SVG bar chart above the table showing log volume over time, coloured by log level; click and drag to set a time range filter; click ✕ to clear
- **Time range filter** — two datetime-local inputs in the sidebar to constrain entries to a time window; the selected range persists across page loads, gated behind
a feature
- **Keyboard navigation** — press `/` anywhere to focus the search bar; `j`/`↓` and `k`/`↑` to move between rows in the table; `Enter` to open the detail panel for the active row; `Esc` to close the detail panel
- **Convert search to filter** — when a search query is active, a `+ Filter` button appears next to the search bar; clicking it creates a new filter from the query and clears the search field
- **Deduplication** feature flag — when enabled, consecutive identical log entries (same message, level, and source) are merged into a single row with a `×N` badge in the message column; the entry count shows total vs. deduplicated counts (default: off)
- **Copy rows to clipboard** — Ctrl/Cmd+click to select individual rows, Shift+click to select a range; a toolbar appears showing the selection count with a "Copy N" button that copies the selected rows as tab-separated text; click ✕ to clear the selection
- **Saved presets** feature flag — when enabled, a Presets panel appears in the sidebar; click `+` to save the current filters, search, and time range as a named preset; click a preset to restore it; click ✕ to delete (default: off)

### Changed
- Feature flag definitions consolidated into a single `FeatureDefinition` object per feature (containing `defaultValue`, `description`, and `visible`) replacing the previous separate `featureDefaults` and `featureDescriptions` maps; the `visible` field controls whether a feature appears in the settings panel
- Height of the "Search Logs" input, `.*` regex toggle, "Filter sources…" input, and source sort buttons (A–Z / #) now matches the height of the `+ New` button

## [1.0.51] - 2026-03-12

### Added
- Feature flags panel — click the ⚙ button in the top-right of the header to open a modal where features can be toggled on or off at runtime without editing code; selections persist across page loads via localStorage
- **autoSizeColumns** feature flag — auto-sizes the Timestamp and Level columns to fit their content on load (default: off)
- **advancedFilters** feature flag — shows the "Log Levels" and "Log Files" filter sections in the filter panel (default: off)
- Logging Sources sort order — sources can now be sorted alphabetically (A–Z) or by count (#); the chosen sort persists across page loads
- Collapse state of the Summary, Log Levels, and Logging Sources statistics panels now persists across page loads
- Source filter text and sort order in the Logging Sources panel now persists across page loads
- Collapsed table columns now persist across page loads

### Changed
- Source labels in the Logging Sources panel are truncated at 35 characters; the full name is shown as a tooltip on hover

## [1.0.50] - 2026-03-12

### Added
- Import/export of filter and search configuration — export saves all filters plus the current search query/regex flag to a JSON file; import restores them from a previously exported file
  - Export/Import buttons appear in the "Filters & Search" heading
- JSON preview in message cells — when a message contains JSON that is collapsed, the first 35 characters of the compact JSON are shown inline next to the toggle arrow
- Collapsible table columns — each column header has a `‹` button to collapse the column to a narrow strip; clicking `›` in the collapsed header restores it
- Drag handles on filter containers (⠿ icon on the left side of each filter item)

### Changed
- Timestamp and Level table columns are now auto-sized to fit their content when log entries are loaded — timestamp never wraps, level is as narrow as possible
- Sidebar now has matching padding on both left and right sides
- Column collapse buttons are always visible (not just on hover)

## [1.0.49] - 2026-03-12

### Added
- Collapsible sidebar — a `‹`/`›` toggle button collapses all left panels to a narrow 2rem strip; collapsed state persists via localStorage

### Changed
- Search highlighting in raw file tabs is now debounced by 250ms — highlights do not update until typing pauses, preventing expensive re-renders on every keystroke

### Fixed
- Raw file tabs now auto-format valid JSON content (pretty-print with 2-space indentation)
  - Minified single-line JSON files (e.g. 1.6 MB on one line) previously caused the browser to silently fail to paint any content because the `<pre>` element needed to be millions of pixels wide
  - Pretty-printing produces thousands of short lines, which renders correctly in all cases
- Wrap toggle now correctly wraps lines when content is pretty-printed
  - `width: max-content` is now only applied when wrap is off; when wrap is on, the `<pre>` fills the container so `white-space: pre-wrap` can wrap at the boundary

## [1.0.48] - 2026-03-12

### Added
- Raw file tabs for uploaded files
  - A "Log Viewer" tab is always present; each uploaded file gets a dedicated raw content tab
  - ZIP files open as a single tab with sub-tabs for each JSON file inside the archive
  - File contents are displayed in a monospace font with horizontal scrolling
- `↗` open button on each file in the Log Files panel to open its raw tab on demand
  - Clicking an already-open tab's `↗` focuses that tab instead of opening a duplicate
  - Closed tabs can be reopened via `↗`
- `×` close button on each raw file tab (the Log Viewer tab cannot be closed)
- Wrap toggle checkbox in each raw file tab's toolbar
- Find toolbar in each raw file tab: text input, Find button (cycles to next match on each press), `.*` regex toggle, and a match counter showing current position and total matches
  - All matches are highlighted; the current match is highlighted distinctly
  - Pressing Enter in the search field advances to the next match
- Drag-to-reorder raw file tabs (main tabs and ZIP sub-tabs)

## [1.0.47] - 2026-03-12

### Changed
- Timestamp column now displays in `YYYYMMDD HH:mm:ss.mmm` format (24-hour, fixed-width, milliseconds always shown)
- Milliseconds are now preserved when parsing FEA log timestamps (previously dropped by the parser)
- Log entries from formats without millisecond precision display `.000`

## [1.0.46] - 2026-03-12

### Fixed
- Virtual scroll feedback loop when scrolled to the bottom of the table
  - Variable-height rows (e.g. wrapped messages) could cause `scrollTop` to exceed `scrollHeight`, triggering repeated re-renders that appeared as the table "trying to load more rows"
  - When the last row is in view, `startIdx` is now clamped to a stable minimum window rather than being recomputed from `scrollTop`

## [1.0.45] - 2026-03-12

### Added
- New parser for ICG Desktop Native Bridge log files (`ICG_DESKTOP_NATIVE_BRIDGE_*.log`)
  - Supports timestamp with timezone offset, log levels (`INF`, `ERR`, `WRN`, `DBG`), thread ID, source, and message
  - Lines without a source separator (e.g. `pAPI` and `** ... **` entries) are handled gracefully
  - Thread ID is stored in entry metadata

## [1.0.44] - 2026-03-12

### Added
- Statistics panel is now collapsible — click the "📊 Statistics" heading to collapse or expand it; state persists via `localStorage`
- App layout now fills the full screen width (removed `max-width` constraint on the main container)

## [1.0.43] - 2026-03-12

### Added
- Virtual scrolling in the log table — only visible rows are rendered as DOM elements, keeping the UI fast with large log files
  - Rows above and below the viewport are represented by spacer elements; the scrollbar reflects the full entry count
  - Layout changed to viewport-height (`100vh`) so the table wrapper is the scroll container rather than the page
- Collapsible sidebar panels — each panel can be expanded or collapsed by clicking its heading
  - Panels: Upload Log File(s), Log Levels, Log Files, Filters & Search
  - Collapsed state of each panel persists across reloads via `localStorage`
- Individual filter cards can now each be independently expanded or collapsed (previously accordion-style, now independent)
  - Expanded/collapsed state of each filter persists across reloads via `localStorage`

## [1.0.42] - 2026-03-12

### Added
- Filter editor now visually indicates which mode (patterns or level/file criteria) is active
  - When include or exclude patterns are present, Log Levels and Log Files sections are dimmed and their buttons are disabled, with an *"inactive — patterns in use"* label
  - When level or file criteria are selected but no patterns exist, the pattern input sections are dimmed with an *"inactive — level/file criteria in use"* label
  - Prevents confusion when both are configured but only one set is actually evaluated

### Fixed
- Build output now uses relative asset paths (`./assets/...`) instead of absolute paths (`/assets/...`)
  - Set `base: './'` in `vite.config.ts` so the app can be served from any subdirectory or opened directly as a file

## [1.0.41] - 2026-03-12

### Documentation
- Updated README to reflect current feature set
  - Filtering section rewritten to describe multiple simultaneous filters and cascading evaluation
  - Export section updated to reflect "Export Filtered" / "Export All" buttons
  - Persistence section expanded to include hidden levels/sources and search state
  - File upload accept list updated to include `.json`
  - Usage steps updated to match current filter workflow and export button names

## [1.0.40] - 2026-03-12

### Changed
- Multiple filters can now be enabled simultaneously; they are evaluated in order
  - Each enabled filter is checked in sequence; the first filter that has an opinion about an entry wins
  - A filter has an opinion when one of its patterns or criteria matches the entry
  - If no filter claims an entry, it is included by default
- Filter enable/disable is now a checkbox instead of a radio button, allowing multiple active filters
- Filter decision logic is now tri-state: include, exclude, or no opinion (pass to next filter)
  - Include pattern matches → include the entry and stop
  - Include pattern exists but doesn't match → no opinion, try next filter
  - Exclude pattern matches → exclude the entry and stop
  - Exclude pattern exists but doesn't match → no opinion, try next filter
  - No patterns, all level/source/file criteria pass → include and stop
  - No patterns, a criterion doesn't apply to this entry → no opinion, try next filter

## [1.0.39] - 2026-03-12

### Added
- Drag-and-drop reordering of filters in the Filter panel
  - Drag any filter card to a new position; a blue highlight indicates the drop target
  - Filter order persists via localStorage alongside other filter settings
- Duplicate filter button (⧉ Duplicate) to copy an existing filter with all its settings
- Remove filter button (✕ Remove) on each filter card
- Up/down arrow buttons to reorder filters one position at a time

### Fixed
- Filter settings (include/exclude patterns, level filters, file filters) now persist correctly across page reloads
  - Previously, the save effect would fire with an empty array on mount before the load effect restored saved data
  - Fixed by replacing the load `useEffect` with lazy `useState` initialization
- Include patterns now force entry inclusion, bypassing all other filters (exclude patterns, level filters, file filters)
  - Previously, include patterns were treated as additional restrictions rather than overrides
- Level and source visibility selections now persist across page reloads
  - Unchecked levels/sources are saved to localStorage and restored on load

## [1.0.38] - 2026-03-12

### Added
- "Export All" button in the Statistics panel exports every loaded entry regardless of active filters
  - Existing "Export Filtered" button behavior is unchanged
  - "Export All" is only shown when at least one entry is loaded; downloads as `logs-all-<date>.json`
- Entry count per file is now shown in the Log Files panel, on its own line between the filename and parser name
- "Export Filtered" renamed from "Export JSON" to better reflect its behavior
- File browser dialog now accepts `.json` files in addition to `.log`, `.txt`, and `.zip`

## [1.0.37] - 2026-03-12

### Fixed
- Finsemble JSON parser now matches log entries regardless of field order
  - Previously required `logTimestamp`, `logType`, `logClientName`, and `parsedLogArgs` to appear in a specific order; real Finsemble logs have them in a different order
  - Pattern now anchors on the distinctive `"logTimestamp": <number>` field; field presence is validated in the format function
  - `logClientName` is now reliably used as the source field on the website

### Changed
- Moved `test-multiline.ts` from the project root into the `test/` directory

## [1.0.36] - 2026-03-12

### Added
- Statistics panel Summary section now shows total entry count
  - Displays the number of entries currently filtered out inline next to the total (e.g. `1,243 (87 filtered)`)
  - The filtered count is only shown when at least one entry is hidden

## [1.0.35] - 2026-03-12

### Fixed
- Inline object expansion now correctly handles messages where a non-JSON bracket group (e.g. `[o [WebRequestError]]`) appears before the actual object
  - `extractJson` previously locked onto the first `[` or `{` and would not recover if that bracket group failed to parse
  - Rewritten to restart the search after each failed bracket group, so the JS-style `{...}` object that follows is found and expanded correctly
  - Covers log files like `ChartIQ Example App.log` and `bloombergBridgeService.log`

## [1.0.34] - 2026-03-12

### Fixed
- Inline object expansion now works for JavaScript-style object literals (unquoted keys, single-quoted strings, `undefined` values)
  - These appear in logs like `ChartIQ Example App.log` where a `WebRequestError` object is appended to the message
  - A normalization step converts the JS notation to valid JSON before attempting to parse and render the expandable tree

## [1.0.33] - 2026-03-12

### Fixed
- Unchecking all file, level, or source checkboxes now correctly shows zero entries
  - Previously an empty visibility set was treated as "no filter" and showed all entries

## [1.0.32] - 2026-03-12

### Fixed
- `bloombergBridgeService.log` and similar files now parse correctly
  - Added a second pattern to the "ISO Timestamp with Level and Process" parser for the unbracketed-source variant: `[ISO] [LEVEL] [PROCESS_ID] source - message`
  - Previously only the bracketed-source form `[ISO] [LEVEL] [PROCESS_ID] [SOURCE] - message` was handled

## [1.0.31] - 2026-03-12

### Changed
- Project renamed from "Log Reader" to "Full View"
  - Updated page title, app header, and package name

## [1.0.30] - 2026-03-12

### Added
- Log Files panel: each file now has an × button to remove it
  - Removes the file entry from the panel and all associated log entries from the table

## [1.0.29] - 2026-03-12

### Added
- New parser "ISO Timestamp with Level and Process" for logs with the format `[ISO] [LEVEL] [PROCESS_ID] [SOURCE] - message`
  - Covers files like `GssDesktopManager.log` which include a bracketed process/thread ID between the level and source

## [1.0.28] - 2026-03-12

### Added
- Double-clicking an expanded long message now collapses it back to the preview

## [1.0.27] - 2026-03-12

### Added
- Long log messages are now collapsed to a 300-character preview by default
  - A "show more" button reveals the full message inline
  - A "show less" button collapses it again
  - JSON expansion (existing feature) is still available after expanding a long message

## [1.0.26] - 2026-03-12

### Fixed
- Log Files panel: checkbox now sits to the left of the filename and parser name
  - Added missing `.file-checkbox` flex layout (was unstyled, causing vertical stacking)
  - Checkbox is top-aligned with the filename so it doesn't drift when the parser name wraps

## [1.0.25] - 2026-03-12

### Changed
- Date Range and Message Length are now grouped under a collapsible "Summary" section
  - Collapsed and expanded with a single toggle, consistent with Log Levels and Logging Sources
  - Expanded by default

## [1.0.24] - 2026-03-12

### Changed
- Date range in Statistics panel now renders on a single line (`min → max`)

## [1.0.23] - 2026-03-12

### Added
- Column order and widths now persist across page reloads via localStorage
  - Stored under the `log-reader-columns` key alongside existing filter/sort preferences
  - Added `saveColumnPreferences()` and `loadColumnPreferences()` to `statistics.ts`
  - On load, any columns missing from the saved order are appended at the end (forward-compatible)

## [1.0.22] - 2026-03-12

### Added
- Drag-to-reorder columns in the log entries table
  - Drag any column header to a new position; a blue left-border indicates the drop target
  - Column order persists for the session
  - Resize handles remain functional and do not interfere with drag-to-reorder

## [1.0.21] - 2026-03-12

### Added
- Resizable columns in the log entries table
  - Each column header has a drag handle on its right edge (visible on hover as a blue bar)
  - Drag the handle to resize that column; minimum width is 60px
  - Resizing does not interfere with column sort (clicks on the handle are absorbed)
  - Table uses fixed layout so column widths are respected

## [1.0.20] - 2026-03-12

### Added
- Source column in the log entries table
  - Displays `entry.source` (the component/module name) between the File and Message columns
  - Sortable by clicking the column header
  - Search highlighting applies to source values
  - Styled in muted color to visually distinguish from the filename

## [1.0.19] - 2026-03-12

### Changed
- Moved source visibility checkboxes into the Statistics panel
  - Each row in the "Logging Sources" section now has a checkbox to show/hide that source
  - Checking/unchecking immediately filters entries in the log table
  - Sources are sorted by entry count (descending); unchecked sources show a count of 0
  - Removed the standalone Sources panel from the sidebar

## [1.0.18] - 2026-03-12

### Added
- Sources panel in sidebar with per-source visibility checkboxes
  - New `SourceSelector` component listing all unique `source` values found in loaded entries
  - All sources are checked (visible) by default
  - Unchecking a source hides all entries with that source from the log table
  - Sources are sorted alphabetically
  - Empty state message shown when no entries are loaded

## [1.0.17] - 2026-03-12

### Changed
- File selector now always shows a parser label beneath each filename
  - Displays the matched parser name (e.g. "FEA log") when one was found
  - Displays "no parser found" when no parser matched any entry in that file

## [1.0.16] - 2026-03-12

### Changed
- Moved parser name display from the log entries table to the file selector in the sidebar
  - Parser name now appears as a small subtitle beneath each filename checkbox
  - Removed parser subtitle from the File column in the entries table

## [1.0.15] - 2026-03-12

### Added
- Parser name display in the File column
  - Each log entry now shows the name of the parser that matched it (e.g. "FEA log", "Generic Bracketed")
  - Parser name appears as a small subtitle below the filename in the File column
  - Entries that fall through to the raw fallback show no parser label

### Changed
- `LogEntry` interface now includes an optional `parser` field
- `parseLogLine()` populates `parser` with the matched `ParserConfig.name`

## [1.0.14] - 2026-03-12

### Changed
- Search bar now highlights matches instead of filtering
  - All matching text is highlighted in amber across all columns (Timestamp, Level, File, Message)
  - Log entries are no longer hidden when a search query is entered
  - Highlighting applies to plain message text and to the text before/after inline JSON blobs

### Changed
- Regex toggle (`.*` button) now controls search highlighting mode
  - When active, the search query is treated as a regular expression
  - When inactive, the query is matched as a plain text string (special characters are escaped)
  - Invalid regex patterns are indicated with a red border and error message

## [1.0.12] - 2026-03-12

### Added
- Global file visibility controls with checkboxes
  - New `FileSelector` component with checkboxes for each uploaded file
  - All files are checked by default when uploaded
  - Unchecking a file hides all log entries from that file
  - Files are sorted alphabetically in the selector

### Added
- File visibility state management
  - `availableFiles` and `displayFiles` state in App.tsx
  - Files are automatically tracked when entries are uploaded
  - File visibility filtering integrated into main filtering pipeline

### Changed
- File filtering moved from filter-specific to global controls
  - Removed file filter buttons from individual filters
  - File selection now works globally across all entries
  - More intuitive UX - check/uncheck files to show/hide them

### Added
- `FileSelector` component with consistent styling
  - Matches `LevelSelector` design and behavior
  - Checkboxes with file names and hover tooltips
  - Empty state message when no files are loaded

## [1.0.11] - 2026-03-12

### Added
- File name filtering capability
  - Users can now filter log entries by their source file/filename
  - File filter buttons appear in the filter panel when files are available
  - Multiple files can be selected to show entries from those files only
  - Truncated file names with hover tooltips for long filenames
  - Styled with consistent theme (cyan/info color when active)

### Added
- `fileFilters` array to FilterConfig interface
  - Each filter now tracks selected filenames
  - Empty fileFilters array means all files are included (no filtering)

### Changed
- FilterPanel now receives `availableFiles` prop with list of all unique filenames in current logs
- File filtering logic integrated into App.tsx filtering pipeline
- Added `.filter-files` and `.file-btn` CSS classes for styling file filter buttons

## [1.0.10] - 2026-03-12

### Added
- ZIP file support for compressed log collections
  - Users can upload `.zip` files containing JSON log files
  - Automatically extracts and parses all JSON files in the archive
  - Skips `log_state.json` file (as specified)
  - Supports both single JSON objects and arrays of objects per file
  - Each JSON file contributes its filename to the "File" column

### Added
- `processZipFile()` function in FileUploader component
  - Uses jszip library for ZIP extraction
  - Handles flexible JSON formats with fallback field mapping:
    - `timestamp` or defaults to current date
    - `level` / `severity` field for log level (defaults to 'info')
    - `source` / `component` field for source (defaults to filename)
    - `message` / `msg` field for message content
    - Full JSON object stored as metadata for inspection

### Changed
- FileUploader now accepts `.zip` files in addition to `.log` and `.txt`
- Updated file input `accept` attribute to include `application/zip`

### Dependencies
- Added `jszip` package for ZIP file processing

## [1.0.9] - 2026-03-11

### Changed
- Reordered log levels in StatisticsPanel by severity
  - Error → Warn → Info → Log → Debug (from highest to lowest severity)
  - Changed sorting from by-count to by-severity hierarchy

## [1.0.8] - 2026-03-11

### Changed
- Reordered log levels throughout the application
  - LevelSelector checkboxes now display severity-ordered levels
  - FilterPanel level buttons now display severity-ordered levels
  - Order: error > warn > info > log > debug (most to least severe)

### Added
- Level normalization function to strip trailing hyphens/underscores from log levels
  - "log-" now correctly displays as "log"
  - Handles any similar malformed level names automatically

### Changed
- Updated `parseLogLine()` to normalize all log levels via new `normalizeLevel()` function

## [1.0.6] - 2026-03-11

### Added
- JSON expansion feature in log message cells
  - Automatically detects JSON objects and arrays within log messages
  - Displays expandable/collapsible toggle arrow (▶/▼) next to messages with JSON
  - JSON defaults to collapsed state
  - Supports nested JSON rendering with proper indentation
  - Click arrow to expand/collapse formatted JSON inline

### Added
- `MessageCell` component for intelligent message rendering
  - Extracts and detects JSON in log messages
  - Renders JSON with syntax highlighting
  - Preserves text before and after JSON content
  - Recursive JSON tree renderer for nested structures

### Added
- CSS styling for JSON expansion feature
  - `.message-json`, `.json-toggle`, `.json-tree`, `.json-node`, `.json-primitive` classes
  - Monospace font for JSON display
  - Color-coded primitives via `--info` color variable

## [1.0.5] - 2026-03-11

### Added
- Multi-line log entry support
  - Entries spanning multiple lines are now merged into single entries
  - Only lines starting with a timestamp are treated as new entries
  - Continuation lines are appended to the current entry

### Changed
- Rewrote `parseLogContent()` to detect entry start lines
  - Added `isStartLine()` helper function that checks if a line matches any parser pattern
  - Builds a buffer of lines that belong to the same entry
  - Merges continuation lines before passing to `parseLogLine()`

### Changed
- Updated all parser regex patterns to support multi-line message content
  - Changed message capture groups from `.*` to `[\s\S]*` to match newlines
  - Affects: `fea.ts`, `isoWithLevel.ts`, `bracketedWithId.ts`, `genericBracketed.ts`

## [1.0.4] - 2026-03-11

### Renamed
- Parser file `src/lib/parsers/isoWithTimezone.ts` → `src/lib/parsers/fea.ts`
- Export constant `isoWithTimezone` → `fea`
- Parser name updated to "FEA log" with improved description

### Changed
- Updated `src/lib/parser.ts` imports to reference new `fea` parser
- Updated `PARSER_CONFIGS` array to use `fea` instead of `isoWithTimezone`

## [1.0.3] - 2026-03-11

### Added
- Documentation comments to each parser file
  - Each parser now lists the sample log file(s) used to derive its patterns
  - `isoWithLevel.ts`: application.log, gw.log
  - `isoWithTimezone.ts`: FEA-2026-03-10.log and similar FEA logs
  - `bracketedWithId.ts`: bridge.log
  - `ncsa.ts`: Generic Apache/Nginx format (informational note)
  - `json.ts`: Generic JSON lines format (informational note)
  - `finsembleJson.ts`: Finsemble structure format (informational note)
  - `genericBracketed.ts`: Fallback for remaining sample logs

## [1.0.2] - 2026-03-11

### Changed
- Modularized parser infrastructure
  - Split monolithic `parser.ts` into separate format-specific files under `src/lib/parsers/`
  - Created individual parser modules:
    - `isoWithLevel.ts`: ISO 8601 timestamps with levels
    - `isoWithTimezone.ts`: ISO timestamps with timezone offsets
    - `bracketedWithId.ts`: Bracketed format with thread IDs
    - `ncsa.ts`: NCSA/Apache access log format
    - `json.ts`: JSON log format
    - `finsembleJson.ts`: Finsemble combined JSON format
    - `genericBracketed.ts`: Generic bracketed timestamp format
  - Main `parser.ts` now imports and aggregates all parsers

### Changed
- Filename propagation improved
  - Parser infrastructure now cleanly passes filename through all parsing functions
  - Filename appears in the "File" column for all entries
  - Works correctly in fallback parsing cases

## [1.0.1] - 2026-03-10

### Added
- Header version display
  - App title now shows current version from package.json
  - Version displayed in top-right corner of the application

### Added
- Automatic version patching on changes
  - Version is manually bumped (patch increment) for each set of changes
  - Synchronized between package.json and displayed version

### Added
- `LevelSelector` component for filtering by log levels
  - Checkboxes for each log level (debug, info, warn, error, log, etc.)
  - Enable/disable to show/hide entries at specific levels
  - State managed through parent App component

### Changed
- Multi-file upload support
  - File uploader now allows selecting multiple files
  - All files parsed and merged into single log view
  - Filename tracked for each entry in the "File" column

### Changed
- FileUploader component updated to handle arrays of files
- LogTable now displays filename (or source if no filename)
- FilterPanel and SearchBar updated to filter/search across multiple files

### Added
- Level filtering to search and filter pipeline
  - Entries filtered by selected levels in addition to regex and text search
  - LevelSelector state integrated into main filtering logic

## [1.0.0] - 2026-03-09

### Added
- Initial project setup with React 18, TypeScript, and Vite
- Core application shell with `App.tsx` main component

### Added
- Custom CSS with modern design
  - Dark/light theme support via CSS variables
  - Responsive layout for desktop and tablet
  - Professional typography and spacing
  - Color-coded log levels

### Added
- File upload component (`FileUploader.tsx`)
  - Drag-and-drop file upload area
  - File input button
  - Visual feedback for upload state

### Added
- Multi-format log parser (`parser.ts`)
  - Regex-based pattern matching for 7 different log formats:
    - ISO 8601 timestamps with levels
    - ISO timestamps with timezone
    - Bracketed format with thread IDs
    - NCSA/Apache access logs
    - JSON logs
    - Finsemble JSON format
    - Generic bracketed format as fallback
  - Automatic format detection and parsing
  - Fallback parser for unmatched lines

### Added
- Log entry data model
  - `LogEntry` interface with: id, timestamp, level, source, filename, message, raw, metadata
  - Normalized timestamp as Date object
  - Lowercase log levels

### Added
- Log table display component (`LogTable.tsx`)
  - Columns: Timestamp, Level, File, Message
  - Sortable columns (click to toggle direction)
  - Sort preference persistence
  - Color-coded level badges
  - Entry count display

### Added
- Filter panel component (`FilterPanel.tsx`)
  - Include regex filter (show matching entries)
  - Exclude regex filter (hide matching entries)
  - Named filter management with local storage
  - Save, load, delete filter configs
  - Real-time filter application

### Added
- Search bar component (`SearchBar.tsx`)
  - Text/regex search across all message content
  - Case-sensitive toggle
  - Real-time search results
  - Regex error handling with user feedback

### Added
- Statistics panel component (`StatisticsPanel.tsx`)
  - Entry count by log level
  - Entry count by source file
  - Visual summary of log composition

### Added
- Export functionality
  - Export filtered/searched logs as JSON
  - Includes all entry metadata
  - Download button in header

### Added
- Persistent configuration via localStorage
  - Filter configurations auto-saved
  - Active filter selection remembered
  - Sort preferences persisted
  - Settings restored on app reload

### Added
- Sample log files for testing
  - Various format examples in `sample-logs/` directory
  - Includes real-world log formats from different sources

## Future Roadmap

- [ ] Syntax highlighting for code blocks in messages
- [ ] Side-by-side comparison of two log files
- [ ] Real-time log streaming from file or socket
- [ ] Advanced statistics (histogram of entries over time)
- [ ] Plugin system for custom parsers
- [ ] Session management (save/load log analysis sessions)
