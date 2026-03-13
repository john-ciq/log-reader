# Full View

A modern, browser-based log file analyzer with flexible parsing, filtering, searching, and export capabilities.

## Features

### Parsing
- **Multi-Format Parsing**: Automatically detects and parses logs in 9 formats:
  - ISO timestamp with level: `[2026-02-26T11:11:59.893] [INFO] source - message`
  - ISO timestamp with level and process ID: `[2026-02-26T11:12:42.856] [WARN] [13760_15] [Source] - message`
  - FEA logs with timezone offset: `[2026-03-10 12:00:28.127-04:00] [debug] source - message`
  - Bracketed format with thread ID: `[2026-02-26 11:12:01,480] [1] [INFO] Component - message`
  - ICG Desktop Native Bridge: `2026-02-18 00:00:45.580 -05:00 [INF] tid:25 Source - message`
  - NCSA/Apache access log format
  - JSON log lines
  - Finsemble JSON format
  - Generic bracketed format (fallback)
- **Parser Name Display**: Each file in the Log Files panel shows which parser was matched, or "no parser found" if none matched
- **Multi-Line Entry Support**: Continuation lines (stack traces, wrapped messages) are automatically merged into their parent entry
- **ZIP Archive Support**: Upload `.zip` files; all JSON files inside are extracted and parsed automatically

### Log Table
- **Columns**: Timestamp, Level, File, Source, Message
- **Sortable Columns**: Click any column header to sort ascending/descending; click again to reverse
- **Resizable Columns**: Drag the right edge of any column header to resize it
- **Drag-to-Reorder Columns**: Drag any column header to a new position
- **Collapsible Columns**: Click the `‹` button on any column header to collapse it to a narrow strip; click `›` to restore
- **Persistent Layout**: Column widths, order, sort preference, and collapsed state are saved in `localStorage` and restored on reload
- **Color-Coded Level Badges**: Each log level is visually distinguished with a color badge
- **Virtual Scrolling**: Only visible rows are rendered, keeping the table performant with very large log files

### Message Display
- **Long Message Preview**: Messages over 300 characters are collapsed to a preview by default; click "show more" to expand, "show less" or double-click to collapse
- **Inline JSON Expansion**: Messages containing JSON display a ▶/▼ toggle to view formatted, nested JSON inline
- **JSON Preview**: When JSON is collapsed, the first 35 characters of the compact JSON are shown inline next to the toggle arrow

### Filtering & Visibility
- **Multiple Named Filters**: Create, name, enable/disable, duplicate, and reorder any number of filter configurations; all settings persist via `localStorage`
- **Cascading Evaluation**: Enabled filters are evaluated in order; the first filter that has an opinion about an entry wins (include or exclude); if no filter claims the entry it is shown by default
- **Include/Exclude Patterns**: Each filter supports one or more include regex patterns (force include) and/or exclude regex patterns (force exclude)
- **Level Filters** *(requires advancedFilters feature)*: Select which log levels a filter applies to
- **File Filters** *(requires advancedFilters feature)*: Select which source files a filter applies to
- **Filter Reordering**: Drag filter cards (⠿ handle) to reorder them, or use the ↑/↓ buttons
- **Filter Import/Export**: Export all filters and the current search configuration to a JSON file; import a previously exported file to restore them — buttons appear in the "Filters & Search" heading
- **Level Checkboxes**: Show/hide all entries for a given log level globally
- **File Checkboxes**: Show/hide all entries from a specific source file
- **Source Checkboxes**: Show/hide all entries from a specific logging source (component/module name); accessible in the Statistics panel → Logging Sources
- **Remove File**: Each file in the Log Files panel has an × button to permanently remove it and all its entries

### Search
- **Inline Highlighting**: Search highlights all matches across all visible columns without hiding non-matching entries
- **Plain Text or Regex**: Toggle the `.*` button to switch between literal and regex search
- **Real-Time**: Highlights update as you type
- **Persistent**: Search query and regex toggle are saved and restored on reload

### Statistics Panel
- **Collapsible**: The entire panel can be collapsed; each sub-section (Summary, Log Levels, Logging Sources) also collapses independently; all states persist on reload
- **Entry Counts**: Shows total entries loaded and the number currently visible after filters
- **Summary**: Date range (min → max) and message length statistics (min/avg/max)
- **Log Levels**: Entry count per level with a proportional bar, sorted by severity
- **Logging Sources**: Scrollable list of logging sources, each with:
  - A checkbox to show/hide that source's entries
  - An entry count with a proportional bar
  - Label truncated at 35 characters; hover to see the full name
  - A text filter to search sources by name
  - Sort buttons: **A–Z** (alphabetical) or **#** (by count descending)
  - Filter text and sort order persist on reload

### Raw File Viewer
- **Tabbed View**: Uploaded files open as tabs alongside the main Log Viewer tab
- **Sub-Tabs**: ZIP archives open a tab with sub-tabs for each file inside
- **Drag-to-Reorder**: Tabs and sub-tabs can be reordered by dragging
- **JSON Pretty-Print**: Valid JSON files are automatically pretty-printed for readability
- **Close Tabs**: Each tab has an × button to close it

### Export
- **Export Filtered**: Download all currently visible (filtered) entries as a JSON file
- **Export All**: Download every loaded entry regardless of active filters as a JSON file
- **Export Config**: Save all filter configurations and the current search state to a JSON file for later reuse
- **Import Config**: Restore filters and search state from a previously exported config file

### Feature Flags
- Click the **⚙** button in the top-right corner of the header to open the Features panel
- Features can be toggled on or off at runtime without editing code or reloading
- Selections persist across page loads via `localStorage`
- Available features:
  - **autoSizeColumns**: Auto-sizes the Timestamp and Level columns to fit their content when entries are loaded (default: off)
  - **advancedFilters**: Shows the "Log Levels" and "Log Files" filter sections in the filter panel (default: off)

### Persistence
All of the following are saved in browser `localStorage` and restored on reload:
- Named filter configurations including enabled/disabled state
- Hidden levels and hidden sources (unchecked items are remembered)
- Search query and regex toggle
- Sort column and direction
- Column widths, order, and collapsed state
- Statistics panel and sub-section collapse state
- Logging Sources filter text and sort order
- Feature flag overrides
- Sidebar collapsed state
- Filter panel collapsed state
- Expanded/collapsed state of individual filter cards

---

## Installation & Setup

### Prerequisites
- Node.js 18+ and npm

### Development

```bash
npm install
npm run dev
```

Opens the app at `http://localhost:3000`.

### Production Build

```bash
npm run build
```

Output goes to `dist/`. Serve with any static HTTP server.

### Preview Built App

```bash
npm run preview
```

---

## Usage

1. **Upload Log Files**: Click the upload area or drag files onto it
   - Accepts `.log`, `.txt`, `.json`, and `.zip` files
   - Multiple files can be uploaded at once; entries from all files are merged into one view
2. **View Logs**: Entries appear in the table with timestamp, level, file, source, and message
3. **Filter**:
   - Create named filters in the Filters & Search panel; check a filter's checkbox to enable it
   - Multiple filters can be active simultaneously — they are evaluated in order, first match wins
   - Each filter supports include/exclude regex patterns
   - Drag filter cards (⠿) or use ↑/↓ buttons to change evaluation order
   - Toggle levels with the level checkboxes in the sidebar
   - Toggle files with the file checkboxes in the Log Files panel
   - Toggle sources with the checkboxes in Statistics → Logging Sources
4. **Search**: Type in the search bar to highlight matching text; enable `.*` for regex search
5. **Expand Messages**: Click "show more" on truncated messages; click ▶ to expand inline JSON
6. **Resize/Reorder/Collapse Columns**: Drag column edges to resize; drag headers to reorder; click `‹` to collapse a column
7. **Export**: Click "Export Filtered" or "Export All" in the Statistics panel to download entries as JSON
8. **Features**: Click ⚙ in the header to toggle feature flags on or off

---

## Project Structure

```
src/
├── App.tsx                     # Main app component and state management
├── components/
│   ├── FeaturesPanel.tsx       # Feature flags toggle modal
│   ├── FileSelector.tsx        # Log Files panel with visibility and remove controls
│   ├── FileUploader.tsx        # File input and drag-and-drop handler
│   ├── FilterPanel.tsx         # Named filter UI (include/exclude regex, level/file filters)
│   ├── LevelSelector.tsx       # Level checkbox filters
│   ├── LogTable.tsx            # Log entry table with sort, resize, reorder, and collapse
│   ├── MessageCell.tsx         # Message preview, expansion, and inline JSON rendering
│   ├── RawFileViewer.tsx       # Raw file content viewer with JSON pretty-print
│   ├── SearchBar.tsx           # Search input with regex toggle
│   └── StatisticsPanel.tsx     # Statistics display with source visibility controls
├── lib/
│   ├── features.ts             # Feature flag definitions, defaults, and localStorage helpers
│   ├── FeaturesContext.tsx     # React context and useFeatures() hook
│   ├── filters.ts              # Filter evaluation logic
│   ├── parser.ts               # Main parser orchestrator and LogEntry type
│   ├── parsers/
│   │   ├── isoWithLevel.ts
│   │   ├── isoWithLevelAndProcess.ts
│   │   ├── fea.ts
│   │   ├── bracketedWithId.ts
│   │   ├── ncsa.ts
│   │   ├── json.ts
│   │   ├── finsembleJson.ts
│   │   ├── icgDesktopNativeBridge.ts
│   │   └── genericBracketed.ts
│   └── statistics.ts           # Statistics calculation and localStorage utilities
├── index.css                   # Global styles and theme variables
└── main.tsx                    # Entry point (wraps app in FeaturesProvider)
package.json
vite.config.ts
tsconfig.json
```

---

## Architecture

### Log Parsing Pipeline

1. **File Upload**: User uploads one or more `.log`, `.txt`, `.json`, or `.zip` files
2. **Content Extraction**: Files are read as text via the File API; ZIP files are extracted with jszip
3. **Multi-Line Merging**: Raw content is processed to merge continuation lines into their parent entry
4. **Format Detection**: Each buffered entry is tested against all parser patterns in priority order
5. **Parsing**: The first matching parser extracts timestamp, level, source, and message
6. **Normalization**: Log levels are normalized (e.g., `"log-"` → `"log"`)
7. **Storage**: Parsed entries are stored in React state with unique IDs

### Data Model

```typescript
interface LogEntry {
  id: string;                          // Unique identifier
  timestamp: Date;                     // Parsed timestamp
  level: string;                       // debug, info, warn, error, log, etc.
  source: string;                      // Component/module name
  filename?: string;                   // Source file name
  parser?: string;                     // Name of the parser that matched
  message: string;                     // Full message content
  raw: string;                         // Original unparsed line
  metadata?: Record<string, unknown>;  // Additional context (e.g. thread ID)
}
```

### Adding a New Log Format

1. Create `src/lib/parsers/myFormat.ts`:
   ```typescript
   import type { ParserConfig } from '../parser';

   export const myFormat: ParserConfig = {
     name: 'My Format',
     description: 'Description of the format',
     patterns: [/^your regex pattern$/],
     format: (match) => ({
       timestamp: new Date(match[1]),
       level: match[2].toLowerCase(),
       source: match[3],
       message: match[4],
     }),
   };
   ```
2. Import and prepend to `PARSER_CONFIGS` in `src/lib/parser.ts` (more specific parsers should come before generic ones)
3. Note which sample log files were used to derive the pattern in the file's top comment

### Adding a New Feature Flag

1. Add the key to `FeatureKey` in `src/lib/features.ts`
2. Add a default value to `featureDefaults`
3. Add a description to `featureDescriptions` — this is the label shown in the Features panel
4. Use the flag in any component via `const { features } = useFeatures()`

---

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

Requires ES2020+ and React 18+.

---

## License

MIT
