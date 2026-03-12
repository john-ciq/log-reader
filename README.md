# Log Reader

A modern, browser-based log file analyzer with flexible parsing, filtering, searching, and export capabilities.

## Features

- **Multi-Format Parsing**: Automatically detects and parses logs in multiple formats:
  - ISO timestamps with levels (`[2026-02-26T11:11:59.893] [INFO]`)
  - FEA logs with timezone (`[2026-03-10 12:00:28.127-04:00] [debug]`)
  - Bracketed format with IDs (`[2026-02-26 11:12:01,480] [1] [INFO]`)
  - NCSA/Apache access logs
  - JSON-based logs
  - Finsemble JSON format
  - Generic bracketed format as fallback

- **Multi-Line Entry Support**: Automatically merges continuation lines so that log entries spanning multiple lines are treated as a single entry

- **JSON Expansion**: Log entries containing JSON data display an expandable arrow (▶/▼) allowing you to view formatted, nested JSON inline

- **Advanced Filtering**:
  - Include regex: Show only entries matching a pattern
  - Exclude regex: Hide entries matching a pattern
  - Named filters: Save and reuse filter configurations locally
  - Level checkboxes: Filter by log levels (debug, info, warn, error, log, etc.)
  - File selection: Filter by source file name

- **Search & Navigation**:
  - Global search across all messages
  - Plain text or regex-based search
  - Case-sensitive toggle
  - Results highlighted in context

- **Sorting**: Click column headers to sort by timestamp, level, file, or message

- **Statistics**: View entry counts by level and per file

- **Multi-File Upload**: Load and analyze multiple log files at once with filename tracking in the "File" column

- **ZIP Archive Support**: Upload `.zip` files containing JSON log files
  - Automatically extracts and parses all JSON files inside (except `log_state.json`)
  - Supports flexible JSON formats with automatic field mapping (timestamp, level, message, source, etc.)
  - Preserves filename from the ZIP archive in the "File" column

- **Export**: Download filtered/searched results as JSON

- **Persistent Configuration**: All filters, active filter selections, and sort preferences are saved in browser localStorage and restored on reload

- **Modern UI**: Dark/light theme support, responsive design, clean typography

## Installation & Setup

### Prerequisites
- Node.js 18+ and npm

### Development

1. Clone or navigate to the project directory
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   This opens the app at `http://localhost:5173` in your browser

### Production Build

```bash
npm run build
```

Output is in the `dist/` folder. Serve it with any static HTTP server.

### Preview Built App

```bash
npm run preview
```

## Usage

1. **Upload Log Files**: Click the file upload area to select one or more log files (or ZIP archives)
   - Supports `.log`, `.txt`, and `.zip` files
   - For ZIP files, all JSON files will be extracted and parsed automatically
2. **View Logs**: Entries appear in the table with timestamp, level, source file, and message
3. **Filter**:
   - Enter regex patterns in the "Include" and "Exclude" fields
   - Click "Apply Filter" or use the checkboxes below to enable/disable
   - Select specific levels with the level checkboxes
4. **Search**: Type a search term in the search bar (use `/pattern/` for regex)
5. **Expand JSON**: Click the ▶ arrow next to messages containing JSON to view formatted data
6. **Sort**: Click column headers to reorder entries
7. **Export**: Click "Export JSON" to download filtered results

## Project Structure

```
src/
├── components/
│   ├── App.tsx                 # Main app component
│   ├── FileUploader.tsx        # File input handler
│   ├── FilterPanel.tsx         # Filter UI
│   ├── LogTable.tsx            # Log entry table
│   ├── MessageCell.tsx         # Message with JSON expansion
│   ├── SearchBar.tsx           # Search input
│   ├── StatisticsPanel.tsx     # Statistics display
│   └── LevelSelector.tsx       # Level checkbox filters
├── lib/
│   ├── parser.ts              # Main parser & log entry types
│   ├── parsers/               # Individual format parsers
│   │   ├── fea.ts
│   │   ├── isoWithLevel.ts
│   │   ├── isoWithTimezone.ts
│   │   ├── bracketedWithId.ts
│   │   ├── ncsa.ts
│   │   ├── json.ts
│   │   ├── finsembleJson.ts
│   │   └── genericBracketed.ts
│   └── statistics.ts          # Statistics & persistence utilities
├── index.css                   # Global styles & theme
└── main.tsx                    # Entry point

package.json                    # Dependencies & scripts
vite.config.ts                  # Vite build configuration
tsconfig.json                   # TypeScript configuration
```

## Architecture

### Log Parsing Pipeline

1. **File Upload**: User uploads one or more log files
2. **Content Extraction**: Files are read as text via the File API
3. **Multi-Line Merging**: Raw content is processed to merge continuation lines (lines that don't start with a timestamp)
4. **Format Detection**: Each line/entry is tested against all parser patterns in order
5. **Parsing**: When a match is found, the parser extracts timestamp, level, source, and message
6. **Normalization**: Log levels are normalized (e.g., "log-" → "log")
7. **Storage**: Parsed entries are stored in React state with unique IDs

### Component Flow

```
App (state management)
├── FileUploader → parseLogContent()
├── FilterPanel → applies regex filters
├── LevelSelector → filters by log level
├── SearchBar → global message search
├── LogTable → displays sorted entries
│   └── MessageCell → renders message + expandable JSON
└── StatisticsPanel → counts entries by level/file
```

### Data Model

```typescript
interface LogEntry {
  id: string;           // Unique identifier
  timestamp: Date;      // Parsed timestamp
  level: string;        // log, debug, info, warn, error, etc.
  source: string;       // Component/module name
  filename?: string;    // Source file name
  message: string;      // Full message content
  raw: string;          // Original unparsed line
  metadata?: Record<string, unknown>; // Additional context
}
```

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

Requires modern ES2020+ JavaScript and React 18+.

## Local Storage

The app saves to browser `localStorage`:
- **Filters**: Named filter configurations
- **Active Filter**: Currently selected filter
- **Sort Preference**: Last sort column and direction

Clear localStorage to reset all preferences.

## Tips & Tricks

- **Quick Filter**: Use simple words for plain-text matches; wrap in `/pattern/` for regex
- **JSON Expansion**: Nested JSON renders with indentation; click arrows to collapse/expand
- **Large Files**: The app can handle logs with thousands of entries; sorting and filtering remain responsive
- **Multiline Logs**: All log lines are automatically merged; no special handling needed
- **Level Normalization**: Levels with trailing hyphens (e.g., "log-") are automatically cleaned to "log"

## Development Notes

- Built with **React 18**, **TypeScript**, and **Vite**
- No backend required; everything runs in the browser
- Uses the File API for local file reading
- CSS uses custom properties for theming
- Regex patterns are defined per-format in `src/lib/parsers/`

### Adding a New Log Format

1. Create a new file in `src/lib/parsers/myFormat.ts`:
   ```typescript
   import type { ParserConfig } from '../parser';

   export const myFormat: ParserConfig = {
     name: 'My Format',
     description: 'Description of the format',
     patterns: [
       /^your regex pattern$/,
     ],
     format: (match) => ({
       timestamp: new Date(match[1]),
       level: match[2].toLowerCase(),
       source: match[3],
       message: match[4],
     }),
   };
   ```

2. Import and add to `PARSER_CONFIGS` in `src/lib/parser.ts`

3. Add a comment at the top of the parser file noting which sample log files were used to derive it

## License

MIT

## Version

1.0.10

## Contact

For issues or suggestions, refer to the project repository.
