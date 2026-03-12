import type { ParserConfig } from '../parser';

/**
 * Format: timestamp [LEVEL] message (generic fallback)
 * Example: 2026-02-26 10:00:00 [ERROR] Something went wrong
 *
 * Applies to any of the remaining sample logs not matching above patterns.
 */
export const genericBracketed: ParserConfig = {
  name: 'Generic Bracketed',
  description: 'Generic timestamp and bracketed level format',
  patterns: [
    /^([\d-]{10} [\d:]+[.\d]*)\s*\[([^\]]+)\]\s*([\s\S]*)$/,
  ],
  format: (match) => {
    const [, timestamp, level, message] = match;

    return {
      timestamp: new Date(timestamp),
      level: level.toLowerCase(),
      source: 'unknown',
      message,
    };
  },
};
