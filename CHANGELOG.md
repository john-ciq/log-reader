# Changelog

All notable changes to the Log Reader project will be documented in this file.

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
