import { describe, it, expect } from 'vitest';
import {
  xlmToStroops,
  stroopsToXlm,
  formatXlm,
  truncateAddress,
  secondsToHours,
  hoursToSeconds,
  formatCountdown,
  getExplorerTxUrl,
  getExplorerAccountUrl,
} from './stellar';

// ─── XLM Conversion Tests ────────────────────────────────────────────────────

describe('xlmToStroops', () => {
  it('converts 1 XLM to 10,000,000 stroops', () => {
    expect(xlmToStroops(1)).toBe(10_000_000n);
  });

  it('converts fractional XLM correctly', () => {
    expect(xlmToStroops(0.5)).toBe(5_000_000n);
  });

  it('converts 0 XLM to 0 stroops', () => {
    expect(xlmToStroops(0)).toBe(0n);
  });
});

describe('stroopsToXlm', () => {
  it('converts 10,000,000 stroops to 1 XLM', () => {
    expect(stroopsToXlm(10_000_000n)).toBe(1);
  });

  it('converts 0 stroops to 0 XLM', () => {
    expect(stroopsToXlm(0n)).toBe(0);
  });

  it('handles string input', () => {
    expect(stroopsToXlm('5000000')).toBe(0.5);
  });
});

describe('formatXlm', () => {
  it('formats stroops to XLM string with 2 decimals by default', () => {
    expect(formatXlm(10_000_000n)).toBe('1.00 XLM');
  });

  it('respects custom decimal precision', () => {
    expect(formatXlm(12_345_678n, 4)).toBe('1.2346 XLM');
  });
});

// ─── Address Helpers ─────────────────────────────────────────────────────────

describe('truncateAddress', () => {
  it('truncates long addresses with ellipsis', () => {
    const addr = 'GCOQZSZBG7RLGKHDRRUL4DQZP5QGYFDYORFSZVWOGTQGMHNP6XN6LG3Q';
    const result = truncateAddress(addr, 6);
    expect(result).toBe('GCOQZS...N6LG3Q');
  });

  it('returns short strings unchanged', () => {
    expect(truncateAddress('SHORT')).toBe('SHORT');
  });

  it('handles empty strings', () => {
    expect(truncateAddress('')).toBe('');
  });
});

// ─── Time Helpers ────────────────────────────────────────────────────────────

describe('secondsToHours', () => {
  it('converts 3600 seconds to 1 hour', () => {
    expect(secondsToHours(3600)).toBe(1);
  });

  it('rounds to nearest hour', () => {
    expect(secondsToHours(5400)).toBe(2); // 1.5h rounds to 2
  });
});

describe('hoursToSeconds', () => {
  it('converts 1 hour to 3600 seconds', () => {
    expect(hoursToSeconds(1)).toBe(3600);
  });

  it('converts 24 hours to 86400 seconds', () => {
    expect(hoursToSeconds(24)).toBe(86400);
  });
});

describe('formatCountdown', () => {
  it('returns expired for past timestamps', () => {
    const past = Date.now() - 1000;
    const result = formatCountdown(past);
    expect(result.expired).toBe(true);
    expect(result.days).toBe(0);
    expect(result.hours).toBe(0);
    expect(result.minutes).toBe(0);
    expect(result.seconds).toBe(0);
  });

  it('correctly calculates remaining time', () => {
    const future = Date.now() + 90_000; // 90 seconds in future
    const result = formatCountdown(future);
    expect(result.expired).toBe(false);
    expect(result.minutes).toBe(1);
  });
});

// ─── Explorer URL Tests ──────────────────────────────────────────────────────

describe('getExplorerTxUrl', () => {
  it('builds correct transaction explorer URL', () => {
    const hash = '9a0afc12683b267bbcdf35b207953b818e5c87cdb050ebafb0aef56620b9f1a7';
    const url = getExplorerTxUrl(hash);
    expect(url).toContain('/tx/');
    expect(url).toContain(hash);
    expect(url).toContain('testnet');
  });
});

describe('getExplorerAccountUrl', () => {
  it('builds correct account explorer URL', () => {
    const addr = 'GCOQZSZBG7RLGKHDRRUL4DQZP5QGYFDYORFSZVWOGTQGMHNP6XN6LG3Q';
    const url = getExplorerAccountUrl(addr);
    expect(url).toContain('/account/');
    expect(url).toContain(addr);
  });
});
