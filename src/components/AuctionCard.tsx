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

  return (
    <Link to={`/auction/${auction.id}`} className="block group">
      <div
        className="rounded-2xl overflow-hidden transition-all duration-300 h-full flex flex-col"
        style={{
          background: 'rgba(22,27,39,0.7)',
          border: '1px solid rgba(139,92,246,0.1)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.borderColor = 'rgba(139,92,246,0.35)';
          (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
          (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 40px rgba(0,0,0,0.3), 0 0 0 1px rgba(139,92,246,0.15)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.borderColor = 'rgba(139,92,246,0.1)';
          (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
          (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.2)';
        }}
      >
        {/* Image */}
        <div className="relative h-44 overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1d2535, #252f42)' }}>
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
          <div className="absolute top-3 left-3">
            {isActive ? (
              <span className="badge badge-active">
                <span className="live-dot" />
                Live
              </span>
            ) : (
              <span className="badge badge-ended">Ended</span>
            )}
          </div>

          {/* Auction ID */}
          <div className="absolute top-3 right-3">
            <span className="badge"
              style={{ background: 'rgba(0,0,0,0.5)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' }}>
              #{auction.id}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1 gap-3">
          <div>
            <h3 className="font-bold text-white text-base leading-tight mb-1 line-clamp-1 group-hover:text-purple-300 transition-colors">
              {auction.itemName}
            </h3>
            {auction.description && (
              <p className="text-slate-500 text-xs line-clamp-2">{auction.description}</p>
            )}
          </div>

          {/* Bid Info */}
          <div className="flex items-center justify-between p-3 rounded-xl"
            style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.1)' }}>
            <div>
              <p className="text-xs text-slate-500 mb-0.5 flex items-center gap-1">
                <TrendingUp size={10} /> Current Bid
              </p>
              <p className="font-bold text-lg" style={{ color: '#fbbf24' }}>
                {auction.highestBid.toFixed(2)}
                <span className="text-xs text-slate-400 ml-1">XLM</span>
              </p>
            </div>
            {auction.highestBidder !== auction.creator && (
              <div className="text-right">
                <p className="text-xs text-slate-500 mb-0.5 flex items-center gap-1 justify-end">
                  <User size={10} /> Top Bidder
                </p>
                <p className="font-mono text-xs text-slate-300">
                  {truncateAddress(auction.highestBidder, 4)}
                </p>
              </div>
            )}
          </div>

          {/* Timer */}
          <div className="flex items-center justify-between mt-auto">
            <CountdownTimer endTime={auction.endTime} onEnd={onAuctionEnd} size="sm" />
            <span className="text-purple-400 group-hover:text-purple-300 transition-colors">
              <ArrowRight size={16} />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
