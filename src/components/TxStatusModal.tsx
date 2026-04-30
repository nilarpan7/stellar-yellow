import { CheckCircle, XCircle, Loader2, ExternalLink, X } from 'lucide-react';
import type { TxState } from '../hooks/useContract';
import { getErrorIcon } from '../lib/errors';
import { getExplorerTxUrl } from '../lib/stellar';

interface TxStatusModalProps {
  txState: TxState;
  onClose: () => void;
  title?: string;
}

export default function TxStatusModal({ txState, onClose, title = 'Transaction' }: TxStatusModalProps) {
  if (txState.status === 'idle') return null;

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content relative max-w-sm w-full">
        {/* Close */}
        {txState.status !== 'pending' && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition-colors"
            id="tx-modal-close"
          >
            <X size={18} />
          </button>
        )}

        <div className="flex flex-col items-center text-center gap-4">
          {/* Icon */}
          <div className="relative">
            {txState.status === 'pending' && (
              <div className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(251,191,36,0.1)', border: '2px solid rgba(251,191,36,0.3)' }}>
                <Loader2 size={28} className="animate-spin" style={{ color: '#fbbf24' }} />
              </div>
            )}
            {txState.status === 'success' && (
              <div className="w-16 h-16 rounded-full flex items-center justify-center animate-fade-in"
                style={{ background: 'rgba(52,211,153,0.1)', border: '2px solid rgba(52,211,153,0.3)' }}>
                <CheckCircle size={32} style={{ color: '#34d399' }} />
              </div>
            )}
            {txState.status === 'failed' && (
              <div className="w-16 h-16 rounded-full flex items-center justify-center animate-fade-in"
                style={{ background: 'rgba(251,113,133,0.1)', border: '2px solid rgba(251,113,133,0.3)' }}>
                <XCircle size={32} style={{ color: '#fb7185' }} />
              </div>
            )}
          </div>

          {/* Status Text */}
          <div>
            <h3 className="font-bold text-white text-lg mb-1">
              {txState.status === 'pending' && `${title}…`}
              {txState.status === 'success' && '🎉 Success!'}
              {txState.status === 'failed' && `${getErrorIcon(txState.error?.type || 'UNKNOWN_ERROR')} Failed`}
            </h3>
            <p className="text-sm text-slate-400">
              {txState.status === 'pending' && (txState.message || 'Submitting to Stellar network…')}
              {txState.status === 'success' && (txState.message || 'Transaction confirmed on Stellar Testnet!')}
              {txState.status === 'failed' && (txState.error?.message || 'Transaction failed')}
            </p>

            {/* Error details */}
            {txState.status === 'failed' && txState.error?.details && (
              <p className="mt-2 text-xs text-slate-600 font-mono bg-slate-900 p-2 rounded-lg text-left break-all">
                {txState.error.details}
              </p>
            )}
          </div>

          {/* Explorer link */}
          {txState.status === 'success' && txState.txHash && (
            <a
              href={getExplorerTxUrl(txState.txHash)}
              target="_blank"
              rel="noopener noreferrer"
              id="tx-explorer-link"
              className="flex items-center gap-2 text-sm font-medium transition-colors"
              style={{ color: '#a78bfa' }}
            >
              <ExternalLink size={14} />
              View on Stellar Explorer
            </a>
          )}

          {/* Pending note */}
          {txState.status === 'pending' && (
            <p className="text-xs text-slate-600">
              Please approve the transaction in your wallet popup
            </p>
          )}

          {/* Close button for done states */}
          {txState.status !== 'pending' && (
            <button onClick={onClose} className="btn-secondary w-full justify-center mt-2">
              {txState.status === 'success' ? 'Done' : 'Try Again'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
