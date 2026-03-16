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

/**
 * Common log entry format after parsing
 */
export interface LogEntry {
  id: string; // Unique identifier
  timestamp: Date;
  level: string; // debug, info, warn, error, log, etc.
  source: string; // Component/module name (original parsed source)
  filename?: string; // Name of the file this entry came from
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

  for (const config of PARSER_CONFIGS) {
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

  // Fallback: treat entire line as message
  return {
    id,
    timestamp: new Date(),
    level: 'info',
    source: 'unknown',
    filename,
    message: line,
    raw: line,
  };
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
          if (entry) {
            entries.push(entry);
          }
        });
        return entries;
      }
    } catch {
      // Not a valid JSON array, continue with line parsing
    }
  }

  // Helper: determine if a line begins a new entry according to any parser pattern
  const isStartLine = (line: string): boolean => {
    if (!line.trim()) return false;
    return PARSER_CONFIGS.some((cfg) =>
      cfg.patterns.some((p) => p.test(line))
    );
  };

  // Parse as line-delimited content, combining continuations
  const rawLines = content.split('\n');
  let buffer = '';
  rawLines.forEach((line) => {
    if (isStartLine(line)) {
      if (buffer) {
        const entry = parseLogLine(buffer, `${Date.now()}-${entries.length}`, filename);
        if (entry) {
          entries.push(entry);
        }
      }
      buffer = line;
    } else {
      // continuation of previous entry (or leading blank lines)
      buffer += buffer ? '\n' + line : line;
    }
  });
  if (buffer) {
    const entry = parseLogLine(buffer, `${Date.now()}-${entries.length}`, filename);
    if (entry) {
      entries.push(entry);
    }
  }

  return entries;
}
