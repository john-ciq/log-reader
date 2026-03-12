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
- **Resizable Columns**: Drag the right edge of any column header to resize it
- **Drag-to-Reorder Columns**: Drag any column header to a new position
- **Sortable Columns**: Click any column header to sort ascending/descending
- **Persistent Layout**: Column widths, order, and sort preference are saved in `localStorage` and restored on reload
- **Color-Coded Level Badges**: Each log level is visually distinguished with a color badge

### Message Display
- **Long Message Preview**: Messages over 300 characters are collapsed to a preview by default
  - Click "show more" to expand; click "show less" or double-click the message to collapse
- **Inline JSON Expansion**: Messages containing JSON display a ▶/▼ toggle to view formatted, nested JSON inline

### Filtering & Visibility
- **Multiple Named Filters**: Create, name, reorder, duplicate, and enable/disable any number of filter configurations; all settings persist via `localStorage`
- **Cascading Evaluation**: Enabled filters are evaluated in order; the first filter that has an opinion about an entry wins (include or exclude); if no filter claims the entry it is shown by default
- **Include Regex**: If an include pattern matches an entry, the entry is immediately included and no further filters are checked
- **Exclude Regex**: If an exclude pattern matches an entry, the entry is immediately excluded and no further filters are checked
- **Filter Reordering**: Drag filter cards to reorder them, or use the ↑/↓ buttons
- **Level Checkboxes**: Show/hide entries by log level (error, warn, info, log, debug, etc.)
- **File Checkboxes**: Show/hide entries by source file; uncheck a file to hide all its entries
- **Source Checkboxes**: Show/hide entries by logging source (component/module name), accessible in the Statistics panel
- **Remove File**: Each file in the Log Files panel has an × button to permanently remove it and all its entries

### Search
- **Inline Highlighting**: Search highlights all matches across all columns without hiding non-matching entries
- **Plain Text or Regex**: Toggle the `.*` button to switch between literal and regex search
- **Real-Time**: Highlights update as you type

### Statistics Panel
- **Collapsible Sections**: Summary, Log Levels, and Logging Sources each collapse independently
- **Summary**: Date range (min → max) and message length statistics (min/avg/max)
- **Log Levels**: Entry count per level with a proportional bar, sorted by severity
- **Logging Sources**: Entry count per source with a proportional bar; each row has a checkbox to show/hide that source

### Export
- **Export Filtered**: Download all currently visible (filtered) entries as a JSON file
- **Export All**: Download every loaded entry regardless of active filters as a JSON file

### Persistence
All of the following are saved in browser `localStorage` and restored on reload:
- Named filter configurations including enabled/disabled state for each filter
- Hidden levels and hidden sources (unchecked items are remembered)
- Search query and regex toggle state
- Sort column and direction
- Column widths and order

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
   - Multiple filters can be active at once — they are evaluated in order, first match wins
   - Each filter can have Include patterns (force include), Exclude patterns (force exclude), and level/file criteria
   - Drag filter cards or use ↑/↓ buttons to change evaluation order
   - Toggle levels with the level checkboxes
   - Toggle files with the file checkboxes in the Log Files panel
   - Toggle sources with the checkboxes in the Statistics panel → Logging Sources
4. **Search**: Type in the search bar to highlight matching text; enable `.*` for regex
5. **Expand Messages**: Click "show more" on truncated messages; click ▶ to expand inline JSON
6. **Resize/Reorder Columns**: Drag column edges to resize; drag column headers to reorder
7. **Export**: Click "Export Filtered" or "Export All" in the Statistics panel header to download entries as JSON

---

## Project Structure

```
src/
├── components/
│   ├── App.tsx                 # Main app component and state management
│   ├── FileSelector.tsx        # Log Files panel with visibility and remove controls
│   ├── FileUploader.tsx        # File input and drag-and-drop handler
│   ├── FilterPanel.tsx         # Named filter UI (include/exclude regex, level/file filters)
│   ├── LogTable.tsx            # Log entry table with sort, resize, and reorder
│   ├── MessageCell.tsx         # Message preview, expansion, and inline JSON rendering
│   ├── SearchBar.tsx           # Search input with regex toggle
│   ├── StatisticsPanel.tsx     # Statistics display with source visibility controls
│   └── LevelSelector.tsx       # Level checkbox filters
├── lib/
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
└── main.tsx                    # Entry point
package.json
vite.config.ts
tsconfig.json
```

---

## Architecture

### Log Parsing Pipeline

1. **File Upload**: User uploads one or more `.log`, `.txt`, or `.zip` files
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

---

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

Requires ES2020+ and React 18+.

---

## License

MIT
