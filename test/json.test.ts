import { describe, it, expect } from 'vitest';
import { json } from '../src/lib/parsers/json.ts';

function parse(line: string) {
  for (const pattern of json.patterns) {
    const match = line.match(pattern);
    if (match) return json.format(match);
  }
  return null;
}

describe('json parser', () => {
  it('parses a standard JSON log line', () => {
    const line = '{"timestamp":"2026-03-10T12:00:00.000Z","level":"info","message":"Hello world","source":"app"}';
    const result = parse(line);
    expect(result).not.toBeNull();
    expect(result!.level).toBe('info');
    expect(result!.message).toBe('Hello world');
    expect(result!.source).toBe('app');
    expect(result!.timestamp).toEqual(new Date('2026-03-10T12:00:00.000Z'));
  });

  it('falls back to "severity" field for level', () => {
    const line = '{"timestamp":"2026-03-10T12:00:00Z","severity":"warn","message":"Low disk","source":"monitor"}';
    const result = parse(line);
    expect(result!.level).toBe('warn');
  });

  it('falls back to "msg" for message', () => {
    const line = '{"timestamp":"2026-03-10T12:00:00Z","level":"debug","msg":"Debugging","source":"core"}';
    const result = parse(line);
    expect(result!.message).toBe('Debugging');
  });

  it('falls back to "logger" for source', () => {
    const line = '{"timestamp":"2026-03-10T12:00:00Z","level":"info","message":"ready","logger":"http-server"}';
    const result = parse(line);
    expect(result!.source).toBe('http-server');
  });

  it('falls back to "component" for source', () => {
    const line = '{"timestamp":"2026-03-10T12:00:00Z","level":"info","message":"ready","component":"auth"}';
    const result = parse(line);
    expect(result!.source).toBe('auth');
  });

  it('defaults level to "info" when missing', () => {
    const line = '{"timestamp":"2026-03-10T12:00:00Z","message":"no level"}';
    const result = parse(line);
    expect(result!.level).toBe('info');
  });

  it('defaults source to "unknown" when missing', () => {
    const line = '{"timestamp":"2026-03-10T12:00:00Z","level":"info","message":"test"}';
    const result = parse(line);
    expect(result!.source).toBe('unknown');
  });

  it('stores the parsed object as metadata', () => {
    const line = '{"timestamp":"2026-03-10T12:00:00Z","level":"error","message":"fail","requestId":"abc123"}';
    const result = parse(line);
    expect((result!.metadata as Record<string, string>).requestId).toBe('abc123');
  });

  it('does not match a plain text log line', () => {
    const line = '[2026-02-26T11:11:59.893] [INFO] main - Server started';
    expect(parse(line)).toBeNull();
  });

  it('does not match a JSON array', () => {
    const line = '[{"level":"info","message":"test"}]';
    expect(parse(line)).toBeNull();
  });
});
