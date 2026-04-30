import { Activity, Zap, ExternalLink, Plus, XCircle, CheckCircle } from 'lucide-react';
import type { BidEvent } from '../lib/contract';
import { truncateAddress, getExplorerTxUrl } from '../lib/stellar';

interface EventFeedProps {
  events: BidEvent[];
  isPolling: boolean;
}

function getEventDisplay(event: BidEvent) {
  switch (event.eventType) {
    case 'auc_crt':
      return {
        icon: <Plus size={14} className="text-lime-400" />,
        label: <>
          <span className="text-white">{truncateAddress(event.bidder, 4)}</span>
          {' created '}
          <span className="text-lime-400 font-bold">Auction #{event.auctionId}</span>
          {event.amount > 0 && <> at <span className="text-lime-400 font-bold">{event.amount.toFixed(2)} XLM</span></>}
        </>,
      };
    case 'auc_end':
      return {
        icon: <CheckCircle size={14} className="text-amber-400" />,
        label: <>
          <span className="text-lime-400 font-bold">Auction #{event.auctionId}</span>
          {' ended'}
          {event.amount > 0 && <> — winner got <span className="text-amber-400 font-bold">{event.amount.toFixed(2)} XLM</span></>}
        </>,
      };
    case 'auc_cncl':
      return {
        icon: <XCircle size={14} className="text-red-400" />,
        label: <>
          <span className="text-white">{truncateAddress(event.bidder, 4)}</span>
          {' cancelled '}
          <span className="text-red-400 font-bold">Auction #{event.auctionId}</span>
        </>,
      };
    default: // bid_plcd
      return {
        icon: <Zap size={14} className="text-lime-400" />,
        label: <>
          <span className="text-white">{truncateAddress(event.bidder, 4)}</span>
          {' bid '}
          <span className="text-lime-400 font-bold">{event.amount.toFixed(2)} XLM</span>
          {' on Auction #'}{event.auctionId}
        </>,
      };
  }
}

export default function EventFeed({ events, isPolling }: EventFeedProps) {
  return (
    <div className="bg-zinc-950 border border-white/10 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-zinc-900/50">
        <div className="flex items-center gap-3">
          <Activity size={18} className="text-lime-400" />
          <span className="font-mono text-sm font-bold text-white uppercase tracking-widest">Live Feed</span>
        </div>
        {isPolling && (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
            <span className="font-mono text-xs text-zinc-500 uppercase tracking-widest">Polling</span>
          </div>
        )}
      </div>

      {/* Events */}
      <div className="flex-1 overflow-y-auto max-h-[400px]">
        {events.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center h-full">
            <Activity size={32} className="text-zinc-800 mb-4" />
            <p className="font-mono text-zinc-500 text-xs uppercase tracking-widest">Waiting for on-chain events...</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {events.map((event, i) => {
              const display = getEventDisplay(event);
              return (
                <div
                  key={`${event.txHash}-${i}`}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-zinc-900/50 transition-colors group"
                >
                  <div className="w-8 h-8 flex items-center justify-center border border-white/10 bg-zinc-900 group-hover:border-lime-400/50 transition-colors shrink-0">
                    {display.icon}
                  </div>
                  
                  <span className="text-sm text-zinc-400 flex-1 min-w-0 font-mono">
                    {display.label}
                  </span>
                  
                  {event.txHash && (
                    <a
                      href={getExplorerTxUrl(event.txHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 flex items-center justify-center border border-white/10 text-zinc-500 hover:text-black hover:bg-lime-400 hover:border-lime-400 transition-colors shrink-0"
                    >
                      <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
