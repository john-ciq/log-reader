import type { ParserConfig } from '../parser';

/**
 * Formats:
 *   [ISO-TIMESTAMP] [LEVEL] [PROCESS_ID] [SOURCE] - message  (bracketed source)
 *   [ISO-TIMESTAMP] [LEVEL] [PROCESS_ID] source - message    (unbracketed source)
 *
 * Examples:
 *   [2026-02-26T11:12:42.856] [WARN] [13760_15] [GssDesktopManager.appManager] - message
 *   [2026-03-09T09:59:01.972] [ERROR] [55696_5] web-request - network-error - GET ...
 *
 * Sample files used to derive this parser:
 *   - GssDesktopManager.log
 *   - bloombergBridgeService.log
 */
export const isoWithLevelAndProcess: ParserConfig = {
  name: 'ISO Timestamp with Level and Process',
  description: 'Logs with ISO 8601 timestamp, level, process ID, and source (bracketed or unbracketed)',
  patterns: [
    // bracketed source: [ISO] [LEVEL] [PROCESS_ID] [SOURCE] - message
    /^\[(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.?\d*)?)\] \[([^\]]+)\] \[([^\]]+)\] \[([^\]]+)\](?: - ([\s\S]*))?$/,
    // unbracketed source: [ISO] [LEVEL] [PROCESS_ID] source - message
    /^\[(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.?\d*)?)\] \[([^\]]+)\] \[([^\]]+)\] ([^ \[][^ ]*)(?: - ([\s\S]*))?$/,
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
