import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Gavel, TrendingUp, Wallet } from 'lucide-react';
import { type AuctionData, auctionClient } from '../lib/contract';
import { useWallet } from '../contexts/WalletContext';
import AuctionCard from '../components/AuctionCard';

type TabType = 'created' | 'bidding' | 'won';

export default function MyAuctions() {
  const { wallet, isConnected, connect } = useWallet();
  const [tab, setTab] = useState<TabType>('bidding');
  const [allAuctions, setAllAuctions] = useState<AuctionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isConnected || !wallet) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsLoading(false);
      return;
    }
    (async () => {
      setIsLoading(true);
      try {
        const count = await auctionClient.getAuctionCount();
        if (count === 0) {
          setAllAuctions([]);
          setIsLoading(false);
          return;
        }
        const promises = Array.from({ length: Math.min(count, 50) }, (_, i) =>
          auctionClient.getAuction(count - i)
        );
        const results = (await Promise.all(promises)).filter(Boolean) as AuctionData[];
        setAllAuctions(results);
      } catch {
        setAllAuctions([]);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [isConnected, wallet]);

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <Wallet size={56} className="mx-auto mb-4 text-slate-700" />
          <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
          <p className="text-slate-400 mb-6">Connect to view your auctions and bids</p>
          <button onClick={() => connect()} className="btn-primary px-8 py-3 text-base">
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  const address = wallet!.address;
  const created = allAuctions.filter(a => a.creator === address);
  const bidding = allAuctions.filter(a =>
    a.highestBidder === address && a.creator !== address && a.status === 'active'
  );
  const won = allAuctions.filter(a =>
    a.highestBidder === address && a.creator !== address && a.status === 'ended'
  );

  const tabs = [
    { key: 'bidding' as TabType, label: 'Active Bids', icon: <TrendingUp size={14} />, count: bidding.length },
    { key: 'created' as TabType, label: 'Created', icon: <Gavel size={14} />, count: created.length },
    { key: 'won' as TabType, label: 'Won', icon: <Trophy size={14} />, count: won.length },
  ];

  const currentList = tab === 'created' ? created : tab === 'bidding' ? bidding : won;

  return (
    <div className="min-h-screen py-10 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-white mb-1">My Activity</h1>
            <p className="text-slate-500 font-mono text-xs">{address}</p>
          </div>
          <Link to="/create" className="btn-primary">
            <Gavel size={14} />
            New Auction
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {tabs.map(t => (
            <div key={t.key} className="p-4 rounded-xl text-center"
              style={{ background: 'rgba(22,27,39,0.6)', border: '1px solid rgba(139,92,246,0.1)' }}>
              <div className="flex items-center justify-center gap-1.5 mb-1 text-slate-400">
                {t.icon}
                <span className="text-xs">{t.label}</span>
              </div>
              <p className="text-2xl font-black text-white">{t.count}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b pb-0" style={{ borderColor: 'rgba(139,92,246,0.1)' }}>
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              id={`my-tab-${t.key}`}
              className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-all"
              style={{
                color: tab === t.key ? '#a78bfa' : '#64748b',
                borderBottom: tab === t.key ? '2px solid #8b5cf6' : '2px solid transparent',
              }}
            >
              {t.icon}
              {t.label}
              {t.count > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-xs"
                  style={{
                    background: tab === t.key ? 'rgba(139,92,246,0.2)' : 'rgba(100,116,139,0.1)',
                    color: tab === t.key ? '#a78bfa' : '#64748b',
                  }}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-2xl overflow-hidden h-72">
                <div className="shimmer h-40" />
                <div className="p-4 space-y-3">
                  <div className="shimmer h-4 w-2/3" />
                  <div className="shimmer h-8 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : currentList.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">
              {tab === 'won' ? '🏆' : tab === 'created' ? '🏺' : '📊'}
            </div>
            <p className="text-slate-400 text-lg font-medium mb-2">
              {tab === 'won' ? 'No wins yet' : tab === 'created' ? 'No auctions created' : 'Not bidding on anything'}
            </p>
            <p className="text-slate-600 text-sm mb-6">
              {tab === 'won' ? 'Keep bidding to win exclusive items!' :
               tab === 'created' ? 'Create your first auction to get started.' :
               'Browse auctions and place your first bid.'}
            </p>
            <Link to={tab === 'created' ? '/create' : '/'} className="btn-secondary">
              {tab === 'created' ? 'Create Auction' : 'Browse Auctions'}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {currentList.map(auction => (
              <AuctionCard key={auction.id} auction={auction} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
