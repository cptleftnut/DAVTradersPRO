import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getAuditLogs, AuditLogEntry } from './auditLogger';

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
});
