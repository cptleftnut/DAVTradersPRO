import { getAccessToken, googleSignIn, initAuth } from './auth';

export const savePnlToCalendar = async (pnl: number, winRate: number, activePositions: number) => {
  let token = await getAccessToken();
  if (!token) {
    const res = await googleSignIn();
    if (!res) throw new Error("Could not authenticate with Google");
    token = res.accessToken;
  }

  const date = new Date().toISOString().split('T')[0];
  const event = {
    summary: `Daily PnL: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`,
    description: `Daily Trading Summary\n\nPnL: $${pnl.toFixed(2)}\nWin Rate: ${winRate.toFixed(1)}%\nActive Positions: ${activePositions}\nRecorded by Alpha Omega AI`,
    start: {
      date: date,
    },
    end: {
      date: date,
    },
  };

  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Failed to save to calendar: ${errorData.error?.message || response.statusText}`);
  }

  return response.json();
};
