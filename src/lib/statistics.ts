import { LogEntry } from './parser';

/**
 * Statistics about a collection of log entries
 */
export interface LogStatistics {
  totalEntries: number;
  levelCounts: Record<string, number>;
  sourceCounts: Record<string, number>;
  dateRange?: {
    min: Date;
    max: Date;
  };
  messageLength: {
    min: number;
    max: number;
    average: number;
  };
}

/**
 * Calculate statistics for log entries
 */
export function calculateStatistics(entries: LogEntry[]): LogStatistics {
  const stats: LogStatistics = {
    totalEntries: entries.length,
    levelCounts: {},
    sourceCounts: {},
    messageLength: {
      min: entries.length > 0 ? Math.min(...entries.map(e => e.message.length)) : 0,
      max: entries.length > 0 ? Math.max(...entries.map(e => e.message.length)) : 0,
      average: entries.length > 0 ? entries.reduce((sum, e) => sum + e.message.length, 0) / entries.length : 0,
    },
  };

  if (entries.length > 0) {
    stats.dateRange = {
      min: new Date(Math.min(...entries.map(e => e.timestamp.getTime()))),
      max: new Date(Math.max(...entries.map(e => e.timestamp.getTime()))),
    };
  }

  // Count levels and sources
  entries.forEach(entry => {
    const level = entry.level.toLowerCase();
    stats.levelCounts[level] = (stats.levelCounts[level] || 0) + 1;
    stats.sourceCounts[entry.source] = (stats.sourceCounts[entry.source] || 0) + 1;
  });

  return stats;
}
