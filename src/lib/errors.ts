// ─── Error Types ─────────────────────────────────────────────────────────────
export type AppErrorType =
  | 'WALLET_NOT_FOUND'
  | 'USER_REJECTED'
  | 'INSUFFICIENT_BALANCE'
  | 'BID_TOO_LOW'
  | 'AUCTION_ENDED'
  | 'AUCTION_NOT_FOUND'
  | 'NETWORK_ERROR'
  | 'CONTRACT_ERROR'
  | 'SIMULATION_FAILED'
  | 'UNKNOWN_ERROR';

export interface AppError {
  type: AppErrorType;
  message: string;
  details?: string;
}

// ─── Error Factory ────────────────────────────────────────────────────────────
export function createError(type: AppErrorType, message: string, details?: string): AppError {
  return { type, message, details };
}

// ─── Soroban/Stellar Error Parser ────────────────────────────────────────────
export function parseContractError(error: unknown): AppError {
  const errStr = String(error);
  const errMsg = (error as Error)?.message || errStr;

  // User rejected wallet popup
  if (
    errMsg.includes('rejected') ||
    errMsg.includes('cancelled') ||
    errMsg.includes('denied') ||
    errMsg.includes('cancel') ||
    errMsg.includes('User declined')
  ) {
    return createError('USER_REJECTED', 'Transaction was cancelled', 'You rejected the transaction in your wallet.');
  }

  // Wallet not installed
  if (
    errMsg.includes('not installed') ||
    errMsg.includes('not found') ||
    errMsg.includes('undefined') && errMsg.toLowerCase().includes('wallet')
  ) {
    return createError('WALLET_NOT_FOUND', 'Please install Freighter or another supported wallet');
  }

  // Insufficient balance
  if (
    errMsg.includes('insufficient') ||
    errMsg.includes('balance') ||
    errMsg.includes('INSUFFICIENT_FUNDS') ||
    errMsg.includes('op_underfunded')
  ) {
    return createError(
      'INSUFFICIENT_BALANCE',
      'Not enough XLM to place this bid',
      'Your wallet balance is too low to cover this bid plus network fees.'
    );
  }

  // Bid too low (contract error #3)
  if (
    errMsg.includes('Error(Contract, #3)') ||
    errMsg.includes('BidTooLow') ||
    errMsg.includes('bid too low') ||
    errMsg.includes('ERR_BID_TOO_LOW')
  ) {
    return createError('BID_TOO_LOW', 'Bid must exceed the current highest bid');
  }

  // Auction already ended (contract error #2)
  if (
    errMsg.includes('Error(Contract, #2)') ||
    errMsg.includes('AuctionEnded') ||
    errMsg.includes('already ended') ||
    errMsg.includes('ERR_AUCTION_ALREADY_ENDED') ||
    errMsg.includes('Error(Contract, #5)')
  ) {
    return createError('AUCTION_ENDED', 'This auction has already ended');
  }

  // Auction not found (contract error #1)
  if (
    errMsg.includes('Error(Contract, #1)') ||
    errMsg.includes('AuctionNotFound')
  ) {
    return createError('AUCTION_NOT_FOUND', 'Auction not found on the blockchain');
  }

  // Simulation failed
  if (errMsg.includes('Simulation failed') || errMsg.includes('simulation')) {
    return createError(
      'SIMULATION_FAILED',
      'Transaction simulation failed',
      errMsg.slice(0, 200)
    );
  }

  // Network error
  if (
    errMsg.includes('fetch') ||
    errMsg.includes('network') ||
    errMsg.includes('timeout') ||
    errMsg.includes('ECONNREFUSED') ||
    errMsg.includes('Failed to fetch')
  ) {
    return createError(
      'NETWORK_ERROR',
      'Stellar network unreachable, retrying…',
      'Check your internet connection and try again.'
    );
  }

  return createError('UNKNOWN_ERROR', 'An unexpected error occurred', errMsg.slice(0, 300));
}

// ─── Error Display Helpers ────────────────────────────────────────────────────
export function getErrorIcon(type: AppErrorType): string {
  switch (type) {
    case 'WALLET_NOT_FOUND': return '🦊';
    case 'USER_REJECTED': return '🚫';
    case 'INSUFFICIENT_BALANCE': return '💸';
    case 'BID_TOO_LOW': return '📉';
    case 'AUCTION_ENDED': return '🔒';
    case 'NETWORK_ERROR': return '🌐';
    case 'CONTRACT_ERROR':
    case 'SIMULATION_FAILED': return '⚙️';
    default: return '❌';
  }
}
