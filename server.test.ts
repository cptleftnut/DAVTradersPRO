import { describe, it, expect } from 'vitest';
import fetch from 'node-fetch';

let PORT = 3000;

describe('Binance Proxy Security Fix', () => {

  it('should allow /api/binance-proxy/klines', async () => {
    const res = await fetch(`http://localhost:${PORT}/api/binance-proxy/klines?symbol=BTCUSDT&interval=1d&limit=1`);
    expect(res.status).toBe(200);
  });

  it('should allow /api/binance-proxy/ticker/24hr', async () => {
    const res = await fetch(`http://localhost:${PORT}/api/binance-proxy/ticker/24hr`);
    expect(res.status).toBe(200);
  });

  it('should allow /api/binance-proxy/ticker/price', async () => {
    const res = await fetch(`http://localhost:${PORT}/api/binance-proxy/ticker/price?symbol=BTCUSDT`);
    expect(res.status).toBe(200);
  });

  it('should block arbitrary endpoints', async () => {
    const res = await fetch(`http://localhost:${PORT}/api/binance-proxy/account`);
    expect(res.status).toBe(403);
    const text = await res.text();
    expect(text).toContain('Forbidden');
  });

  it('should block traversal payloads hitting the proxy', async () => {
    // We send raw http to bypass client normalization or URL constructor normalization
    const http = await import('http');
    const req = http.request({
      host: 'localhost',
      port: PORT,
      path: '/api/binance-proxy/..%2faccount',
      method: 'GET'
    });

    return new Promise((resolve) => {
      req.on('response', (res) => {
        expect(res.statusCode).toBe(403);
        resolve(null);
      });
      req.end();
    });
  });
});
