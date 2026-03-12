import type { ParserConfig } from '../parser';

/**
 * Format: [TIMESTAMP with timezone] [level]: message
 * Example: [2026-03-10 12:00:28.127-04:00] [debug]: message
 *
 * Sample file(s) used:
 *   - FEA-2026-03-10.log (and similar FEA logs)
 */
export const fea: ParserConfig = {
  name: 'FEA log',
  description: 'Logs from the FEA system with ISO timestamps and timezone',
  patterns: [
    /^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(?:\.\d+)?)([+-]\d{2}:\d{2})?\] \[([^\]]+)\](?::)? ([\s\S]*)$/,
  ],
  format: (match) => {
    const [, timestamp, tz, level, message] = match;

    return {
      timestamp: new Date(`${timestamp}${tz || '+00:00'}`),
      level: level.toLowerCase(),
      source: 'unknown',
      message,
    };
  },
};
