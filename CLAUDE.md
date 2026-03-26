# CLAUDE.md — Full View (log-reader)

## Project Overview

**Full View** (`full-view`) is a web-based log file analyzer built with React + TypeScript + Vite. It supports flexible log parsing, filtering, search, and export. The app runs entirely in the browser (no backend).

There is also a small CLI tool (`cli/filter.ts`, exposed as `fv`) for command-line log filtering.

## Tech Stack

- React 18 + TypeScript 5
- Vite 5 (build tool, dev server, PWA plugin)
- Vitest (tests)
- No UI component library — all components are custom

## Key Source Structure

```
src/
  App.tsx               # Root component — all state lives here
  lib/
    parser.ts           # parseLogLine / parseLogContent, PARSER_CONFIGS
    parsers/            # Individual parser modules (isoWithLevel, fea, gilding, etc.)
    filters.ts          # FilterConfig type, getFilterDecision, migrateFilter
    features.ts         # Feature flag definitions and localStorage persistence
    FeaturesContext.tsx # React context for feature flags
    statistics.ts       # localStorage helpers (filters, levels, sources, time range, presets)
    utils.ts            # Shared utilities
    theme.ts            # Theme helpers
  components/           # All UI components
cli/
  filter.ts             # CLI entrypoint
  bin.cjs               # Compiled CLI binary
sample-logs/            # Sample log files for testing parsers
```

## Important Conventions

### Adding a New Parser
1. Create `src/lib/parsers/<name>.ts` exporting a `ParserConfig` object.
2. Import and add it to the `PARSER_CONFIGS` array in `src/lib/parser.ts`.
3. Parser order matters — more specific parsers should come before generic ones.

### Feature Flags
Features are defined in `src/lib/features.ts` as `featureDefinitions`. Set `visible: false` to hide a feature from the UI without removing it. Feature state is read from `FeaturesContext` via `useFeatures()`.

### State Persistence
All persistence goes through helpers in `src/lib/storage.ts` (storage API). Do not call `localStorage` directly from components, use the default BrowserStorage in local-storage.ts.

### Filter Logic
Filters use an "include/exclude" mode. An entry passes if it matches **any** enabled filter. The `getFilterDecision` function in `filters.ts` returns `true`, `false`, or `null` (no opinion).

## Development Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run test         # Run tests (vitest)
npm run type-check   # TypeScript type check (no emit)
npm run lint         # ESLint
npm run cli          # Run CLI via tsx
```

## Versioning

Only bump the version in `package.json` and add a `CHANGELOG.md` entry when **explicitly asked**. Do not do this automatically after code changes.
