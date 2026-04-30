import { Activity, Zap, ExternalLink } from 'lucide-react';
import type { BidEvent } from '../lib/contract';
import { truncateAddress, getExplorerTxUrl } from '../lib/stellar';

interface EventFeedProps {
  events: BidEvent[];
  isPolling: boolean;
}

export default function EventFeed({ events, isPolling }: EventFeedProps) {
  return (
    <div className="rounded-xl overflow-hidden"
      style={{ border: '1px solid rgba(139,92,246,0.1)', background: 'rgba(15,17,23,0.6)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: 'rgba(139,92,246,0.1)' }}>
        <div className="flex items-center gap-2">
          <Activity size={14} style={{ color: '#a78bfa' }} />
          <span className="text-sm font-semibold text-slate-300">Live Feed</span>
        </div>
        {isPolling && (
          <div className="flex items-center gap-1.5">
            <span className="live-dot" />
            <span className="text-xs text-slate-500">Polling every 4s</span>
          </div>
        )}
      </div>

      {/* Events */}
      <div className="max-h-60 overflow-y-auto">
        {events.length === 0 ? (
          <div className="py-8 text-center">
            <Activity size={20} className="mx-auto mb-2 text-slate-700" />
            <p className="text-slate-600 text-xs">Waiting for on-chain events…</p>
          </div>
        ) : (
          events.map((event, i) => (
            <div
              key={`${event.txHash}-${i}`}
              className="flex items-center gap-3 px-4 py-2.5 border-b bid-item-enter"
              style={{ borderColor: 'rgba(139,92,246,0.05)' }}
            >
              <Zap size={12} style={{ color: '#fbbf24', flexShrink: 0 }} />
              <span className="text-xs text-slate-400 flex-1 min-w-0">
                <span className="font-mono text-slate-300">{truncateAddress(event.bidder, 4)}</span>
                {' bid '}
                <span style={{ color: '#fbbf24' }} className="font-semibold">
                  {event.amount.toFixed(2)} XLM
                </span>
                {' on Auction #'}{event.auctionId}
              </span>
              {event.txHash && (
                <a
                  href={getExplorerTxUrl(event.txHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-700 hover:text-slate-400 transition-colors flex-shrink-0"
                >
                  <ExternalLink size={10} />
                </a>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
