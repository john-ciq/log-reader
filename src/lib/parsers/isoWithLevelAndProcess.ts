import type { ParserConfig } from '../parser';

/**
 * Format: [ISO-TIMESTAMP] [LEVEL] [PROCESS_ID] [SOURCE] - message
 * Example: [2026-02-26T11:12:42.856] [WARN] [13760_15] [GssDesktopManager.appManager] - message
 *
 * Sample files used to derive this parser:
 *   - GssDesktopManager.log
 */
export const isoWithLevelAndProcess: ParserConfig = {
  name: 'ISO Timestamp with Level and Process',
  description: 'Logs with ISO 8601 timestamp, level, process ID, and bracketed source',
  patterns: [
    /^\[(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.?\d*)?)\] \[([^\]]+)\] \[([^\]]+)\] \[([^\]]+)\](?: - ([\s\S]*))?$/,
  ],
  format: (match) => {
    const [, timestamp, level, processId, source, message = ''] = match;

    return {
      timestamp: new Date(timestamp),
      level: level.toLowerCase(),
      source,
      message,
      metadata: { processId },
    };
  },
};
