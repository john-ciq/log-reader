import type { ParserConfig } from '../parser';
import { tryExtractTimestamp } from './parserUtils';


/**
 * Fallback parser for lines that match no other parser.
 * Treats the entire line (or multi-line buffer) as the message.
 */
export const singleLine: ParserConfig = {
  name: 'Single Line',
  description: 'Fallback parser for unmatched log lines — treats the entire entry as the message',
  patterns: [/^([\s\S]+)$/],
  fallback: true,
  format: (match) => ({
    timestamp: tryExtractTimestamp(match[1]) ?? new Date(),
    level: 'log',
    message: match[1],
  }),
};
