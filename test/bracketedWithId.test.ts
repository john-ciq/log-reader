import { describe, it, expect } from 'vitest';
import { bracketedWithId } from '../src/lib/parsers/bracketedWithId.ts';

function parse(line: string) {
  for (const pattern of bracketedWithId.patterns) {
    const match = line.match(pattern);
    if (match) return bracketedWithId.format(match);
  }
  return null;
}

describe('bracketedWithId parser', () => {
  it('matches a standard INFO line with comma milliseconds', () => {
    const line = '[2026-02-26 11:12:01,480] [1] [INFO] Core.Display - Initialized';
    const result = parse(line);
    expect(result).not.toBeNull();
    expect(result!.level).toBe('info');
    expect(result!.source).toBe('Core.Display');
    expect(result!.message).toBe('Initialized');
    expect(result!.timestamp).toEqual(new Date('2026-02-26 11:12:01.480'));
  });

  it('matches a line with dot milliseconds', () => {
    const line = '[2026-02-26 11:12:01.480] [1] [INFO] Core.Display - Initialized';
    const result = parse(line);
    expect(result).not.toBeNull();
    expect(result!.level).toBe('info');
  });

  it('captures the thread ID in metadata', () => {
    const line = '[2026-02-26 11:12:01,480] [42] [WARN] Bridge.Service - Retrying';
    const result = parse(line);
    expect((result!.metadata as Record<string, string>).threadId).toBe('42');
  });

  it('matches an ERROR level', () => {
    const line = '[2026-02-26 11:12:01,480] [1] [ERROR] App.Core - Fatal error';
    const result = parse(line);
    expect(result!.level).toBe('error');
    expect(result!.message).toBe('Fatal error');
  });

  it('matches a DEBUG level', () => {
    const line = '[2026-02-26 11:12:01,480] [5] [DEBUG] App.Module - Verbose output';
    const result = parse(line);
    expect(result!.level).toBe('debug');
  });

  it('matches a line with multiline message', () => {
    const line = '[2026-02-26 11:12:01,480] [1] [ERROR] App - Exception\n    at line 42';
    const result = parse(line);
    expect(result).not.toBeNull();
    expect(result!.message).toContain('at line 42');
  });

  it('does not match an ISO-T timestamp format', () => {
    const line = '[2026-02-26T11:12:01.480] [INFO] main - message';
    expect(parse(line)).toBeNull();
  });

  it('does not match a line missing the thread ID bracket', () => {
    const line = '[2026-02-26 11:12:01,480] [INFO] Core.Display - message';
    expect(parse(line)).toBeNull();
  });
});
