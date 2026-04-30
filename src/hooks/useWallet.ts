import { useState, useCallback, useEffect } from 'react';
import { getWalletKit, saveWalletToStorage, clearWalletFromStorage, type WalletState } from '../lib/wallet';
import { parseContractError, type AppError } from '../lib/errors';
import { NETWORK_CONFIG } from '../lib/stellar';

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useWallet() {
  const [wallet, setWallet] = useState<WalletState | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  // Removed auto-reconnect on mount so the user must explicitly log in every time
  useEffect(() => {
    // We intentionally don't auto-reconnect here based on user request
  }, []);

  const connect = useCallback(async (walletId?: string) => {
    setIsConnecting(true);
    setError(null);
    try {
      const Kit = getWalletKit();

      if (walletId) {
        Kit.setWallet(walletId);
      } else {
        // Default to freighter if nothing is selected
        Kit.setWallet('freighter');
      }

      // Use getAddress() to silently request connection or trigger the wallet's own native popup
      // This bypasses the stellar-wallets-kit default UI modal, allowing us to use our own.
      const response = await Kit.getAddress();
      const address = response.address;
      
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
      console.error("Wallet connection error:", err);
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
      // ignore disconnect errors
    }
    setWallet(null);
    setError(null);
    clearWalletFromStorage();
  }, []);

  const signTransaction = useCallback(
    async (xdr: string): Promise<string> => {
      if (!wallet) throw new Error('Wallet not connected');
      const Kit = getWalletKit();
      const { signedTxXdr } = await Kit.signTransaction(xdr, {
        networkPassphrase: NETWORK_CONFIG.networkPassphrase,
      });
      return signedTxXdr;
    },
    [wallet]
  );

  const openModal = useCallback(() => {
    connect();
  }, [connect]);

  return {
    wallet,
    isConnecting,
    isConnected: !!wallet?.isConnected,
    error,
    connect,
    disconnect,
    signTransaction,
    openModal,
    clearError: () => setError(null),
  };
}
