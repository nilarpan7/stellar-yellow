import React, { useState } from 'react';
import { TrendingUp, AlertCircle, Loader2 } from 'lucide-react';

interface BidFormProps {
  auctionId: number;
  currentBid: number;
  isActive: boolean;
  isHighestBidder: boolean;
  isConnected: boolean;
  onBid: (amount: number) => Promise<void>;
  disabled?: boolean;
}

export default function BidForm({
  auctionId,
  currentBid,
  isActive,
  isHighestBidder,
  isConnected,
  onBid,
  disabled,
}: BidFormProps) {
  const MIN_INCREMENT = 0.5; // XLM
  const minBid = currentBid + MIN_INCREMENT;

  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const bid = parseFloat(amount);

    if (!amount || isNaN(bid)) {
      setError('Please enter a valid bid amount.');
      return;
    }
    if (bid < minBid) {
      setError(`Bid must be at least ${minBid.toFixed(2)} XLM (current: ${currentBid.toFixed(2)} XLM + ${MIN_INCREMENT} XLM min increment).`);
      return;
    }

    setIsSubmitting(true);
    try {
      await onBid(bid);
      setAmount('');
    } catch {
      // Error handled by parent via TxStatusModal
    } finally {
      setIsSubmitting(false);
    }
  };

  const setQuickBid = (multiplier: number) => {
    setAmount((minBid * multiplier).toFixed(2));
    setError('');
  };

  // Disabled states
  if (!isActive) {
    return (
      <div className="p-4 rounded-xl text-center"
        style={{ background: 'rgba(148,163,184,0.05)', border: '1px solid rgba(148,163,184,0.1)' }}>
        <p className="text-slate-400 text-sm">This auction has ended</p>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="p-4 rounded-xl text-center"
        style={{ background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.15)' }}>
        <p className="text-slate-400 text-sm">Connect your wallet to place a bid</p>
      </div>
    );
  }

  if (isHighestBidder) {
    return (
      <div className="p-4 rounded-xl text-center"
        style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.15)' }}>
        <div className="flex items-center justify-center gap-2 text-emerald-400">
          <TrendingUp size={16} />
          <p className="text-sm font-semibold">You are the highest bidder! 🎉</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Quick bid buttons */}
      <div className="flex gap-2">
        {[1, 1.1, 1.25, 1.5].map(m => (
          <button
            key={m}
            type="button"
            onClick={() => setQuickBid(m)}
            className="flex-1 py-1.5 text-xs rounded-lg font-medium transition-all"
            style={{
              background: 'rgba(139,92,246,0.08)',
              border: '1px solid rgba(139,92,246,0.15)',
              color: '#a78bfa',
            }}
          >
            {m === 1 ? 'Min' : `×${m}`}
          </button>
        ))}
      </div>

      {/* Amount input */}
      <div className="relative">
        <input
          id={`bid-input-${auctionId}`}
          type="number"
          value={amount}
          onChange={e => { setAmount(e.target.value); setError(''); }}
          placeholder={`Min: ${minBid.toFixed(2)} XLM`}
          step="0.1"
          min={minBid}
          className="input-field pr-14"
          disabled={isSubmitting || disabled}
          autoComplete="off"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">
          XLM
        </span>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 text-xs animate-fade-in"
          style={{ color: '#fb7185' }}>
          <AlertCircle size={12} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        id={`place-bid-btn-${auctionId}`}
        disabled={isSubmitting || disabled || !amount}
        className="btn-primary w-full justify-center text-base py-3"
      >
        {isSubmitting ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Placing Bid…
          </>
        ) : (
          <>
            <TrendingUp size={16} />
            Place Bid
            {amount && !isNaN(parseFloat(amount)) && ` — ${parseFloat(amount).toFixed(2)} XLM`}
          </>
        )}
      </button>

      <p className="text-xs text-slate-600 text-center">
        Minimum increment: {MIN_INCREMENT} XLM · Testnet only
      </p>
    </form>
  );
}
