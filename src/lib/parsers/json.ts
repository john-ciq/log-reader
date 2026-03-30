import type { ParserConfig } from '../parser';

// Matches ISO 8601 datetime strings: "2026-03-10T12:00:00" or "2026-03-10 12:00:00"
// Also handles timezone offsets with a space: "2026-02-18 13:14:54.384 -05:00"
// const ISO_LIKE = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}/;
const ISO_LIKE = /\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z?/

function normalizeTimestamp(value: string): string {
  // Replace space-separated date/time with T, and collapse any space before tz offset
  // "2026-02-18 13:14:54.384 -05:00" -> "2026-02-18T13:14:54.384-05:00"
  return value
    .replace(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})/, '$1T$2')
    .replace(/(\d) ([+-]\d{2}:\d{2})$/, '$1$2');
}

// Guess the timestamp from any ISO-like substring in the data, even if it's not in a known field
// Example data: {"preview":false,"result":{"_raw":"2026-02-18 13:14:54.384 -05:00 [INF] ...
function guessTimestampString(data: string): Date | undefined {
  if (ISO_LIKE.test(data)) {
    // Extract the first timestamp looking substring and try to parse it
    const timestamp = data.match(ISO_LIKE)?.[0] ?? '';
    const d = new Date(normalizeTimestamp(timestamp));
    if (!isNaN(d.getTime())) return d;
  }
}

/**
 * JSON log format
 * Example: {"timestamp": "2026-03-10T...", "level": "info", "message": "...", ...}
 *
 * No concrete sample files were given; handles generic JSON lines.
 */
export const json: ParserConfig = {
  name: 'JSON Format',
  description: 'Line-delimited JSON logs',
  patterns: [
    /^(\{.*\})$/,
  ],
  format: (match) => {
    try {
      const data = JSON.parse(match[1]);
      const knownTs = data.timestamp || data.time || data.date;
      const timestamp = knownTs ? new Date(knownTs) : (guessTimestampString(JSON.stringify(data)) ?? new Date());

      return {
        timestamp,
        level: (data.level || data.severity || 'info').toLowerCase(),
        source: data.source || data.logger || data.component || 'unknown',
        message: data.message || data.msg || JSON.stringify(data),
        metadata: data,
      };
    } catch {
      return {};
    }
  },
};
