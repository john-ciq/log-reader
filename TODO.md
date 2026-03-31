# TODO

## In Progress

- [ ]

## Planned

### Features
- [ ] Add source file line number(s) to the Entry Detail panel
- [ ] Normalize timestamps with respect to timezone info (implement a "timestamp resolver", as well)
- [ ] Add log entry transforms
- [ ] Allow table columns to be added or removed
- [ ] Create Electron/Tauri app
- [ ] Create a full suite of tests (unit tests, UI tests, e2e tests)
- [ ] Connect to Jira and append a support bundle to a case by JiraID

### Parsers
- [ ] Citi files (ICG_DESKTOP_BOOT_STRAP_20260218.log, ICG_DESKTOP_NATIVE_WATCHER_20260218.log)

### UI / UX
- [ ]

### CLI
- [ ]

## Bugs
- [ ] Highlight does not work when a the highlight text is set and then a log entry containing that text is expanded
- [ ] Some JSON logs (from splunk) do not parse the payload as json

## Done
- [x] No log entries to display - no table when no log entries
- [x] Add log entry annotations/comments
- [x] Support bundles are now ZIP files
- [x] Add the ability to star log entries
- [x] Add timestamp parsing for JSON log files (best-effort)
- [x] Auto-sync is now a feature (defaults to off) and a "sync now" button exists in the entry details panel
- [x] Auto expand JSON when "show more" is clicked
- [x] Persist log entry expanded state when the log entry leaves the virtual scroll window
- [x] Add a fixed "sequence" column, indexed by timestamp or current order
- [x] Add colors to filters
- [x] Support bundle (download + import)
- [x] Filter comments
- [x] Entry detail sidebar mode
- [x] Remove all filters button (feature-flagged)
- [x] Log density histogram with time range selection
- [x] Saved filter presets (save, apply, update, delete, import/export)
- [x] Time range filter with persistence toggle
- [x] Duplicate entry merging
- [x] Source visibility controls
- [x] Row detail panel with prev/next navigation
- [x] Convert search query to filter
- [x] Draggable tab reordering (top-level and sub-tabs)
- [x] Filter import/export (JSON config)
- [x] Collapsible sidebar and filters panel
- [x] ZIP file support (multiple logs in one upload)
