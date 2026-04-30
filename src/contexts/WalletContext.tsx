import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { getWalletKit, saveWalletToStorage, clearWalletFromStorage, type WalletState } from '../lib/wallet';
import { parseContractError, type AppError } from '../lib/errors';
import { NETWORK_CONFIG } from '../lib/stellar';

// ─── Types ────────────────────────────────────────────────────────────────────
interface WalletContextValue {
  wallet: WalletState | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: AppError | null;
  connect: (walletId?: string) => Promise<void>;
  disconnect: () => Promise<void>;
  signTransaction: (xdr: string) => Promise<string>;
  openModal: () => void;
  openSignal: number;
  clearError: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────
const WalletContext = createContext<WalletContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function WalletProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<WalletState | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  // Modal open signal — components listen to this to open their modal
  const [_openSignal, setOpenSignal] = useState(0);

  // No auto-reconnect — user must explicitly connect each session
  useEffect(() => {}, []);

  const connect = useCallback(async (walletId?: string) => {
    setIsConnecting(true);
    setError(null);
    try {
      const Kit = getWalletKit();

      // Set the wallet module to use
      Kit.setWallet(walletId ?? 'freighter');

      // authModal() correctly triggers the wallet's connection flow.
      const { address } = await Kit.authModal();
      const selectedId = Kit.selectedModule?.productId ?? walletId ?? 'freighter';
      const selectedName = Kit.selectedModule?.productName ?? selectedId;

      setWallet({
        address,
        walletId: selectedId,
        walletName: selectedName,
        isConnected: true,
      });
      saveWalletToStorage(selectedId);
    } catch (err) {
      console.error('Wallet connection error:', err);
      const appError = parseContractError(err);
      setError(appError);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      const Kit = getWalletKit();
      await Kit.disconnect();
    } catch {
      // ignore
    }
    setWallet(null);
    setError(null);
    clearWalletFromStorage();
  }, []);

  const signTransaction = useCallback(async (xdr: string): Promise<string> => {
    if (!wallet) throw new Error('Wallet not connected');
    const Kit = getWalletKit();
    const { signedTxXdr } = await Kit.signTransaction(xdr, {
      networkPassphrase: NETWORK_CONFIG.networkPassphrase,
    });
    return signedTxXdr;
  }, [wallet]);

  // openModal triggers WalletConnect modal by incrementing a signal counter
  const openModal = useCallback(() => {
    setOpenSignal(s => s + 1);
  }, []);

  return (
    <WalletContext.Provider value={{
      wallet,
      isConnected: !!wallet?.isConnected,
      isConnecting,
      error,
      connect,
      disconnect,
      signTransaction,
      openModal,
      openSignal: _openSignal,
      clearError: () => setError(null),
    }}>
      {children}
    </WalletContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used inside <WalletProvider>');
  return ctx;
}
