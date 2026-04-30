import { useState, useCallback } from 'react';
import type { AppError } from '../lib/errors';

// ─── TX Status Types ──────────────────────────────────────────────────────────
export type TxStatus = 'idle' | 'pending' | 'success' | 'failed';

export interface TxState {
  status: TxStatus;
  txHash?: string;
  error?: AppError;
  message?: string;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useContract() {
  const [txState, setTxState] = useState<TxState>({ status: 'idle' });

  const execute = useCallback(
    async <T>(
      fn: () => Promise<T>,
      options?: { pendingMessage?: string; successMessage?: string }
    ): Promise<T | null> => {
      setTxState({
        status: 'pending',
        message: options?.pendingMessage || 'Submitting to network…',
      });
      try {
        const result = await fn();
        setTxState({
          status: 'success',
          txHash: typeof result === 'string' ? result : undefined,
          message: options?.successMessage || 'Transaction successful!',
        });
        return result;
      } catch (err) {
        const appError = err as AppError;
        setTxState({
          status: 'failed',
          error: appError?.type
            ? appError
            : { type: 'UNKNOWN_ERROR', message: String(err) },
        });
        return null;
      }
    },
    []
  );

  const reset = useCallback(() => {
    setTxState({ status: 'idle' });
  }, []);

  return { txState, execute, reset };
}
