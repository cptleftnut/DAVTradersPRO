import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './ErrorBoundary.tsx';
import './index.css';

// Safe JSON parse for all endpoints that might accidentally return HTML pages
const originalJson = Response.prototype.json;
Response.prototype.json = async function() {
  try {
    const text = await this.text();
    if (!text || text.trim() === '' || text.startsWith('<!DOCTYPE') || text.startsWith('<!doctype') || text.startsWith('<html')) {
      return {};
    }
    return JSON.parse(text);
  } catch (e: any) {
    return {};
  }
};

// Suppress unhandled rejections that might trigger top-level script errors
const originalConsoleError = console.error;
console.error = function(...args) {
  if (args[0] && typeof args[0] === 'string' && (args[0].includes('Script error.') || args[0].includes('Script error'))) {
    return;
  }
  if (args[0] instanceof Error && args[0].message.includes('Script error')) {
    return;
  }
  originalConsoleError.apply(console, args as any);
};

window.addEventListener('error', (event) => {
  const msg = event.message || '';
  if (typeof msg === 'string' && (msg.includes('Script error') || msg.includes('ResizeObserver'))) {
    event.preventDefault();
    event.stopImmediatePropagation();
  }
}, true);
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason) {
    const msg = event.reason.message || String(event.reason);
    if (msg.includes('Unexpected token') || msg.includes('RESOURCE_EXHAUSTED')) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }
}, true);
window.onerror = function(message, source, lineno, colno, error) {
  if (typeof message === 'string' && (message.includes('Script error') || message.includes('ResizeObserver'))) {
    return true; // Supresses error alerts
  }
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
