import { describe, expect, it } from 'vitest';
import { computeNextRetryAt } from './useSyncPendingSales';

describe('computeNextRetryAt — exponential backoff', () => {
  const now = 1_700_000_000_000;

  it('schedules 1s after first failure', () => {
    expect(computeNextRetryAt(1, now)).toBe(now + 1_000);
  });

  it('doubles each attempt', () => {
    expect(computeNextRetryAt(2, now)).toBe(now + 2_000);
    expect(computeNextRetryAt(3, now)).toBe(now + 4_000);
    expect(computeNextRetryAt(4, now)).toBe(now + 8_000);
    expect(computeNextRetryAt(5, now)).toBe(now + 16_000);
    expect(computeNextRetryAt(6, now)).toBe(now + 32_000);
  });

  it('caps at 60s', () => {
    expect(computeNextRetryAt(7, now)).toBe(now + 60_000);
    expect(computeNextRetryAt(20, now)).toBe(now + 60_000);
  });

  it('treats 0 attempts as no backoff (immediate)', () => {
    // attempts=0 → max(0-1, 0)=0 → 2^0 * 1000 = 1000 ms
    expect(computeNextRetryAt(0, now)).toBe(now + 1_000);
  });
});
