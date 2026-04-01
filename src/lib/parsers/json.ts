import type { ParserConfig } from '../parser';
import { tryExtractTimestamp } from './parserUtils';

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
      const timestamp = knownTs ? new Date(knownTs) : (tryExtractTimestamp(JSON.stringify(data)) ?? new Date());

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
