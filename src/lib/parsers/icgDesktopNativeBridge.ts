import type { ParserConfig } from '../parser';

/**
 * Format: YYYY-MM-DD HH:mm:ss.mmm ±HH:MM [LEVEL] tid:N source - message
 * Example: 2026-02-18 00:00:45.580 -05:00 [INF] tid:25 ICGDesktopNativeBridge-1 - Socket communication metrics:
 *
 * Some lines have no source separator:
 *   2026-02-18 00:04:10.088 -05:00 [INF] tid:76 ** /papi-invoke/... Received **
 *   2026-02-18 00:04:10.088 -05:00 [INF] tid:76 pAPI e8421089... invoke "serviceName": ...
 *
 * Sample file(s) used:
 *   - ICG_DESKTOP_NATIVE_BRIDGE_20260218.log
 */

const LEVEL_MAP: Record<string, string> = {
  INF: 'info',
  ERR: 'error',
  WRN: 'warn',
  DBG: 'debug',
};

export const icgDesktopNativeBridge: ParserConfig = {
  name: 'ICG Desktop Native Bridge',
  description: 'Logs from ICG Desktop Native Bridge with timezone-aware timestamps and thread IDs',
  patterns: [
    /^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}) ([+-]\d{2}:\d{2}) \[(\w+)\] tid:(\d+) ([\s\S]*)$/,
  ],
  format: (match) => {
    const [, timestamp, tz, rawLevel, tid, remainder] = match;

    const separatorIdx = remainder.indexOf(' - ');
    const source = separatorIdx !== -1 ? remainder.slice(0, separatorIdx) : '';
    const message = separatorIdx !== -1 ? remainder.slice(separatorIdx + 3) : remainder;

    return {
      timestamp: new Date(`${timestamp}${tz}`),
      level: LEVEL_MAP[rawLevel] ?? rawLevel.toLowerCase(),
      source,
      message,
      metadata: { tid: parseInt(tid, 10) },
    };
  },
};
