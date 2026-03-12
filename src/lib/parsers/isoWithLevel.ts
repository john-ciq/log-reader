import type { ParserConfig } from '../parser';

/**
 * Format: [ISO-TIMESTAMP] [LEVEL] source - message
 * Example: [2026-02-26T11:11:59.893] [INFO] main - Server started
 *
 * Sample files used to derive this parser:
 *   - application.log
 *   - gw.log
 */
export const isoWithLevel: ParserConfig = {
  name: 'ISO Timestamp with Level',
  description: 'Logs with ISO 8601 timestamp and level in brackets',
  patterns: [
    /^\[(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.?\d*)?)\] \[([^\]]+)\] ([^ ]+)(?: - ([\s\S]*))?$/,
  ],
  format: (match) => {
    const [, timestamp, level, source, message = ''] = match;

    return {
      timestamp: new Date(timestamp),
      level: level.toLowerCase(),
      source,
      message,
    };
  },
};
