import React, { useState } from 'react';
import { Wallet, ChevronDown, LogOut, ExternalLink, AlertCircle } from 'lucide-react';
import { useWallet } from '../hooks/useWallet';
import { truncateAddress, getExplorerAccountUrl } from '../lib/stellar';

export default function WalletConnect() {
  const { wallet, isConnected, isConnecting, isReconnecting, error, connect, disconnect, clearError } = useWallet();
  const [showDropdown, setShowDropdown] = useState(false);

  if (isConnected && wallet) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowDropdown(d => !d)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all"
          style={{
            background: 'rgba(139,92,246,0.12)',
            border: '1px solid rgba(139,92,246,0.25)',
            color: '#a78bfa',
          }}
        >
          <div className="w-2 h-2 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 6px #34d399' }} />
          <span className="font-mono text-xs">{truncateAddress(wallet.address, 5)}</span>
          <ChevronDown size={14} className={`transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
        </button>

        {showDropdown && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
            <div
              className="absolute right-0 top-full mt-2 z-20 rounded-xl p-2 min-w-[220px] animate-slide-down"
              style={{
                background: 'rgba(22,27,39,0.98)',
                border: '1px solid rgba(139,92,246,0.2)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
              }}
            >
              <div className="px-3 py-2 border-b mb-1" style={{ borderColor: 'rgba(139,92,246,0.1)' }}>
                <p className="text-xs text-slate-400 mb-0.5">Connected via {wallet.walletName}</p>
                <p className="font-mono text-xs text-slate-300">{truncateAddress(wallet.address, 8)}</p>
              </div>

              <a
                href={getExplorerAccountUrl(wallet.address)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-300 hover:text-white transition-colors w-full text-left"
                style={{ ':hover': { background: 'rgba(139,92,246,0.1)' } } as React.CSSProperties}
                onClick={() => setShowDropdown(false)}
              >
                <ExternalLink size={14} />
                View on Explorer
              </a>

              <button
                onClick={() => { disconnect(); setShowDropdown(false); }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm w-full text-left transition-colors"
                style={{ color: '#fb7185' }}
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
      {isReconnecting && !isConnected && (
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <div className="spinner" style={{ width: 12, height: 12 }} />
          Reconnecting…
        </div>
      )}
      {error && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs animate-fade-in"
          style={{ background: 'rgba(251,113,133,0.1)', color: '#fb7185', border: '1px solid rgba(251,113,133,0.2)' }}>
          <AlertCircle size={12} />
          <span>{error.message}</span>
          <button onClick={clearError} className="ml-1 hover:opacity-70">✕</button>
        </div>
      )}
      <button
        onClick={() => connect()}
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
    </div>
  );
}
