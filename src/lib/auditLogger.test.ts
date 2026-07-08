import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getAuditLogs, AuditLogEntry, verifyAuditTrailIntegrity, logAuditEvent } from './auditLogger';

describe('auditLogger', () => {
  describe('getAuditLogs', () => {
    // Save original localStorage
    const originalLocalStorage = global.localStorage;

    beforeEach(() => {
      // Mock localStorage
      const localStorageMock = (() => {
        let store: Record<string, string> = {};
        return {
          getItem: vi.fn((key: string) => store[key] || null),
          setItem: vi.fn((key: string, value: string) => {
            store[key] = value.toString();
          }),
          removeItem: vi.fn((key: string) => {
            delete store[key];
          }),
          clear: vi.fn(() => {
            store = {};
          })
        };
      })();
      Object.defineProperty(global, 'localStorage', {
        value: localStorageMock,
        writable: true
      });

      // Mock console.error to prevent noisy test output for expected errors
      vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      // Restore original localStorage
      Object.defineProperty(global, 'localStorage', {
        value: originalLocalStorage,
        writable: true
      });
      vi.restoreAllMocks();
    });

    it('should return an empty array if localStorage is empty', () => {
      const logs = getAuditLogs();
      expect(logs).toEqual([]);
      expect(localStorage.getItem).toHaveBeenCalledWith('audit_trail_buffer');
    });

    it('should return parsed logs if valid JSON exists in localStorage', () => {
      const mockLogs: AuditLogEntry[] = [
        {
          id: '1',
          timestamp: '2024-01-01T00:00:00Z',
          type: 'system',
          action: 'TEST',
          details: 'Test detail',
          status: 'success',
          user: 'test_user',
          hash: 'abcdef'
        }
      ];
      localStorage.setItem('audit_trail_buffer', JSON.stringify(mockLogs));

      const logs = getAuditLogs();
      expect(logs).toEqual(mockLogs);
      expect(localStorage.getItem).toHaveBeenCalledWith('audit_trail_buffer');
    });

    it('should return an empty array and log error if invalid JSON exists in localStorage', () => {
      // Setup invalid JSON
      localStorage.setItem('audit_trail_buffer', '{invalid_json]');

      const logs = getAuditLogs();

      expect(logs).toEqual([]);
      expect(localStorage.getItem).toHaveBeenCalledWith('audit_trail_buffer');
      expect(console.error).toHaveBeenCalledWith('Failed to load audit logs:', expect.any(SyntaxError));
    });

  });

  describe('verifyAuditTrailIntegrity', () => {
    const originalLocalStorage = global.localStorage;
    const originalWindow = global.window;

    beforeEach(() => {
      // Mock localStorage
      const localStorageMock = (() => {
        let store: Record<string, string> = {};
        return {
          getItem: vi.fn((key: string) => store[key] || null),
          setItem: vi.fn((key: string, value: string) => {
            store[key] = value.toString();
          }),
          removeItem: vi.fn((key: string) => {
            delete store[key];
          }),
          clear: vi.fn(() => {
            store = {};
          })
        };
      })();
      Object.defineProperty(global, 'localStorage', {
        value: localStorageMock,
        writable: true
      });

      // Mock window
      Object.defineProperty(global, 'window', {
        value: {
          dispatchEvent: vi.fn()
        },
        writable: true
      });

      global.CustomEvent = class CustomEvent {} as any;
    });

    afterEach(() => {
      Object.defineProperty(global, 'localStorage', {
        value: originalLocalStorage,
        writable: true
      });
      Object.defineProperty(global, 'window', {
        value: originalWindow,
        writable: true
      });
    });

    it('should return isValid true for empty logs', () => {
      const result = verifyAuditTrailIntegrity();
      expect(result.isValid).toBe(true);
    });

    it('should return isValid true for valid audit trail', () => {
      logAuditEvent({ type: 'system', action: 'START', details: 'init', status: 'info', user: 'admin' });
      logAuditEvent({ type: 'trade', action: 'BUY', details: '1 BTC', status: 'success', user: 'trader1' });

      const result = verifyAuditTrailIntegrity();
      expect(result.isValid).toBe(true);
    });

    it('should return isValid false when an entry is tampered with', () => {
      logAuditEvent({ type: 'system', action: 'START', details: 'init', status: 'info', user: 'admin' });
      logAuditEvent({ type: 'trade', action: 'BUY', details: '1 BTC', status: 'success', user: 'trader1' });

      // Tamper with the logs
      const logs = JSON.parse(localStorage.getItem('audit_trail_buffer') || '[]');
      // logs are stored newest first. logs[1] is the older entry.
      logs[1].details = 'tampered init';
      localStorage.setItem('audit_trail_buffer', JSON.stringify(logs));

      const result = verifyAuditTrailIntegrity();
      expect(result.isValid).toBe(false);
      // It should detect tampering at the oldest entry (index 1 in reverse order)
      expect(result.tamperedIndex).toBe(1);
    });

    it('should return isValid false when hash is tampered with', () => {
      logAuditEvent({ type: 'system', action: 'START', details: 'init', status: 'info', user: 'admin' });
      logAuditEvent({ type: 'trade', action: 'BUY', details: '1 BTC', status: 'success', user: 'trader1' });

      const logs = JSON.parse(localStorage.getItem('audit_trail_buffer') || '[]');
      // Tamper with the hash of the newest entry
      logs[0].hash = 'deadbeef';
      localStorage.setItem('audit_trail_buffer', JSON.stringify(logs));

      const result = verifyAuditTrailIntegrity();
      expect(result.isValid).toBe(false);
      expect(result.tamperedIndex).toBe(0);
    });

    it('should return isValid false when a log is missing (deleted)', () => {
      logAuditEvent({ type: 'system', action: 'START', details: 'init', status: 'info', user: 'admin' });
      logAuditEvent({ type: 'trade', action: 'BUY', details: '1 BTC', status: 'success', user: 'trader1' });
      logAuditEvent({ type: 'system', action: 'STOP', details: 'end', status: 'info', user: 'admin' });

      const logs = JSON.parse(localStorage.getItem('audit_trail_buffer') || '[]');
      // Delete the middle entry (logs[1] since 0 is newest)
      logs.splice(1, 1);
      localStorage.setItem('audit_trail_buffer', JSON.stringify(logs));

      const result = verifyAuditTrailIntegrity();
      expect(result.isValid).toBe(false);
    });
  });
});
