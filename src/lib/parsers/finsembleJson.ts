import type { ParserConfig } from '../parser';

/**
 * Finsemble Combined JSON format
 * Example: {"logTimestamp": 1773241647260, "logType": "Log", "logClientName": "adapter", "parsedLogArgs": ["message"]}
 *
 * No sample file available; based on known Finsemble structure.
 */
export const finsembleJson: ParserConfig = {
  name: 'Finsemble JSON Format',
  description: 'Finsemble combined.json logs with timestamp, type, client, and args',
  patterns: [
    /^(\{.+"logTimestamp".+"logType".+"logClientName".+"parsedLogArgs".*\})$/,
  ],
  format: (match) => {
    try {
      const data = JSON.parse(match[1]);

      let message = '';
      if (Array.isArray(data.parsedLogArgs) && data.parsedLogArgs.length > 0) {
        message = data.parsedLogArgs.map((arg: unknown) => String(arg)).join(' | ');
      } else if (typeof data.allLogArgs === 'string') {
        message = data.allLogArgs.trim().slice(0, 500);
      } else {
        message = 'No message';
      }

      const logTypeMap: Record<string, string> = {
        'Log': 'info',
        'Error': 'error',
        'Warning': 'warn',
        'Info': 'info',
        'Debug': 'debug',
      };

      return {
        timestamp: new Date(data.logTimestamp || Date.now()),
        level: logTypeMap[data.logType] || data.logType?.toLowerCase() || 'info',
        source: data.logClientName || data.category || 'unknown',
        message,
        metadata: {
          category: data.category,
          logType: data.logType,
          highlightFlag: data.highlightFlag,
          timeElapsedFromStartup: data.timeElapsedFromStartup,
        },
      };
    } catch {
      return {};
    }
  },
};
