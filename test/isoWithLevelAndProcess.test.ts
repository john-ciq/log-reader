import { describe, it, expect } from 'vitest';
import { isoWithLevelAndProcess } from '../src/lib/parsers/isoWithLevelAndProcess.ts';

function parse(line: string) {
  for (const pattern of isoWithLevelAndProcess.patterns) {
    const match = line.match(pattern);
    if (match) return isoWithLevelAndProcess.format(match);
  }
  return null;
}

describe('isoWithLevelAndProcess parser', () => {
  describe('bracketed source variant', () => {
    it('matches a WARN line with bracketed source', () => {
      const line = '[2026-02-26T11:12:42.856] [WARN] [13760_15] [GssDesktopManager.appManager] - AppManager API is deprecated.';
      const result = parse(line);
      expect(result).not.toBeNull();
      expect(result!.level).toBe('warn');
      expect(result!.source).toBe('GssDesktopManager.appManager');
      expect(result!.message).toBe('AppManager API is deprecated.');
      expect(result!.timestamp).toEqual(new Date('2026-02-26T11:12:42.856'));
      expect((result!.metadata as Record<string, string>).processId).toBe('13760_15');
    });

    it('matches an INFO line with bracketed source', () => {
      const line = '[2026-02-26T11:12:42.909] [INFO] [13760_15] [GssDesktopManager.gss-dm-host-app] - glue.js version: 6.16.3';
      const result = parse(line);
      expect(result!.level).toBe('info');
      expect(result!.source).toBe('GssDesktopManager.gss-dm-host-app');
      expect(result!.message).toBe('glue.js version: 6.16.3');
    });

    it('captures the process ID in metadata', () => {
      const line = '[2026-02-26T11:12:42.856] [INFO] [25408_14] [App.module] - started';
      const result = parse(line);
      expect((result!.metadata as Record<string, string>).processId).toBe('25408_14');
    });
  });

  describe('unbracketed source variant', () => {
    it('matches an ERROR line with unbracketed source', () => {
      const line = '[2026-03-09T09:59:01.972] [ERROR] [55696_5] web-request - network-error - GET ws://localhost:9000';
      const result = parse(line);
      expect(result).not.toBeNull();
      expect(result!.level).toBe('error');
      expect(result!.source).toBe('web-request');
      expect(result!.message).toBe('network-error - GET ws://localhost:9000');
      expect((result!.metadata as Record<string, string>).processId).toBe('55696_5');
    });

    it('matches a WARN line with unbracketed source', () => {
      const line = '[2026-03-09T09:59:01.890] [WARN] [55696_5] bloombergBridgeService - something happened';
      const result = parse(line);
      expect(result!.source).toBe('bloombergBridgeService');
      expect(result!.level).toBe('warn');
    });
  });

  it('does not match the plain isoWithLevel format (no process ID)', () => {
    const line = '[2026-02-26T11:11:59.893] [INFO] main - Server started';
    expect(parse(line)).toBeNull();
  });

  it('does not match an unbracketed line', () => {
    const line = '2026-02-26 11:12:42 WARN module - message';
    expect(parse(line)).toBeNull();
  });
});
