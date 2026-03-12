import type { ParserConfig } from '../parser';

/**
 * Format: [TIMESTAMP] [ID] [LEVEL] Component - message
 * Example: [2026-02-26 11:12:01,480] [1] [INFO] Core.Display - message
 *
 * Sample file used to derive this parser:
 *   - bridge.log
 */
export const bracketedWithId: ParserConfig = {
  name: 'Bracketed with ID',
  description: 'Logs with timestamp, ID, level, and component',
  patterns: [
    /^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})[,.](\d+)\] \[(\d+)\] \[([^\]]+)\] ([^ ]+)(?: - ([\s\S]*))?$/,
  ],
  format: (match) => {
    const [, date, ms, threadId, level, source, message = ''] = match;
    const timestamp = new Date(`${date}.${ms}`);

    return {
      timestamp,
      level: level.toLowerCase(),
      source,
      message,
      metadata: { threadId },
    };
  },
};
