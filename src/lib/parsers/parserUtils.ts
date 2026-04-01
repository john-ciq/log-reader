// Matches ISO 8601 datetime strings: "2026-03-10T12:00:00" or "2026-03-10 12:00:00"
// Also handles timezone offsets with a space: "2026-02-18 13:14:54.384 -05:00"
export const ISO_LIKE = /\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z?/;

export function normalizeTimestamp(value: string): string {
  // Replace space-separated date/time with T, and collapse any space before tz offset
  // "2026-02-18 13:14:54.384 -05:00" -> "2026-02-18T13:14:54.384-05:00"
  return value
    .replace(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})/, '$1T$2')
    .replace(/(\d) ([+-]\d{2}:\d{2})$/, '$1$2');
}

// Guess the timestamp from any ISO-like substring in a string
export function tryExtractTimestamp(data: string): Date | undefined {
  if (ISO_LIKE.test(data)) {
    const timestamp = data.match(ISO_LIKE)?.[0] ?? '';
    const d = new Date(normalizeTimestamp(timestamp));
    if (!isNaN(d.getTime())) return d;
  }
}
