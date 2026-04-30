import { describe, it, expect } from 'vitest';
import { parseContractError, createError, getErrorIcon } from './errors';

// ─── createError Tests ───────────────────────────────────────────────────────

describe('createError', () => {
  it('creates an error with type, message, and details', () => {
    const err = createError('BID_TOO_LOW', 'Bid too low', 'Must be higher');
    expect(err.type).toBe('BID_TOO_LOW');
    expect(err.message).toBe('Bid too low');
    expect(err.details).toBe('Must be higher');
  });

  it('creates an error without details', () => {
    const err = createError('NETWORK_ERROR', 'Network is down');
    expect(err.type).toBe('NETWORK_ERROR');
    expect(err.message).toBe('Network is down');
    expect(err.details).toBeUndefined();
  });
});

// ─── parseContractError Tests ────────────────────────────────────────────────

describe('parseContractError', () => {
  it('parses user rejection errors', () => {
    const err = parseContractError(new Error('User rejected the request'));
    expect(err.type).toBe('USER_REJECTED');
  });

  it('parses wallet not found errors', () => {
    const err = parseContractError(new Error('Freighter not installed'));
    expect(err.type).toBe('WALLET_NOT_FOUND');
  });

  it('parses insufficient balance errors', () => {
    const err = parseContractError(new Error('op_underfunded'));
    expect(err.type).toBe('INSUFFICIENT_BALANCE');
  });

  it('parses bid too low contract errors', () => {
    const err = parseContractError(new Error('Error(Contract, #3)'));
    expect(err.type).toBe('BID_TOO_LOW');
  });

  it('parses auction ended contract errors', () => {
    const err = parseContractError(new Error('Error(Contract, #2)'));
    expect(err.type).toBe('AUCTION_ENDED');
  });

  it('parses auction not found contract errors', () => {
    const err = parseContractError(new Error('Error(Contract, #1)'));
    expect(err.type).toBe('AUCTION_NOT_FOUND');
  });

  it('parses simulation failed errors', () => {
    const err = parseContractError(new Error('Simulation failed: some reason'));
    expect(err.type).toBe('SIMULATION_FAILED');
  });

  it('parses network errors', () => {
    const err = parseContractError(new Error('Failed to fetch'));
    expect(err.type).toBe('NETWORK_ERROR');
  });

  it('falls back to UNKNOWN_ERROR for unrecognized errors', () => {
    const err = parseContractError(new Error('something completely unknown'));
    expect(err.type).toBe('UNKNOWN_ERROR');
  });
});

// ─── getErrorIcon Tests ──────────────────────────────────────────────────────

describe('getErrorIcon', () => {
  it('returns fox emoji for WALLET_NOT_FOUND', () => {
    expect(getErrorIcon('WALLET_NOT_FOUND')).toBe('🦊');
  });

  it('returns money emoji for INSUFFICIENT_BALANCE', () => {
    expect(getErrorIcon('INSUFFICIENT_BALANCE')).toBe('💸');
  });

  it('returns lock emoji for AUCTION_ENDED', () => {
    expect(getErrorIcon('AUCTION_ENDED')).toBe('🔒');
  });

  it('returns fallback emoji for UNKNOWN_ERROR', () => {
    expect(getErrorIcon('UNKNOWN_ERROR')).toBe('❌');
  });
});
