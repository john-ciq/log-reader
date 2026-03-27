import { describe, it, expect } from 'vitest';
import { fea } from '../src/lib/parsers/fea.ts';

function parse(line: string) {
  for (const pattern of fea.patterns) {
    const match = line.match(pattern);
    if (match) return fea.format(match);
  }
  return null;
}

function expectTimestampClose(actual: Date, expected: Date, toleranceMs = 1000) {
  expect(Math.abs(actual.getTime() - expected.getTime())).toBeLessThan(toleranceMs);
}

describe('fea parser', () => {
  it('matches a line with negative timezone offset', () => {
    const line = '[2026-03-10 12:00:28.127-04:00] [debug]: Starting component';
    const result = parse(line);
    expect(result).not.toBeNull();
    expect(result!.level).toBe('debug');
    expect(result!.message).toBe('Starting component');
    expectTimestampClose(result!.timestamp, new Date('2026-03-10 12:00:28-04:00'));
  });

  it('matches a line with positive timezone offset', () => {
    const line = '[2026-03-10 08:30:00.000+02:00] [INFO]: Service ready';
    const result = parse(line);
    expect(result).not.toBeNull();
    expect(result!.level).toBe('info');
    expect(result!.message).toBe('Service ready');
  });

  it('matches a line without a colon after the level bracket', () => {
    const line = '[2026-03-10 12:00:28.127-04:00] [warn] Low memory';
    const result = parse(line);
    expect(result).not.toBeNull();
    expect(result!.level).toBe('warn');
    expect(result!.message).toBe('Low memory');
  });

  it('matches a line without a timezone offset (defaults to UTC)', () => {
    const line = '[2026-03-10 12:00:28.127] [error]: Connection refused';
    const result = parse(line);
    expect(result).not.toBeNull();
    expect(result!.level).toBe('error');
    expectTimestampClose(result!.timestamp, new Date('2026-03-10 12:00:28+00:00'));
  });

  it('sets source to "unknown"', () => {
    const line = '[2026-03-10 12:00:28.127-04:00] [info]: message';
    const result = parse(line);
    expect(result!.source).toBe('unknown');
  });

  it('does not match an ISO-T format line', () => {
    const line = '[2026-02-26T11:11:59.893] [INFO] main - Server started';
    expect(parse(line)).toBeNull();
  });
});
