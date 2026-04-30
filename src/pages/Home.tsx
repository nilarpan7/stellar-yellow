import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Gavel, Zap, TrendingUp } from 'lucide-react';
import AuctionCard from '../components/AuctionCard';
import { type AuctionData, auctionClient } from '../lib/contract';
import { useWallet } from '../hooks/useWallet';

// ─── Simulated/Demo Auctions ─────────────────────────────────────────────────
// Frozen at module load time so Date objects are stable across renders
const DEMO_AUCTIONS: AuctionData[] = (() => {
  const now = Date.now();
  return [
    {
      id: 1,
      creator: 'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN',
      itemName: 'Vintage Stellar NFT #001',
      description: 'A rare digital collectible from the early Stellar ecosystem — one of only 100 ever minted.',
      startingPrice: 10,
      highestBid: 42.5,
      highestBidder: 'GBVKI23OQZCANDNZINLJR5JZJH5IAJTGKIN2ER7LBNVKOCCWNGAZI4TC',
      endTime: new Date(now + 3 * 3600 * 1000),
      status: 'active',
      imageUrl: '',
    },
    {
      id: 2,
      creator: 'GBVKI23OQZCANDNZINLJR5JZJH5IAJTGKIN2ER7LBNVKOCCWNGAZI4TC',
      itemName: 'Soroban Pioneer Badge',
      description: 'Exclusive badge for early Soroban smart contract deployers. Provable on-chain ownership.',
      startingPrice: 5,
      highestBid: 28,
      highestBidder: 'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN',
      endTime: new Date(now + 7200 * 1000),
      status: 'active',
      imageUrl: '',
    },
    {
      id: 3,
      creator: 'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN',
      itemName: 'Lumens Genesis Certificate',
      description: 'Historical certificate commemorating the first XLM transaction on the Stellar mainnet.',
      startingPrice: 25,
      highestBid: 110,
      highestBidder: 'GBVKI23OQZCANDNZINLJR5JZJH5IAJTGKIN2ER7LBNVKOCCWNGAZI4TC',
      endTime: new Date(now - 1000),
      status: 'ended',
      imageUrl: '',
    },
    {
      id: 4,
      creator: 'GBVKI23OQZCANDNZINLJR5JZJH5IAJTGKIN2ER7LBNVKOCCWNGAZI4TC',
      itemName: 'Stellar DEX Liquidity Trophy',
      description: 'Awarded to top DEX liquidity providers in Q1 2024. Ultra rare — only 10 exist.',
      startingPrice: 15,
      highestBid: 15,
      highestBidder: 'GBVKI23OQZCANDNZINLJR5JZJH5IAJTGKIN2ER7LBNVKOCCWNGAZI4TC',
      endTime: new Date(now + 12 * 3600 * 1000),
      status: 'active',
      imageUrl: '',
    },
    {
      id: 5,
      creator: 'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN',
      itemName: 'Testnet Validator Node Key',
      description: 'A symbolic key representing early Stellar testnet validation authority.',
      startingPrice: 50,
      highestBid: 87,
      highestBidder: 'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN',
      endTime: new Date(now + 30 * 60 * 1000),
      status: 'active',
      imageUrl: '',
    },
    {
      id: 6,
      creator: 'GBVKI23OQZCANDNZINLJR5JZJH5IAJTGKIN2ER7LBNVKOCCWNGAZI4TC',
      itemName: 'Soroban Beta Tester NFT',
      description: 'Commemorative NFT for early Soroban beta testers who submitted bug reports.',
      startingPrice: 8,
      highestBid: 33,
      highestBidder: 'GBVKI23OQZCANDNZINLJR5JZJH5IAJTGKIN2ER7LBNVKOCCWNGAZI4TC',
      endTime: new Date(now + 2 * 24 * 3600 * 1000),
      status: 'active',
      imageUrl: '',
    },
  ];
})();

type FilterType = 'all' | 'active' | 'ended';

export default function Home() {
  const [auctions, setAuctions] = useState<AuctionData[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { isConnected, connect } = useWallet();

  const loadAuctions = useCallback(async () => {
    setIsLoading(true);
    try {
      const count = await auctionClient.getAuctionCount();
      if (count > 0) {
        const promises = Array.from({ length: Math.min(count, 20) }, (_, i) =>
          auctionClient.getAuction(count - i)
        );
        const results = (await Promise.all(promises)).filter(Boolean) as AuctionData[];
        setAuctions(results.length > 0 ? results : DEMO_AUCTIONS);
      } else {
        setAuctions(DEMO_AUCTIONS);
      }
    } catch {
      setAuctions(DEMO_AUCTIONS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAuctions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mark a single auction as ended without reloading the whole list
  const handleAuctionEnd = useCallback((id: number) => {
    setAuctions(prev =>
      prev.map(a => a.id === id ? { ...a, status: 'ended' as const } : a)
    );
  }, []);

  const filtered = auctions.filter(a => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'active' && a.status === 'active' && a.endTime > new Date()) ||
      (filter === 'ended' && (a.status === 'ended' || a.endTime <= new Date()));
    const matchesSearch =
      !search ||
      a.itemName.toLowerCase().includes(search.toLowerCase()) ||
      a.description?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: auctions.length,
    active: auctions.filter(a => a.status === 'active' && a.endTime > new Date()).length,
    totalVolume: auctions.reduce((sum, a) => sum + a.highestBid, 0),
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden py-16 px-4"
        style={{ background: 'linear-gradient(160deg, rgba(139,92,246,0.08) 0%, transparent 60%)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-4 animate-fade-in"
              style={{
                background: 'rgba(139,92,246,0.1)',
                border: '1px solid rgba(139,92,246,0.2)',
                color: '#a78bfa',
              }}>
              <Zap size={11} />
              Powered by Soroban Smart Contracts on Stellar Testnet
            </div>

            <h1 className="text-4xl sm:text-5xl font-black mb-4 tracking-tight animate-slide-up">
              <span className="gradient-text">Decentralized</span>
              <br />
              <span className="text-white">Auctions on Stellar</span>
            </h1>
            <p className="text-slate-400 text-lg max-w-xl mx-auto mb-8 animate-slide-up">
              Bid on exclusive digital assets. Transparent, trustless, and real-time.
              All powered by Soroban smart contracts.
            </p>

            <div className="flex items-center justify-center gap-3 animate-slide-up">
              <Link to="/create" id="hero-create-btn" className="btn-primary text-base px-6 py-3">
                <Plus size={18} />
                Create Auction
              </Link>
              {!isConnected && (
                <button onClick={() => connect()} className="btn-secondary text-base px-6 py-3">
                  <Zap size={18} />
                  Connect Wallet
                </button>
              )}
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
            {[
              { label: 'Total Auctions', value: stats.total, icon: <Gavel size={16} /> },
              { label: 'Live Now', value: stats.active, icon: <Zap size={16} />, highlight: true },
              { label: 'Total Volume', value: `${stats.totalVolume.toFixed(0)} XLM`, icon: <TrendingUp size={16} /> },
            ].map(({ label, value, icon, highlight }) => (
              <div key={label} className="text-center p-4 rounded-xl"
                style={{
                  background: highlight ? 'rgba(139,92,246,0.08)' : 'rgba(22,27,39,0.5)',
                  border: `1px solid ${highlight ? 'rgba(139,92,246,0.2)' : 'rgba(139,92,246,0.08)'}`,
                }}>
                <div className="flex items-center justify-center gap-1 mb-1" style={{ color: highlight ? '#a78bfa' : '#64748b' }}>
                  {icon}
                  <span className="text-xs">{label}</span>
                </div>
                <p className="font-bold text-xl text-white">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Auction Grid */}
      <div className="max-w-7xl mx-auto px-4 pb-16">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-8">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search auctions…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field pl-9"
              id="auction-search"
            />
          </div>

          <div className="flex gap-2">
            {(['all', 'active', 'ended'] as FilterType[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                id={`filter-${f}`}
                className="px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all"
                style={{
                  background: filter === f ? 'rgba(139,92,246,0.15)' : 'rgba(22,27,39,0.5)',
                  border: `1px solid ${filter === f ? 'rgba(139,92,246,0.35)' : 'rgba(139,92,246,0.08)'}`,
                  color: filter === f ? '#a78bfa' : '#64748b',
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Loading Skeletons */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden" style={{ height: 340 }}>
                <div className="shimmer h-44" />
                <div className="p-4 space-y-3">
                  <div className="shimmer h-4 w-2/3" />
                  <div className="shimmer h-3 w-full" />
                  <div className="shimmer h-10 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Gavel size={48} className="mx-auto mb-4 text-slate-700" />
            <h3 className="text-xl font-bold text-slate-400 mb-2">No Auctions Found</h3>
            <p className="text-slate-600 mb-6">
              {search ? 'Try a different search term.' : 'Be the first to create an auction!'}
            </p>
            <Link to="/create" className="btn-primary">
              <Plus size={16} />
              Create First Auction
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(auction => (
              <AuctionCard
                key={auction.id}
                auction={auction}
                onAuctionEnd={() => handleAuctionEnd(auction.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
