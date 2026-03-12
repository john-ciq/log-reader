import { describe, it, expect } from 'vitest';
import { genericBracketed } from '../src/lib/parsers/genericBracketed.ts';

function parse(line: string) {
  for (const pattern of genericBracketed.patterns) {
    const match = line.match(pattern);
    if (match) return genericBracketed.format(match);
  }
  return null;
}

describe('genericBracketed parser', () => {
  it('matches a basic date + bracketed level line', () => {
    const line = '2026-02-26 10:00:00 [ERROR] Something went wrong';
    const result = parse(line);
    expect(result).not.toBeNull();
    expect(result!.level).toBe('error');
    expect(result!.message).toBe('Something went wrong');
    expect(result!.timestamp).toEqual(new Date('2026-02-26 10:00:00'));
  });

  it('matches a line with fractional seconds', () => {
    const line = '2026-02-26 10:00:00.123 [WARN] High CPU usage';
    const result = parse(line);
    expect(result).not.toBeNull();
    expect(result!.level).toBe('warn');
    expect(result!.message).toBe('High CPU usage');
  });

  it('matches a line with extra whitespace before the bracket', () => {
    const line = '2026-02-26 10:00:00  [INFO] Startup complete';
    const result = parse(line);
    expect(result).not.toBeNull();
    expect(result!.level).toBe('info');
  });

  it('sets source to "unknown"', () => {
    const line = '2026-02-26 10:00:00 [DEBUG] Debugging output';
    const result = parse(line);
    expect(result!.source).toBe('unknown');
  });

  it('matches a DEBUG line', () => {
    const line = '2026-02-26 10:00:00 [DEBUG] Verbose trace';
    const result = parse(line);
    expect(result!.level).toBe('debug');
  });

  it('matches a multiline message', () => {
    const line = '2026-02-26 10:00:00 [ERROR] Crash\n    at foo (bar.js:1)';
    const result = parse(line);
    expect(result).not.toBeNull();
    expect(result!.message).toContain('at foo');
  });

  it('does not match an ISO-T bracketed line', () => {
    // isoWithLevel format — no space between date and time parts in the bracket
    const line = '[2026-02-26T11:11:59.893] [INFO] main - Server started';
    expect(parse(line)).toBeNull();
  });
});
