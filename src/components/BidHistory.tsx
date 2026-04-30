import { ExternalLink, TrendingUp } from 'lucide-react';
import type { BidEvent } from '../lib/contract';
import { truncateAddress, getExplorerTxUrl } from '../lib/stellar';

interface BidHistoryProps {
  bids: BidEvent[];
  currentHighestBidder?: string;
}

function formatRelativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

export default function BidHistory({ bids, currentHighestBidder }: BidHistoryProps) {
  if (bids.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500 text-sm">
        <TrendingUp size={28} className="mx-auto mb-2 opacity-30" />
        <p>No bids yet — be the first!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
      {bids.map((bid, i) => {
        const isTop = bid.bidder === currentHighestBidder && i === 0;
        return (
          <div
            key={`${bid.txHash}-${i}`}
            className="flex items-center justify-between p-3 rounded-xl bid-item-enter"
            style={{
              background: isTop ? 'rgba(251,191,36,0.06)' : 'rgba(22,27,39,0.6)',
              border: `1px solid ${isTop ? 'rgba(251,191,36,0.2)' : 'rgba(139,92,246,0.08)'}`,
            }}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  background: isTop ? 'rgba(251,191,36,0.15)' : 'rgba(139,92,246,0.1)',
                  color: isTop ? '#fbbf24' : '#a78bfa',
                }}
              >
                {i === 0 ? '👑' : `#${i + 1}`}
              </div>
              <div>
                <p className="font-mono text-xs text-slate-300">{truncateAddress(bid.bidder, 5)}</p>
                <p className="text-xs text-slate-600">{formatRelativeTime(bid.timestamp)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-bold text-sm" style={{ color: isTop ? '#fbbf24' : '#e2e8f0' }}>
                {bid.amount.toFixed(2)} XLM
              </span>
              {bid.txHash && (
                <a
                  href={getExplorerTxUrl(bid.txHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-600 hover:text-slate-400 transition-colors"
                >
                  <ExternalLink size={12} />
                </a>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
