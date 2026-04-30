import { useState, useCallback, useEffect } from 'react';
import { getWalletKit, saveWalletToStorage, loadWalletFromStorage, clearWalletFromStorage, type WalletState } from '../lib/wallet';
import { parseContractError, type AppError } from '../lib/errors';
import { NETWORK_CONFIG } from '../lib/stellar';

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useWallet() {
  const [wallet, setWallet] = useState<WalletState | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  // Auto-reconnect on mount if a wallet was previously connected
  useEffect(() => {
    const reconnectWallet = async (walletId: string) => {
      setIsReconnecting(true);
      try {
        const Kit = getWalletKit();
        Kit.setWallet(walletId);
        const { address } = await Kit.getAddress();
        if (address) {
          setWallet({
            address,
            walletId,
            walletName: walletId,
            isConnected: true,
          });
        }
      } catch {
        clearWalletFromStorage();
      } finally {
        setIsReconnecting(false);
      }
    };

    const savedWalletId = loadWalletFromStorage();
    if (savedWalletId) {
      reconnectWallet(savedWalletId);
    }
  }, []);

  const connect = useCallback(async (walletId?: string) => {
    setIsConnecting(true);
    setError(null);
    try {
      const Kit = getWalletKit();

      if (walletId) {
        // Direct connection to a specified wallet
        Kit.setWallet(walletId);
        const { address } = await Kit.getAddress();
        setWallet({
          address,
          walletId,
          walletName: walletId,
          isConnected: true,
        });
        saveWalletToStorage(walletId);
      } else {
        // Open the built-in auth modal — returns address on success
        const { address } = await Kit.authModal();
        // After authModal resolves, the selected module is already set internally
        const selectedId = Kit.selectedModule?.productId || 'freighter';
        const selectedName = Kit.selectedModule?.productName || selectedId;
        setWallet({
          address,
          walletId: selectedId,
          walletName: selectedName,
          isConnected: true,
        });
        saveWalletToStorage(selectedId);
      }
    } catch (err) {
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
    isReconnecting,
    isConnected: !!wallet?.isConnected,
    error,
    connect,
    disconnect,
    signTransaction,
    openModal,
    clearError: () => setError(null),
  };
}
