import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft, User, Gavel,
  ExternalLink, Share2, Flag, Loader2
} from 'lucide-react';
import { type AuctionData, type BidEvent, auctionClient } from '../lib/contract';
import { useWallet } from '../hooks/useWallet';
import { useContract } from '../hooks/useContract';
import { useAuctionEvents } from '../hooks/useAuctionEvents';
import CountdownTimer from '../components/CountdownTimer';
import BidForm from '../components/BidForm';
import BidHistory from '../components/BidHistory';
import EventFeed from '../components/EventFeed';
import TxStatusModal from '../components/TxStatusModal';
import { truncateAddress, getExplorerAccountUrl } from '../lib/stellar';

// Demo auction data for when contract isn't deployed
const DEMO_AUCTIONS: Record<number, AuctionData> = {
  1: {
    id: 1,
    creator: 'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN',
    itemName: 'Vintage Stellar NFT #001',
    description: 'A rare digital collectible from the early Stellar ecosystem — one of only 100 ever minted. This piece was among the first assets tokenized on the Stellar network, making it a true historical artifact of decentralized finance.',
    startingPrice: 10,
    highestBid: 42.5,
    highestBidder: 'GBVKI23OQZCANDNZINLJR5JZJH5IAJTGKIN2ER7LBNVKOCCWNGAZI4TC',
    endTime: new Date(Date.now() + 3 * 3600 * 1000),
    status: 'active',
    imageUrl: '',
  },
  2: {
    id: 2,
    creator: 'GBVKI23OQZCANDNZINLJR5JZJH5IAJTGKIN2ER7LBNVKOCCWNGAZI4TC',
    itemName: 'Soroban Pioneer Badge',
    description: 'Exclusive badge for early Soroban smart contract deployers. Provable on-chain ownership.',
    startingPrice: 5,
    highestBid: 28,
    highestBidder: 'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN',
    endTime: new Date(Date.now() + 7200 * 1000),
    status: 'active',
    imageUrl: '',
  },
};

export default function AuctionDetail() {
  const { id } = useParams<{ id: string }>();
  const auctionId = Number(id);

  const { wallet, isConnected, connect } = useWallet();
  const { txState, execute, reset } = useContract();
  const { events, isPolling } = useAuctionEvents(auctionId, wallet?.address);

  const [auction, setAuction] = useState<AuctionData | null>(null);
  const [bids, setBids] = useState<BidEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'bids' | 'events'>('bids');
  const [showShareModal, setShowShareModal] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(url);
        toast.success('Auction link copied to clipboard!');
      } catch {
        setShowShareModal(true);
      }
    } else {
      setShowShareModal(true);
    }
  };

  const loadAuction = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await auctionClient.getAuction(auctionId);
      setAuction(data || DEMO_AUCTIONS[auctionId] || null);
    } catch {
      setAuction(DEMO_AUCTIONS[auctionId] || null);
    } finally {
      setIsLoading(false);
    }
  }, [auctionId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAuction();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auctionId]);

  // Merge new events into bid history
  useEffect(() => {
    if (events.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBids(prev => {
        const seen = new Set(prev.map(b => b.txHash));
        const fresh = events.filter(e => !seen.has(e.txHash));
        if (fresh.length === 0) return prev;
        // Update auction's highest bid from events
        const latest = fresh[0];
        setAuction(a => a ? { ...a, highestBid: latest.amount, highestBidder: latest.bidder } : a);
        return [...fresh, ...prev];
      });
    }
  }, [events]);

  const handleBid = async (amount: number) => {
    if (!wallet || !isConnected) return;

    await execute(
      async () => {
        const txHash = await auctionClient.placeBid({
          auctionId,
          bidder: wallet.address,
          bidAmountXlm: amount,
          signTransaction: async (xdr) => {
            const { getWalletKit } = await import('../lib/wallet');
            const { NETWORK_CONFIG } = await import('../lib/stellar');
            const kit = getWalletKit();
            const { signedTxXdr } = await kit.signTransaction(xdr, {
              networkPassphrase: NETWORK_CONFIG.networkPassphrase,
            });
            return signedTxXdr;
          },
        });

        // Optimistically update bid list
        setBids(prev => [{
          auctionId,
          bidder: wallet.address,
          amount,
          txHash,
          timestamp: new Date(),
        }, ...prev]);

        setAuction(a => a ? { ...a, highestBid: amount, highestBidder: wallet.address } : a);
        return txHash;
      },
      {
        pendingMessage: `Placing bid of ${amount} XLM…`,
        successMessage: `Bid of ${amount} XLM placed successfully!`,
      }
    );
  };

  const handleEndAuction = async () => {
    if (!wallet) return;
    await execute(
      async () => {
        const txHash = await auctionClient.endAuction({
          auctionId,
          caller: wallet.address,
          signTransaction: async (xdr) => {
            const { getWalletKit } = await import('../lib/wallet');
            const { NETWORK_CONFIG } = await import('../lib/stellar');
            const kit = getWalletKit();
            const { signedTxXdr } = await kit.signTransaction(xdr, {
              networkPassphrase: NETWORK_CONFIG.networkPassphrase,
            });
            return signedTxXdr;
          },
        });
        setAuction(a => a ? { ...a, status: 'ended' } : a);
        return txHash;
      },
      { pendingMessage: 'Settling auction…', successMessage: 'Auction ended and settled!' }
    );
  };

  const isActive = auction?.status === 'active' && (auction?.endTime || new Date(0)) > new Date();
  const isExpiredButNotEnded = auction?.status === 'active' && (auction?.endTime || new Date(0)) <= new Date();
  const isHighestBidder = !!wallet && auction?.highestBidder === wallet.address;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin mx-auto mb-4" style={{ color: '#8b5cf6' }} />
          <p className="text-slate-400">Loading auction…</p>
        </div>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Gavel size={48} className="mx-auto mb-4 text-slate-700" />
          <h2 className="text-2xl font-bold text-slate-300 mb-2">Auction Not Found</h2>
          <p className="text-slate-500 mb-6">This auction doesn't exist or couldn't be loaded.</p>
          <Link to="/" className="btn-primary"><ArrowLeft size={16} />Back to Auctions</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Back */}
        <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6 transition-colors">
          <ArrowLeft size={15} />
          Back to Auctions
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left — Image + Info */}
          <div className="lg:col-span-2 space-y-5">
            {/* Item Image */}
            <div className="rounded-2xl overflow-hidden aspect-video flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #1d2535, #252f42)' }}>
              {auction.imageUrl ? (
                <img src={auction.imageUrl} alt={auction.itemName} className="w-full h-full object-cover" />
              ) : (
                <div className="text-8xl animate-float" style={{ filter: 'drop-shadow(0 8px 20px rgba(139,92,246,0.4))' }}>
                  🏺
                </div>
              )}
            </div>

            {/* Title + Status */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-slate-500 text-sm font-mono">Auction #{auction.id}</span>
                  {isActive ? (
                    <span className="badge badge-active"><span className="live-dot" /> Live</span>
                  ) : (
                    <span className="badge badge-ended">Ended</span>
                  )}
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white">{auction.itemName}</h1>
              </div>
              <button onClick={handleShare} className="btn-secondary px-3 py-2 flex-shrink-0">
                <Share2 size={14} />
              </button>
            </div>

            {/* Description */}
            <div className="p-4 rounded-xl"
              style={{ background: 'rgba(22,27,39,0.6)', border: '1px solid rgba(139,92,246,0.08)' }}>
              <p className="text-slate-300 text-sm leading-relaxed">{auction.description}</p>
            </div>

            {/* Creator */}
            <div className="flex items-center gap-2 text-sm">
              <User size={14} className="text-slate-500" />
              <span className="text-slate-500">Created by</span>
              <a
                href={getExplorerAccountUrl(auction.creator)}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
              >
                {truncateAddress(auction.creator, 8)}
                <ExternalLink size={11} />
              </a>
            </div>

            {/* Bid History / Event Feed Tabs */}
            <div className="rounded-2xl overflow-hidden"
              style={{ background: 'rgba(22,27,39,0.6)', border: '1px solid rgba(139,92,246,0.1)' }}>
              <div className="flex border-b" style={{ borderColor: 'rgba(139,92,246,0.1)' }}>
                {([['bids', 'Bid History'], ['events', 'Live Feed']] as const).map(([tab, label]) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    id={`tab-${tab}`}
                    className="flex-1 py-3 text-sm font-medium transition-all"
                    style={{
                      color: activeTab === tab ? '#a78bfa' : '#64748b',
                      borderBottom: activeTab === tab ? '2px solid #8b5cf6' : '2px solid transparent',
                      background: activeTab === tab ? 'rgba(139,92,246,0.04)' : 'transparent',
                    }}
                  >
                    {label}
                    {tab === 'events' && isPolling && (
                      <span className="ml-2 inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    )}
                  </button>
                ))}
              </div>
              <div className="p-4">
                {activeTab === 'bids' ? (
                  <BidHistory bids={bids} currentHighestBidder={auction.highestBidder} />
                ) : (
                  <EventFeed events={events} isPolling={isPolling} />
                )}
              </div>
            </div>
          </div>

          {/* Right — Bidding Panel */}
          <div className="space-y-4">
            {/* Current Bid */}
            <div className="p-5 rounded-2xl"
              style={{ background: 'rgba(22,27,39,0.8)', border: '1px solid rgba(139,92,246,0.15)' }}>
              <div className="mb-4">
                <p className="text-xs text-slate-500 mb-1">Current Highest Bid</p>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-black" style={{ color: '#fbbf24' }}>
                    {auction.highestBid.toFixed(2)}
                  </span>
                  <span className="text-slate-400 text-sm pb-1">XLM</span>
                </div>
                {auction.highestBidder !== auction.creator && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <User size={11} className="text-slate-500" />
                    <a
                      href={getExplorerAccountUrl(auction.highestBidder)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs text-slate-400 hover:text-white transition-colors"
                    >
                      {truncateAddress(auction.highestBidder, 6)}
                    </a>
                  </div>
                )}
              </div>

              {/* Countdown */}
              <div className="py-3 border-y mb-4" style={{ borderColor: 'rgba(139,92,246,0.1)' }}>
                <p className="text-xs text-slate-500 mb-2">Time Remaining</p>
                <CountdownTimer
                  endTime={auction.endTime}
                  size="md"
                  onEnd={() => setAuction(a => a ? { ...a, status: 'ended' } : a)}
                />
              </div>

              {/* Bid Form */}
              <BidForm
                auctionId={auctionId}
                currentBid={auction.highestBid}
                isActive={isActive}
                isHighestBidder={isHighestBidder}
                isConnected={isConnected}
                onBid={handleBid}
                disabled={txState.status === 'pending'}
              />

              {/* Connect prompt */}
              {!isConnected && (
                <button onClick={() => connect()} className="btn-secondary w-full justify-center mt-3">
                  Connect Wallet
                </button>
              )}
            </div>

            {/* End Auction Button (for expired auctions) */}
            {isExpiredButNotEnded && isConnected && (
              <button
                onClick={handleEndAuction}
                disabled={txState.status === 'pending'}
                className="btn-secondary w-full justify-center"
                id="end-auction-btn"
              >
                <Flag size={14} />
                Settle Auction
              </button>
            )}

            {/* Starting Price Info */}
            <div className="p-4 rounded-xl text-sm"
              style={{ background: 'rgba(22,27,39,0.4)', border: '1px solid rgba(139,92,246,0.06)' }}>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-slate-500">Starting Price</span>
                <span className="text-slate-300">{auction.startingPrice.toFixed(2)} XLM</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Total Bids</span>
                <span className="text-slate-300">{bids.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <TxStatusModal txState={txState} onClose={reset} title="Placing Bid" />

      {/* Share Modal Fallback */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowShareModal(false)}
          />
          <div className="relative bg-[#161b27] rounded-2xl p-6 max-w-md w-full border border-purple-500/20 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">Share Auction</h3>
            <p className="text-slate-400 text-sm mb-3">Copy this link to share:</p>
            <input
              readOnly
              value={window.location.href}
              className="input-field w-full mb-4 text-sm"
              onClick={(e) => e.currentTarget.select()}
            />
            <button
              onClick={() => setShowShareModal(false)}
              className="btn-primary w-full justify-center"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
