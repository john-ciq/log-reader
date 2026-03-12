import type { ParserConfig } from '../parser';

/**
 * NCSA Common Log Format: 127.0.0.1 - - [10/Oct/2000:13:55:36 -0700] "GET /index.html HTTP/1.0" 200 1043
 *
 * No sample logs provided; typical Apache/Nginx access format.
 */
export const ncsa: ParserConfig = {
  name: 'NCSA Common Log Format',
  description: 'Apache/Nginx access logs',
  patterns: [
    /^(\S+) \S+ \S+ \[(.*?)\] "([^\"]*)" (\d+) (\S+)$/,
  ],
  format: (match) => {
    const [, ip, dateStr, request, status, bytes] = match;
    const timestamp = new Date(dateStr.replace(/:(\d{2})\s/, '$1'));
    const [method, path] = request.split(' ');

    return {
      timestamp,
      source: ip,
      level: parseInt(status) >= 400 ? (parseInt(status) >= 500 ? 'error' : 'warn') : 'info',
      message: `${method} ${path} - ${status}`,
      metadata: { status, bytes, method, path },
    };
  },
};
