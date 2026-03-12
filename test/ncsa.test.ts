import { describe, it, expect } from 'vitest';
import { ncsa } from '../src/lib/parsers/ncsa.ts';

function parse(line: string) {
  for (const pattern of ncsa.patterns) {
    const match = line.match(pattern);
    if (match) return ncsa.format(match);
  }
  return null;
}

describe('ncsa parser', () => {
  it('matches a standard 200 GET request', () => {
    const line = '127.0.0.1 - frank [10/Oct/2000:13:55:36 -0700] "GET /index.html HTTP/1.0" 200 2326';
    const result = parse(line);
    expect(result).not.toBeNull();
    expect(result!.source).toBe('127.0.0.1');
    expect(result!.level).toBe('info');
    expect(result!.message).toBe('GET /index.html - 200');
    expect((result!.metadata as Record<string, string>).status).toBe('200');
    expect((result!.metadata as Record<string, string>).method).toBe('GET');
    expect((result!.metadata as Record<string, string>).path).toBe('/index.html');
  });

  it('assigns warn level to 4xx responses', () => {
    const line = '127.0.0.1 - - [10/Oct/2000:13:55:36 -0700] "GET /missing HTTP/1.0" 404 512';
    const result = parse(line);
    expect(result!.level).toBe('warn');
  });

  it('assigns error level to 5xx responses', () => {
    const line = '127.0.0.1 - - [10/Oct/2000:13:55:36 -0700] "POST /api HTTP/1.1" 500 0';
    const result = parse(line);
    expect(result!.level).toBe('error');
  });

  it('captures bytes in metadata', () => {
    const line = '10.0.0.1 - - [10/Oct/2000:13:55:36 -0700] "GET /img.png HTTP/1.0" 200 4096';
    const result = parse(line);
    expect((result!.metadata as Record<string, string>).bytes).toBe('4096');
  });

  it('handles a dash for bytes (no content)', () => {
    const line = '127.0.0.1 - - [10/Oct/2000:13:55:36 -0700] "HEAD / HTTP/1.0" 200 -';
    const result = parse(line);
    expect(result).not.toBeNull();
  });

  it('does not match a plain text log line', () => {
    const line = '[2026-02-26T11:11:59.893] [INFO] main - Server started';
    expect(parse(line)).toBeNull();
  });
});
