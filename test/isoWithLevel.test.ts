import { describe, it, expect } from 'vitest';
import { isoWithLevel } from '../src/lib/parsers/isoWithLevel.ts';

function parse(line: string) {
  for (const pattern of isoWithLevel.patterns) {
    const match = line.match(pattern);
    if (match) return isoWithLevel.format(match);
  }
  return null;
}

describe('isoWithLevel parser', () => {
  it('matches a standard INFO line', () => {
    const line = '[2026-02-26T11:11:59.893] [INFO] main - Server started';
    const result = parse(line);
    expect(result).not.toBeNull();
    expect(result!.level).toBe('info');
    expect(result!.source).toBe('main');
    expect(result!.message).toBe('Server started');
    expect(result!.timestamp).toEqual(new Date('2026-02-26T11:11:59.893'));
  });

  it('matches a WARN line', () => {
    const line = '[2026-02-26T11:12:05.886] [WARN] gw.server.ws - Connection dropped';
    const result = parse(line);
    expect(result!.level).toBe('warn');
    expect(result!.source).toBe('gw.server.ws');
    expect(result!.message).toBe('Connection dropped');
  });

  it('matches an ERROR line', () => {
    const line = '[2026-02-26T11:12:05.886] [ERROR] app.db - Query failed';
    const result = parse(line);
    expect(result!.level).toBe('error');
  });

  it('matches a line with no message after the dash', () => {
    const line = '[2026-02-26T11:12:42.897] [INFO] gw.gss-dm-host-app - ';
    const result = parse(line);
    expect(result).not.toBeNull();
    expect(result!.message).toBe('');
  });

  it('matches a line with a multiline message', () => {
    const line = '[2026-02-26T11:12:05.886] [ERROR] app - Something failed\n    at Object.<anonymous> (index.js:10:5)';
    const result = parse(line);
    expect(result).not.toBeNull();
    expect(result!.message).toContain('at Object.<anonymous>');
  });

  it('does not match a line without brackets around the level', () => {
    const line = '2026-02-26T11:11:59.893 INFO main - Server started';
    expect(parse(line)).toBeNull();
  });

  it('does not match the isoWithLevelAndProcess format (three bracket groups)', () => {
    const line = '[2026-02-26T11:12:42.856] [WARN] [13760_15] [Source.module] - message';
    // This format has an extra [PROCESS_ID] group; should NOT match isoWithLevel
    expect(parse(line)).toBeNull();
  });
});
