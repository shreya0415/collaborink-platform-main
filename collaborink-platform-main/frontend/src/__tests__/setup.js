import '@testing-library/jest-dom';
import { vi, afterEach, beforeEach } from 'vitest';

// jsdom doesn't implement scrollIntoView — mock it globally
window.HTMLElement.prototype.scrollIntoView = vi.fn();

// Suppress React/act() warnings in tests
const originalError = console.error;
beforeEach(() => {
  console.error = (...args) => {
    const msg = args[0]?.toString() ?? '';
    if (msg.includes('Warning:') || msg.includes('act(') || msg.includes('not wrapped in act')) return;
    originalError(...args);
  };
});
afterEach(() => {
  console.error = originalError;
  vi.clearAllMocks();
});
