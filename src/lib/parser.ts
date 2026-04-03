import { isoWithLevel } from './parsers/isoWithLevel.ts';
import { isoWithLevelAndProcess } from './parsers/isoWithLevelAndProcess.ts';
import { fea } from './parsers/fea.ts';
import { bracketedWithId } from './parsers/bracketedWithId.ts';
import { ncsa } from './parsers/ncsa.ts';
import { json } from './parsers/json.ts';
import { finsembleJson } from './parsers/finsembleJson.ts';
import { icgDesktopNativeBridge } from './parsers/icgDesktopNativeBridge.ts';
import { genericBracketed } from './parsers/genericBracketed.ts';
import { gilding } from './parsers/gilding.ts';
import { singleLine } from './parsers/singleLine';

/**
 * Common log entry format after parsing
 */
export interface LogEntry {
  id: string; // Unique identifier
  timestamp: Date;
  level: string; // debug, info, warn, error, log, etc.
  source: string; // Component/module name (original parsed source)
  filename?: string; // Name of the file this entry came from
  lineNumberStart?: number; // 1-based start line number in the source file
  lineNumberEnd?: number; // 1-based end line number (differs from lineNumberStart for multi-line entries)
  parser?: string; // Name of the parser that matched this entry
  message: string; // The full message content
  raw: string; // Original unparsed line
  metadata?: Record<string, unknown>; // Additional context
}

/**
 * Configuration for a log parser
 */
export interface ParserConfig {
  name: string;
  description: string;
  patterns: RegExp[];
  format: (match: RegExpMatchArray) => Partial<LogEntry>;
  /** If true, this parser is excluded from start-of-entry detection and only runs as a last resort */
  fallback?: boolean;
}

/**
 * Collection of all built-in parsers
 */
export const PARSER_CONFIGS: ParserConfig[] = [
  isoWithLevelAndProcess,
  isoWithLevel,
  bracketedWithId,
  fea,
  gilding,
  ncsa,
  finsembleJson,
  json,
  icgDesktopNativeBridge,
  genericBracketed,
  singleLine,
];

/**
 * Normalize log level names (e.g., "log-" -> "log")
 */
function normalizeLevel(level: string): string {
  return level.replace(/[-_]+$/, ''); // Remove trailing hyphens/underscores
}

/**
 * Parse a single line using available parsers
 */
export function parseLogLine(line: string, id: string, filename?: string): LogEntry | null {
  if (!line.trim()) return null;

  const tryParsers = (configs: ParserConfig[]) => {
    for (const config of configs) {
      for (const pattern of config.patterns) {
        const match = line.match(pattern);
        if (match) {
          const formatted = config.format(match);
          return {
            id,
            timestamp: formatted.timestamp || new Date(),
            level: normalizeLevel(formatted.level || 'info'),
            source: formatted.source || 'unknown',
            filename,
            parser: config.name,
            message: formatted.message || line,
            raw: line,
            metadata: formatted.metadata,
          };
        }
      }
    }
    return null;
  };

  return (
    tryParsers(PARSER_CONFIGS.filter(c => !c.fallback)) ??
    tryParsers(PARSER_CONFIGS.filter(c => c.fallback)) ??
    // Fallback if no parser matches (shouldn't happen due to singleLine fallback, but
    // just in case that is not enabled or the code changes, have a final fallback here)
    {
      id,
      timestamp: new Date(),
      level: 'info',
      source: 'unknown',
      filename,
      message: line,
      raw: line,
    }
  );
}

/**
 * Parse multiple lines into structured log entries
 */
export function parseLogContent(content: string, filename?: string): LogEntry[] {
  const entries: LogEntry[] = [];
  const trimmed = content.trim();

  // Try to parse as JSON array first
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const jsonArray = JSON.parse(trimmed) as unknown[];
      if (Array.isArray(jsonArray)) {
        jsonArray.forEach((item, index) => {
          const jsonStr = JSON.stringify(item);
          const entry = parseLogLine(jsonStr, `${Date.now()}-${index}`, filename);
          if (entry) entries.push({ ...entry, lineNumberStart: 1, lineNumberEnd: 1 });
        });
        return entries;
      }
    } catch {
      // Not a valid JSON array, continue with line parsing
    }
  }

  // Helper: determine if a line begins a new entry according to any non-fallback parser pattern
  const isStartLine = (line: string): boolean => {
    if (!line.trim()) return false;
    return PARSER_CONFIGS.some((cfg) =>
      !cfg.fallback && cfg.patterns.some((p) => p.test(line))
    );
  };

  const rawLines = content.split('\n');

  // If no non-fallback parser matches any line, each line is its own entry
  if (!rawLines.some(isStartLine)) {
    rawLines.forEach((line, i) => {
      const entry = parseLogLine(line.trimEnd(), `${Date.now()}-${i}`, filename);
      if (entry) entries.push({ ...entry, lineNumberStart: i + 1, lineNumberEnd: i + 1 });
    });
    return entries;
  }

  // Parse as line-delimited content, combining continuations
  let buffer = '';
  let bufferStartLine = 1;
  rawLines.forEach((line, i) => {
    if (isStartLine(line)) {
      if (buffer) {
        const entry = parseLogLine(buffer.trimEnd(), `${Date.now()}-${entries.length}`, filename);
        const lineNumberEnd = bufferStartLine + buffer.split('\n').length - 1;
        if (entry) entries.push({ ...entry, lineNumberStart: bufferStartLine, lineNumberEnd });
      }
      buffer = line;
      bufferStartLine = i + 1;
    } else {
      // continuation of previous entry (or leading blank lines)
      buffer += buffer ? '\n' + line : line;
    }
  });
  if (buffer) {
    const entry = parseLogLine(buffer.trimEnd(), `${Date.now()}-${entries.length}`, filename);
    const lineNumberEnd = bufferStartLine + buffer.split('\n').length - 1;
    if (entry) entries.push({ ...entry, lineNumberStart: bufferStartLine, lineNumberEnd });
  }

  return entries;
}
