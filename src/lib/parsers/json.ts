import type { ParserConfig } from '../parser';

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

      return {
        timestamp: new Date(data.timestamp || data.time || data.date || Date.now()),
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
