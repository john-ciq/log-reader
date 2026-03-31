import { LogEntry } from './parser';

/**
 * Filter configuration for log entries
 */
export interface FilterConfig {
  id: string;
  name: string;
  enabled: boolean; // Whether this filter is active
  mode: 'include' | 'exclude'; // Whether patterns include or exclude matching entries
  patterns: string[]; // Regex patterns
  operator: 'and' | 'or'; // 'or' = any must match, 'and' = all must match
  // Legacy fields — kept for backward compatibility with saved filters
  includePatterns?: string[];
  includeOperator?: 'and' | 'or';
  excludePatterns?: string[];
  excludeOperator?: 'and' | 'or';
  comment?: string; // Optional free-text note about this filter
  color?: string; // Optional highlight color for matched entries (hex, e.g. "#ff0000")
  colorEnabled?: boolean; // Whether the highlight color is active (defaults to true when color is set)
  colorOpacity?: number; // Opacity of the highlight color (0–1, defaults to 0.3)
  levelFilters: string[]; // Log levels to include (empty = all)
  sourceFilters: string[]; // Sources to include (empty = all)
  fileFilters: string[]; // Filenames to include (empty = all)
  dateRange?: {
    start?: Date;
    end?: Date;
  };
}

/**
 * Create a default/empty filter config
 */
export function createEmptyFilterConfig(): FilterConfig {
  return {
    id: `filter-${Date.now()}`,
    name: 'New Filter',
    enabled: true,
    mode: 'include',
    patterns: [],
    operator: 'or',
    levelFilters: [],
    sourceFilters: [],
    fileFilters: [],
  };
}

/** Migrate a legacy filter (includePatterns/excludePatterns) to the unified model */
export function migrateFilter(f: FilterConfig): FilterConfig {
  if (f.patterns !== undefined) return f; // already migrated
  const hasInclude = (f.includePatterns?.length ?? 0) > 0;
  const hasExclude = (f.excludePatterns?.length ?? 0) > 0;
  return {
    ...f,
    mode: hasExclude && !hasInclude ? 'exclude' : 'include',
    patterns: hasExclude && !hasInclude
      ? (f.excludePatterns ?? [])
      : (f.includePatterns ?? []),
    operator: hasExclude && !hasInclude
      ? (f.excludeOperator ?? 'or')
      : (f.includeOperator ?? 'or'),
  };
}

/**
 * Validate a regex pattern
 */
export function validateRegex(pattern: string): { valid: boolean; error?: string } {
  try {
    new RegExp(pattern);
    return { valid: true };
  } catch (error) {
    return { valid: false, error: (error as Error).message };
  }
}

/**
 * Compile regex patterns safely
 */
function compilePatterns(patterns: string[]): RegExp[] {
  return patterns
    .filter(p => p.trim())
    .map(p => {
      try {
        return new RegExp(p, 'i'); // Case-insensitive
      } catch {
        return null;
      }
    })
    .filter((p): p is RegExp => p !== null);
}

/**
 * Check if text matches patterns using the given operator
 */
function matchesPatterns(text: string, patterns: RegExp[], operator: 'and' | 'or'): boolean {
  if (patterns.length === 0) return false;
  return operator === 'and'
    ? patterns.every(p => p.test(text))
    : patterns.some(p => p.test(text));
}

/**
 * Returns the filter's cascading decision for a log entry:
 *   true  — filter explicitly includes this entry (stop checking further filters)
 *   false — filter explicitly excludes this entry (stop checking further filters)
 *   null  — filter has no opinion about this entry (try the next filter)
 *
 * Rules:
 *   - Include pattern matches       → true  (include, stop)
 *   - Include pattern exists, no match → null (no opinion)
 *   - Exclude pattern matches       → false (exclude, stop)
 *   - Exclude pattern exists, no match → null (no opinion)
 *   - No patterns, all level/source/file criteria pass → true (include, stop)
 *   - No patterns, a criterion doesn't apply to entry  → null (no opinion)
 *   - No criteria at all            → true  (empty filter, include everything)
 */
export function getFilterDecision(entry: LogEntry, rawFilter: FilterConfig): boolean | null {
  const filter = migrateFilter(rawFilter);
  const searchText = `${entry.timestamp.toISOString()} ${entry.level} ${entry.source} ${entry.filename || ''} ${entry.message}`;

  if (filter.patterns.length > 0) {
    const compiled = compilePatterns(filter.patterns);
    const matched = matchesPatterns(searchText, compiled, filter.operator ?? 'or');
    if (filter.mode === 'include') return matched ? true : null;
    else                          return matched ? false : null;
  }

  // No patterns: level/source/file criteria determine applicability.
  // If a criterion is set but the entry doesn't satisfy it, this filter
  // has no opinion about this entry — try the next filter.
  if (filter.levelFilters.length > 0 && !filter.levelFilters.includes(entry.level.toLowerCase())) {
    return null;
  }
  if (filter.sourceFilters.length > 0 && !filter.sourceFilters.includes(entry.source)) {
    return null;
  }
  if (filter.fileFilters && filter.fileFilters.length > 0 && !filter.fileFilters.includes(entry.filename || '')) {
    return null;
  }
  if (filter.dateRange) {
    if (filter.dateRange.start && entry.timestamp < filter.dateRange.start) return null;
    if (filter.dateRange.end && entry.timestamp > filter.dateRange.end) return null;
  }

  // All criteria passed (or no criteria) — include this entry
  return true;
}

/**
 * Apply filters to a log entry
 */
export function matchesFilter(entry: LogEntry, rawFilter: FilterConfig): boolean {
  const filter = migrateFilter(rawFilter);
  const searchText = `${entry.timestamp.toISOString()} ${entry.level} ${entry.source} ${entry.filename || ''} ${entry.message}`;

  if (filter.patterns.length > 0) {
    const compiled = compilePatterns(filter.patterns);
    const matched = matchesPatterns(searchText, compiled, filter.operator ?? 'or');
    if (filter.mode === 'include') return matched;
    else return !matched;
  }

  // Level filters
  if (filter.levelFilters.length > 0 && !filter.levelFilters.includes(entry.level.toLowerCase())) {
    return false;
  }

  // Source filters
  if (filter.sourceFilters.length > 0 && !filter.sourceFilters.includes(entry.source)) {
    return false;
  }

  // File filters
  if (filter.fileFilters && filter.fileFilters.length > 0) {
    if (!filter.fileFilters.includes(entry.filename || '')) {
      return false;
    }
  }

  // Date range
  if (filter.dateRange) {
    if (filter.dateRange.start && entry.timestamp < filter.dateRange.start) {
      return false;
    }
    if (filter.dateRange.end && entry.timestamp > filter.dateRange.end) {
      return false;
    }
  }

  return true;
}

/**
 * Apply filters to a collection of log entries
 */
export function applyFilters(entries: LogEntry[], filter: FilterConfig): LogEntry[] {
  return entries.filter(entry => matchesFilter(entry, filter));
}

/**
 * Simple text search across all searchable fields
 */
export function searchEntries(entries: LogEntry[], query: string): LogEntry[] {
  if (!query.trim()) return entries;

  const lowerQuery = query.toLowerCase();

  return entries.filter(entry => {
    const searchableText = [
      entry.timestamp.toISOString(),
      entry.level,
      entry.source,
      entry.message,
    ].join(' ').toLowerCase();

    return searchableText.includes(lowerQuery);
  });
}

function hexToRgba(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Returns an rgba() color string for the first enabled, color-highlighted filter
 * that includes the entry, or undefined if none matches.
 */
export function getMatchingFilterColor(entry: LogEntry, filters: FilterConfig[]): string | undefined {
  for (const filter of filters) {
    if (!filter.enabled || !filter.color) continue;
    if ((filter.colorEnabled ?? true) === false) continue;
    if (getFilterDecision(entry, filter) === true) {
      return hexToRgba(filter.color, filter.colorOpacity ?? 0.3);
    }
  }
}

/**
 * Regular expression search
 */
export function regexSearchEntries(entries: LogEntry[], pattern: string): LogEntry[] {
  try {
    const regex = new RegExp(pattern, 'i');

    return entries.filter(entry => {
      const searchableText = `${entry.timestamp.toISOString()} ${entry.level} ${entry.source} ${entry.message}`;
      return regex.test(searchableText);
    });
  } catch {
    return entries;
  }
}
