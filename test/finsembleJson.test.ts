import { describe, it, expect } from 'vitest';
import { finsembleJson } from '../src/lib/parsers/finsembleJson.ts';

function parse(line: string) {
  for (const pattern of finsembleJson.patterns) {
    const match = line.match(pattern);
    if (match) return finsembleJson.format(match);
  }
  return null;
}

// The finsembleJson pattern requires at least one character before "logTimestamp",
// so it cannot be the first JSON key. Real Finsemble combined.json logs always
// have other fields (e.g. category) before logTimestamp.
const BASE = {
  category: 'system',
  logTimestamp: 1773241647260,
  logType: 'Log',
  logClientName: 'adapter',
  parsedLogArgs: ['Hello from adapter'],
};

describe('finsembleJson parser', () => {
  it('parses a standard Finsemble log entry', () => {
    const line = JSON.stringify(BASE);
    const result = parse(line);
    expect(result).not.toBeNull();
    expect(result!.level).toBe('log');
    expect(result!.source).toBe('adapter');
    expect(result!.message).toBe('Hello from adapter');
    expect(result!.timestamp).toEqual(new Date(1773241647260));
  });

  it('maps logType "Error" to error level', () => {
    const line = JSON.stringify({ ...BASE, logType: 'Error', parsedLogArgs: ['Something failed'] });
    const result = parse(line);
    expect(result!.level).toBe('error');
  });

  it('maps logType "Warning" to warning level', () => {
    const line = JSON.stringify({ ...BASE, logType: 'Warning', parsedLogArgs: ['Low memory'] });
    const result = parse(line);
    expect(result!.level).toBe('warning');
  });

  it('maps logType "Debug" to debug level', () => {
    const line = JSON.stringify({ ...BASE, logType: 'Debug', parsedLogArgs: ['trace'] });
    const result = parse(line);
    expect(result!.level).toBe('debug');
  });

  it('joins multiple parsedLogArgs with " | "', () => {
    const line = JSON.stringify({ ...BASE, parsedLogArgs: ['part one', 'part two', 'part three'] });
    const result = parse(line);
    expect(result!.message).toBe('part one | part two | part three');
  });

  it('falls back to allLogArgs when parsedLogArgs is empty', () => {
    const line = JSON.stringify({ ...BASE, parsedLogArgs: [], allLogArgs: '  fallback message  ' });
    const result = parse(line);
    expect(result!.message).toBe('fallback message');
  });

  it('returns "No message" when both parsedLogArgs and allLogArgs are missing', () => {
    const line = JSON.stringify({ ...BASE, parsedLogArgs: [] });
    const result = parse(line);
    expect(result!.message).toBe('No message');
  });

  it('stores category and logType in metadata', () => {
    const entry = { ...BASE, highlightFlag: true, timeElapsedFromStartup: 1234 };
    const line = JSON.stringify(entry);
    const result = parse(line);
    const meta = result!.metadata as Record<string, unknown>;
    expect(meta.logType).toBe('Log');
    expect(meta.category).toBe('system');
    expect(meta.highlightFlag).toBe(true);
    expect(meta.timeElapsedFromStartup).toBe(1234);
  });

  it('does not match a generic JSON log line without the required fields', () => {
    const line = '{"timestamp":"2026-03-10T12:00:00Z","level":"info","message":"hello"}';
    expect(parse(line)).toBeNull();
  });

  it('does not match a plain text log line', () => {
    const line = '[2026-02-26T11:11:59.893] [INFO] main - Server started';
    expect(parse(line)).toBeNull();
  });
});
