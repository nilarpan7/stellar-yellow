import { Link } from 'react-router-dom';
import { TrendingUp, User, ArrowRight } from 'lucide-react';
import type { AuctionData } from '../lib/contract';
import { truncateAddress } from '../lib/stellar';
import CountdownTimer from './CountdownTimer';

interface AuctionCardProps {
  auction: AuctionData;
  onAuctionEnd?: () => void;
}

export default function AuctionCard({ auction, onAuctionEnd }: AuctionCardProps) {
  const isActive = auction.status === 'active' && auction.endTime > new Date();
  const isCancelled = auction.status === 'cancelled';

  return (
    <Link to={`/auction/${auction.id}`} className="block group">
      <div
        className="rounded-none overflow-hidden transition-colors duration-200 h-full flex flex-col bg-zinc-950 border border-white/10 hover:border-lime-400"
      >
        {/* Image */}
        <div className="relative h-56 overflow-hidden bg-zinc-900 border-b border-white/10">
          {auction.imageUrl ? (
            <img
              src={auction.imageUrl}
              alt={auction.itemName}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-5xl animate-float" style={{ filter: 'drop-shadow(0 4px 12px rgba(139,92,246,0.4))' }}>
                🏺
              </div>
            </div>
          )}

          {/* Status Badge */}
          <div className="absolute top-4 left-4">
            {isCancelled ? (
              <span className="badge" style={{ background: 'transparent', color: '#f87171', border: '1px solid #f87171' }}>
                Cancelled
              </span>
            ) : isActive ? (
              <span className="badge badge-active">
                <span className="live-dot" />
                Live
              </span>
            ) : (
              <span className="badge badge-ended">Ended</span>
            )}
          </div>

          {/* Auction ID */}
          <div className="absolute top-4 right-4">
            <span className="badge bg-black/50 text-zinc-400 border border-white/20">
              #{auction.id}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col flex-1 gap-4">
          <div>
            <h3 className="font-bold text-white text-xl leading-tight mb-2 line-clamp-1 group-hover:text-lime-400 transition-colors uppercase tracking-tight">
              {auction.itemName}
            </h3>
            {auction.description && (
              <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest line-clamp-2 leading-relaxed">{auction.description}</p>
            )}
          </div>

          {/* Bid Info */}
          <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 font-mono mt-auto">
            <div>
              <p className="text-xs text-zinc-500 mb-1 flex items-center gap-2 uppercase tracking-widest">
                <TrendingUp size={12} /> Current Bid
              </p>
              <p className="font-bold text-2xl text-white">
                {auction.highestBid.toFixed(0)}
                <span className="text-sm text-lime-400 ml-2">XLM</span>
              </p>
            </div>
            {auction.highestBidder !== auction.creator && (
              <div className="text-right">
                <p className="text-xs text-zinc-500 mb-1 flex items-center gap-2 justify-end uppercase tracking-widest">
                  <User size={12} /> Top Bidder
                </p>
                <p className="font-bold text-sm text-white">
                  {truncateAddress(auction.highestBidder, 4)}
                </p>
              </div>
            )}
          </div>

          {/* Timer */}
          <div className="flex items-center justify-between border-t border-white/10 pt-4 mt-2">
            <CountdownTimer endTime={auction.endTime} onEnd={onAuctionEnd} size="sm" />
            <span className="text-zinc-500 group-hover:text-lime-400 transition-colors">
              <ArrowRight size={20} />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
