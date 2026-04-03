# TODO

## In Progress

- [ ]

## Planned

### Features
- [ ] Reorganize features / add a "log filters" section
- [ ] Order feature categories manually
- [ ] Add a shortcut (shift+?) to see keyboard shortcuts
- [ ] Add an "ONLY" button, which temporarily disables all other filters
- [ ] Add log entry transforms
- [ ] Add a module which can extract performance data from the logs (a "performance parser" - one for legacy and one for iocd)
- [ ] Enhance parser awareness
  - [ ] Each file should be parsed by a parser (instead of each line)
  - [ ] Parser configs should have "can parse" to identify if they can parse a file
  - [ ] Create a defacto default parser
  - [ ] Create better descriptions and names for the parsers
- [ ] Normalize timestamps with respect to timezone info (implement a "timestamp resolver", as well)
- [ ] Publish a support bundle as a gist
- [ ] Create Electron/Tauri app
- [ ] Create a full suite of tests (unit tests, UI tests, e2e tests)
- [ ] Connect to Jira and append a support bundle to a case by JiraID

### Parsers
- [ ]

### UI / UX
- [ ]

### CLI
- [ ]

## Bugs
- [ ] Bug: Central Logger parser does not always parse JSON objects (UIPlatform.Performance, for example)
- [ ] Bug: Some JSON logs (from splunk) do not parse the payload as json
- [ ] Bug: Highlight does not work when a the highlight text is set and then a log entry containing that text is expanded

## Done
- [x] Redistribute UI real-estate
  - [x] The log entry panel should be the main focus
  - [x] The statistics panel should take less space; consider a slide-out or slide-down for the statistics
  - [x] Move the "log sources" functionality from the summary panel into the log sources/files panel
- [x] Bug: Central Logger log entries do not link to the file parser line number
- [x] The file editor find functionality should have a previous and next arrow buttons along with a x/y match count
- [x] The file editor should have shortcuts to navigate to the next tab (control-tab), previous tab (control-shift-tab) and include wraparound
- [x] Add a "control-g" keyboard shortcut to scroll to a specific line in the file editor
- [x] Allow table columns to be added or removed
- [x] Entry details panel displays which filter matched the entry
- [x] Each filter should show how may entries were matched
- [x] Add source file line numbers to the file editor tab
- [x] Add source file line number(s) to the Entry Detail panel
- [x] Always show a parser in entry detail
- [x] Files with no parser should try to extract the timestamp from each line (the parser should be "single line parser")
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
