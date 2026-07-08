import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { savePnlToCalendar } from './calendar';
import * as auth from './auth';

vi.mock('./auth', () => ({
  getAccessToken: vi.fn(),
  googleSignIn: vi.fn(),
  initAuth: vi.fn(),
}));

describe('savePnlToCalendar', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.resetAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('should use existing token if available', async () => {
    const mockToken = 'existing_token';
    vi.mocked(auth.getAccessToken).mockResolvedValue(mockToken);

    const mockResponse = { id: 'event_id' };
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockResponse)
    } as any);

    const result = await savePnlToCalendar(100.50, 65.5, 3);

    expect(auth.getAccessToken).toHaveBeenCalled();
    expect(auth.googleSignIn).not.toHaveBeenCalled();
    expect(result).toEqual(mockResponse);

    // Check fetch args
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const fetchArgs = vi.mocked(global.fetch).mock.calls[0];
    expect(fetchArgs[0]).toBe('https://www.googleapis.com/calendar/v3/calendars/primary/events');
    expect((fetchArgs[1] as any).headers.Authorization).toBe(`Bearer ${mockToken}`);

    const body = JSON.parse((fetchArgs[1] as any).body);
    expect(body.summary).toBe('Daily PnL: +$100.50');
    expect(body.description).toContain('PnL: $100.50');
    expect(body.description).toContain('Win Rate: 65.5%');
    expect(body.description).toContain('Active Positions: 3');
  });

  it('should sign in if token is not available', async () => {
    const mockToken = 'new_token';
    vi.mocked(auth.getAccessToken).mockResolvedValue(null);
    vi.mocked(auth.googleSignIn).mockResolvedValue({ accessToken: mockToken } as any);

    const mockResponse = { id: 'event_id' };
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockResponse)
    } as any);

    await savePnlToCalendar(-50, 33.3, 0);

    expect(auth.getAccessToken).toHaveBeenCalled();
    expect(auth.googleSignIn).toHaveBeenCalled();

    const fetchArgs = vi.mocked(global.fetch).mock.calls[0];
    expect((fetchArgs[1] as any).headers.Authorization).toBe(`Bearer ${mockToken}`);

    const body = JSON.parse((fetchArgs[1] as any).body);
    expect(body.summary).toBe('Daily PnL: $-50.00'); // Note: This is how the current code formats it
  });

  it('should throw error if sign in fails', async () => {
    vi.mocked(auth.getAccessToken).mockResolvedValue(null);
    vi.mocked(auth.googleSignIn).mockResolvedValue(null);

    await expect(savePnlToCalendar(10, 50, 1)).rejects.toThrow("Could not authenticate with Google");
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should throw error if fetch fails with status code', async () => {
    vi.mocked(auth.getAccessToken).mockResolvedValue('token');

    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      statusText: 'Forbidden',
      json: vi.fn().mockRejectedValue(new Error('no json'))
    } as any);

    await expect(savePnlToCalendar(10, 50, 1)).rejects.toThrow("Failed to save to calendar: Forbidden");
  });

  it('should throw error if fetch fails with json error message', async () => {
    vi.mocked(auth.getAccessToken).mockResolvedValue('token');

    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      statusText: 'Forbidden',
      json: vi.fn().mockResolvedValue({ error: { message: 'Invalid token' } })
    } as any);

    await expect(savePnlToCalendar(10, 50, 1)).rejects.toThrow("Failed to save to calendar: Invalid token");
  });
});
