import { LogEntry } from './parser';

/**
 * Filter configuration for log entries
 */
export interface FilterConfig {
  id: string;
  name: string;
  enabled: boolean; // Whether this filter is active
  includePatterns: string[]; // Regex patterns - entry must match at least one
  excludePatterns: string[]; // Regex patterns - entry must not match any
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
    includePatterns: [],
    excludePatterns: [],
    levelFilters: [],
    sourceFilters: [],
    fileFilters: [],
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
 * Check if an entry matches any of the given patterns
 */
function matchesAnyPattern(text: string, patterns: RegExp[]): boolean {
  if (patterns.length === 0) return true;
  return patterns.some(p => p.test(text));
}

/**
 * Check if an entry matches none of the given patterns
 */
function matchesNoPatterns(text: string, patterns: RegExp[]): boolean {
  if (patterns.length === 0) return true;
  return !patterns.some(p => p.test(text));
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
export function getFilterDecision(entry: LogEntry, filter: FilterConfig): boolean | null {
  const searchText = `${entry.timestamp.toISOString()} ${entry.level} ${entry.source} ${entry.filename || ''} ${entry.message}`;

  // Include patterns — match → include; no match → no opinion (not exclude)
  if (filter.includePatterns.length > 0) {
    const includePatterns = compilePatterns(filter.includePatterns);
    return matchesAnyPattern(searchText, includePatterns) ? true : null;
  }

  // Exclude patterns — match → exclude; no match → no opinion (not include)
  if (filter.excludePatterns.length > 0) {
    const excludePatterns = compilePatterns(filter.excludePatterns);
    return matchesNoPatterns(searchText, excludePatterns) ? null : false;
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
export function matchesFilter(entry: LogEntry, filter: FilterConfig): boolean {
  const searchText = `${entry.timestamp.toISOString()} ${entry.level} ${entry.source} ${entry.filename || ''} ${entry.message}`;

  // Include patterns — a match forces inclusion, bypassing all other criteria
  const includePatterns = compilePatterns(filter.includePatterns);
  if (includePatterns.length > 0) {
    return matchesAnyPattern(searchText, includePatterns);
  }

  // Exclude patterns - entry must not match any
  const excludePatterns = compilePatterns(filter.excludePatterns);
  if (!matchesNoPatterns(searchText, excludePatterns)) {
    return false;
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
