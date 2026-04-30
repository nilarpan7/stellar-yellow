import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Wallet, ChevronDown, LogOut, ExternalLink, AlertCircle, X } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import { truncateAddress, getExplorerAccountUrl } from '../lib/stellar';
import { SUPPORTED_WALLETS } from '../lib/wallet';

export default function WalletConnect() {
  const { wallet, isConnected, isConnecting, error, connect, disconnect, clearError, openSignal } = useWallet();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);

  // Listen for external open modal requests (e.g., from the hero section button)
  useEffect(() => {
    if (openSignal > 0) {
      setShowConnectModal(true);
    }
  }, [openSignal]);

  const handleConnect = async (walletId: string) => {
    setShowConnectModal(false);
    await connect(walletId);
  };

  // Wallet Selection Modal — rendered via Portal to escape Navbar stacking context
  const walletModal = showConnectModal ? createPortal(
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={() => setShowConnectModal(false)}
      />
      {/* Modal Panel */}
      <div className="relative bg-zinc-950 border-2 border-lime-400 p-8 w-full max-w-md shadow-[10px_10px_0px_rgba(163,230,53,0.2)] animate-slide-up font-mono">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
          <h2 className="text-2xl font-bold uppercase tracking-tighter text-white">
            Connect <span className="text-lime-400">Wallet</span>
          </h2>
          <button
            onClick={() => setShowConnectModal(false)}
            className="text-zinc-500 hover:text-white transition-colors p-1"
          >
            <X size={24} />
          </button>
        </div>

        {/* Wallet Options */}
        <div className="space-y-3">
          {SUPPORTED_WALLETS.map(w => (
            <button
              key={w.id}
              onClick={() => handleConnect(w.id)}
              className="w-full flex items-center justify-between p-5 bg-transparent border border-white/20 hover:border-lime-400 hover:bg-white/[0.02] group transition-all duration-200"
            >
              <div className="flex items-center gap-4">
                <div className="text-3xl group-hover:scale-110 transition-transform duration-200">
                  {w.icon}
                </div>
                <div className="text-left">
                  <div className="text-white font-bold uppercase tracking-widest text-base group-hover:text-lime-400 transition-colors">
                    {w.name}
                  </div>
                  <div className="text-zinc-600 text-xs mt-1 font-mono">
                    // {w.description}
                  </div>
                </div>
              </div>
              <div className="w-2 h-2 bg-transparent border border-white/20 group-hover:bg-lime-400 group-hover:border-lime-400 transition-all duration-200" />
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-white/10 text-center">
          <p className="text-xs text-zinc-700 uppercase tracking-widest">
            Powered by Stellar Wallets Kit
          </p>
        </div>
      </div>
    </div>,
    document.body
  ) : null;

  if (isConnected && wallet) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowDropdown(d => !d)}
          className="flex items-center gap-2 px-4 py-2 bg-transparent border border-white/20 hover:border-lime-400 transition-colors uppercase font-mono text-sm tracking-widest text-white hover:text-lime-400"
        >
          <div className="w-2 h-2 bg-lime-400" />
          <span>{truncateAddress(wallet.address, 5)}</span>
          <ChevronDown size={14} className={`transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
        </button>

        {showDropdown && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
            <div className="absolute right-0 top-full mt-2 z-20 p-4 min-w-[240px] animate-slide-down bg-zinc-950 border border-white/20 shadow-2xl font-mono">
              <div className="pb-4 border-b border-white/10 mb-2">
                <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Via {wallet.walletName}</p>
                <p className="text-sm text-white break-all">{truncateAddress(wallet.address, 8)}</p>
              </div>

              <a
                href={getExplorerAccountUrl(wallet.address)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-3 text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-colors w-full text-left uppercase tracking-widest"
                onClick={() => setShowDropdown(false)}
              >
                <ExternalLink size={14} />
                Explorer
              </a>

              <button
                onClick={() => { disconnect(); setShowDropdown(false); }}
                className="flex items-center gap-2 px-3 py-3 text-sm w-full text-left transition-colors text-pink-500 hover:bg-white/5 uppercase tracking-widest mt-1"
              >
                <LogOut size={14} />
                Disconnect
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {error && (
        <div className="flex items-center gap-2 px-3 py-2 text-pink-500 border border-pink-500 font-mono text-xs uppercase tracking-widest">
          <AlertCircle size={12} />
          <span>{error.message}</span>
          <button onClick={clearError} className="ml-2 hover:text-white transition-colors">✕</button>
        </div>
      )}
      <button
        onClick={() => setShowConnectModal(true)}
        disabled={isConnecting}
        className="btn-primary"
        id="connect-wallet-btn"
      >
        {isConnecting ? (
          <>
            <div className="spinner" style={{ width: 14, height: 14 }} />
            Connecting…
          </>
        ) : (
          <>
            <Wallet size={15} />
            Connect Wallet
          </>
        )}
      </button>

      {walletModal}
    </div>
  );
}
