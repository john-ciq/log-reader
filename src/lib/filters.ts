import { LogEntry } from './parser';

/**
 * Filter configuration for log entries
 */
export interface FilterConfig {
  id: string;
  name: string;
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
    includePatterns: [],
    excludePatterns: [],
    levelFilters: [],
    sourceFilters: [],
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
 * Apply filters to a log entry
 */
export function matchesFilter(entry: LogEntry, filter: FilterConfig): boolean {
  const searchText = `${entry.timestamp.toISOString()} ${entry.level} ${entry.source} ${entry.message}`;

  // Include patterns - entry must match at least one (if any exist)
  const includePatterns = compilePatterns(filter.includePatterns);
  if (includePatterns.length > 0 && !matchesAnyPattern(searchText, includePatterns)) {
    return false;
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
