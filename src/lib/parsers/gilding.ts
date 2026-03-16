import type { ParserConfig } from '../parser';

/**
 * Format:
 *   YYYY-MM-DD HH:MM:SS,mmm [thread][LEVELrocessid][pid] LEVEL  Source - message
 *
 * Examples:
 *   2026-03-03 12:16:53,448 [1][INFOrocessid][16904] INFO  Program - mutex: try to parse mutex config
 *   2025-11-25 16:26:30,471 [1][ERRORrocessid][13288] ERROR Program - (from 2025-11-25 16:26:30) mutex:
 *   2025-11-25 16:26:30,471 [1][WARNrocessid][13288] WARN  Program - Short circuit check...
 *
 * Sample files: gilding.log
 */
export const gilding: ParserConfig = {
  name: 'Gilding',
  description: 'Tick42/io.Connect Gilding log format (date timestamp, thread, level, pid, source)',
  patterns: [
    /^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2},\d{3}) \[(\d+)\]\[[A-Z]+rocessid\]\[(\d+)\] ([A-Z]+)\s+(\S+) - ([\s\S]*)$/,
  ],
  format: (match) => {
    const [, timestamp, thread, pid, level, source, message] = match;
    return {
      timestamp: new Date(timestamp.replace(' ', 'T').replace(',', '.')),
      level: level.toLowerCase(),
      source,
      message,
      metadata: { thread, pid },
    };
  },
};
