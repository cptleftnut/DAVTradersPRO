export interface AuditLogEntry {
  id: string;
  timestamp: string;
  type: 'trade' | 'config' | 'error' | 'system';
  action: string;
  details: string;
  status: 'success' | 'failure' | 'warning' | 'info';
  user: string;
  hash: string; // Tamper-evident hash chain signature
}

// Simple deterministic string hashing algorithm (Fowler-Noll-Vo fnv1a)
function fnv1a(str: string): string {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

// Returns the full audit log buffer
export function getAuditLogs(): AuditLogEntry[] {
  try {
    const raw = localStorage.getItem('audit_trail_buffer');
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load audit logs:', err);
    return [];
  }
}

// Logs an event securely with rolling hash chaining
export function logAuditEvent(entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'hash'>): AuditLogEntry {
  const id = 'audit_' + Math.random().toString(36).substring(2, 11);
  const timestamp = new Date().toISOString();
  
  const existing = getAuditLogs();
  
  // Rolling hash chains the current entry with the previous block's hash
  const prevHash = existing.length > 0 ? existing[0].hash : 'genesis_block';
  const payload = `${id}|${timestamp}|${entry.type}|${entry.action}|${entry.details}|${entry.status}|${entry.user}|${prevHash}`;
  const currentHash = fnv1a(payload);
  
  const fullEntry: AuditLogEntry = {
    ...entry,
    id,
    timestamp,
    hash: currentHash
  };
  
  const updated = [fullEntry, ...existing];
  
  // Enforce memory buffer boundary (e.g. max 1000 logs) to prevent storage exhaustion
  if (updated.length > 1000) {
    updated.length = 1000;
  }
  
  try {
    localStorage.setItem('audit_trail_buffer', JSON.stringify(updated));
    // Dispatch custom event to notify listening React components in real-time
    window.dispatchEvent(new CustomEvent('audit_trail_updated', { detail: fullEntry }));
  } catch (err) {
    console.error('Failed to save audit log entry:', err);
  }
  
  return fullEntry;
}

// Verifies the integrity of the entire audit chain
export interface IntegrityResult {
  isValid: boolean;
  tamperedIndex?: number;
  expectedHash?: string;
  actualHash?: string;
}

export function verifyAuditTrailIntegrity(): IntegrityResult {
  const logs = getAuditLogs();
  if (logs.length === 0) return { isValid: true };
  
  // We check from the oldest to the newest (reverse of logs array)
  const orderedLogs = [...logs].reverse();
  let prevHash = 'genesis_block';
  
  for (let i = 0; i < orderedLogs.length; i++) {
    const log = orderedLogs[i];
    const payload = `${log.id}|${log.timestamp}|${log.type}|${log.action}|${log.details}|${log.status}|${log.user}|${prevHash}`;
    const calculatedHash = fnv1a(payload);
    
    if (log.hash !== calculatedHash) {
      // Find its index in the original logs array
      const originalIndex = logs.length - 1 - i;
      return {
        isValid: false,
        tamperedIndex: originalIndex,
        expectedHash: calculatedHash,
        actualHash: log.hash
      };
    }
    prevHash = log.hash;
  }
  
  return { isValid: true };
}

// Clears logs and reseeds with a system security log
export function clearAuditLogs(user: string = 'System Admin'): void {
  localStorage.removeItem('audit_trail_buffer');
  logAuditEvent({
    type: 'system',
    action: 'AUDIT_TRAIL_CLEARED',
    details: 'Audit trail buffer was manually cleared and re-initialized by the administrator.',
    status: 'warning',
    user
  });
}

// Helper to escape CSV cell content
function escapeCSV(val: string): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// Exports the audit logs to a clean downloadable CSV file
export function exportAuditLogsToCSV(logs: AuditLogEntry[]): void {
  const headers = ['ID', 'Tidsstempel', 'Kategori', 'Handling', 'Detaljer', 'Status', 'Bruger / System', 'Hash-Signatur'];
  
  const rows = logs.map(log => [
    log.id,
    log.timestamp,
    log.type.toUpperCase(),
    log.action,
    log.details,
    log.status.toUpperCase(),
    log.user,
    log.hash
  ]);
  
  const csvContent = [
    headers.map(escapeCSV).join(','),
    ...rows.map(row => row.map(escapeCSV).join(','))
  ].join('\n');
  
  const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  
  const dateStr = new Date().toISOString().split('T')[0];
  link.setAttribute('download', `system_audit_trail_report_${dateStr}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
