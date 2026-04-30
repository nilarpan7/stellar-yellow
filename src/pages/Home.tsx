import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Plus, Search, Gavel, Zap, TrendingUp, RefreshCw } from 'lucide-react';
import { useLayoutEffect, useRef } from 'react';
import gsap from "gsap";
import AuctionCard from '../components/AuctionCard';
import { Marquee } from '../components/LooComponents';
import BidCube from '../components/BidCube';
import EventFeed from '../components/EventFeed';
import { type AuctionData, type BidEvent, auctionClient } from '../lib/contract';
import { useWallet } from '../contexts/WalletContext';

type FilterType = 'all' | 'active' | 'ended' | 'cancelled';

export default function Home() {
  const location = useLocation();
  const [auctions, setAuctions] = useState<AuctionData[]>([]);
  const [events, setEvents] = useState<BidEvent[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isPolling, setIsPolling] = useState(false);
  const { isConnected, openModal } = useWallet();
  const heroRef = useRef(null);

  useLayoutEffect(() => {
      const ctx = gsap.context(() => {
          const tl = gsap.timeline();
          tl.from(".hero-line", {
              y: 100,
              opacity: 0,
              duration: 1,
              stagger: 0.1,
              ease: "power4.out"
          })
          .from(".hero-sub", {
              opacity: 0,
              y: 20,
              duration: 0.8
          }, "-=0.5")
          .from(".hero-btn", {
              scale: 0.8,
              opacity: 0,
              duration: 0.5,
              ease: "back.out(1.7)"
          }, "-=0.5");
      }, heroRef);
      return () => ctx.revert();
  }, []);

  const loadAuctions = useCallback(async () => {
    setIsLoading(true);
    try {
      const count = await auctionClient.getAuctionCount();
      if (count > 0) {
        const promises = Array.from({ length: Math.min(count, 20) }, (_, i) =>
          auctionClient.getAuction(count - i)
        );
        const results = (await Promise.all(promises)).filter(Boolean) as AuctionData[];
        setAuctions(results);
      } else {
        setAuctions([]);
      }
    } catch {
      setAuctions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAuctions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Event Polling
  useEffect(() => {
    let mounted = true;
    const poll = async () => {
      if (!mounted) return;
      setIsPolling(true);
      try {
        const recent = await auctionClient.getRecentEvents();
        if (mounted) setEvents(recent);
      } catch (err) {
        console.error('Polling error:', err);
      } finally {
        if (mounted) setIsPolling(false);
      }
    };

    poll();
    const interval = setInterval(poll, 4000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Reload auctions when navigating back with refresh state
  useEffect(() => {
    if (location.state?.refresh) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadAuctions();
      // Clear the state to prevent reloading on every render
      window.history.replaceState({}, document.title);
    }
  }, [location.state, loadAuctions]);

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
      (filter === 'ended' && (a.status === 'ended' || a.endTime <= new Date())) ||
      (filter === 'cancelled' && a.status === 'cancelled');
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
      <section ref={heroRef} className="min-h-[85vh] flex flex-col justify-center px-6 pt-24 pb-20 relative overflow-hidden border-b border-white/10 text-white">
          <div className="max-w-[1920px] mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-8 z-10">
                  <div className="overflow-hidden mb-2">
                      <h1 className="hero-line text-6xl md:text-8xl lg:text-[7rem] font-bold tracking-tighter leading-[0.9] uppercase">
                          Decentralized<span className="text-lime-400">.</span>
                      </h1>
                  </div>
                  <div className="overflow-hidden mb-2">
                      <h1 className="hero-line text-6xl md:text-8xl lg:text-[7rem] font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-zinc-200 to-zinc-600 leading-[0.9] uppercase">
                          Auctions<span className="text-indigo-500">.</span>
                      </h1>
                  </div>
                  <div className="overflow-hidden mb-8">
                      <h1 className="hero-line text-6xl md:text-8xl lg:text-[7rem] font-bold tracking-tighter leading-[0.9] uppercase">
                          On Stellar<span className="text-pink-500">.</span>
                      </h1>
                  </div>

                  <p className="hero-sub text-zinc-400 font-mono text-lg max-w-xl mb-10 border-l-2 border-lime-400 pl-4">
          // Bid on exclusive digital assets. <br />
          // Transparent, trustless, and real-time. <br />
          // Powered by Soroban smart contracts.
                  </p>

                  <div className="flex gap-4 pb-12">
                      <Link to="/create" id="hero-create-btn" className="hero-btn group relative px-8 py-4 bg-lime-400 text-black font-bold font-mono uppercase overflow-hidden inline-flex items-center">
                          <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
                          <span className="relative z-10 flex items-center gap-2">
                              Create Auction <Plus className="w-5 h-5" />
                          </span>
                      </Link>
                      {!isConnected && (
                        <button onClick={() => openModal()} className="hero-btn px-8 py-4 bg-transparent border border-white/20 text-white font-bold font-mono uppercase hover:border-lime-400 transition-colors flex items-center gap-2">
                            <Zap className="w-5 h-5" /> Connect
                        </button>
                      )}
                  </div>
              </div>

              <div className="lg:col-span-4 h-[420px] flex items-center justify-center">
                  <BidCube />
              </div>
          </div>
      </section>
      
      <Marquee />

      {/* Live Activity & Stats */}
      <div className="py-20 bg-zinc-900/50 border-b border-white/10">
          <div className="max-w-[1920px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Stats */}
              <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-px bg-white/5 border border-white/10 overflow-hidden">
                  {[
                    { label: 'Total Auctions', value: stats.total, icon: <Gavel className="mb-2 text-zinc-500" size={24} /> },
                    { label: 'Live Now', value: stats.active, icon: <Zap className="mb-2 text-lime-400" size={24} />, highlight: true },
                    { label: 'Total Volume', value: `${stats.totalVolume.toFixed(0)} XLM`, icon: <TrendingUp className="mb-2 text-zinc-500" size={24} /> },
                  ].map((s, i) => (
                      <div key={i} className="bg-zinc-950 p-12 flex flex-col items-center text-center group transition-colors hover:bg-zinc-900/80">
                          {s.icon}
                          <div className={`text-5xl md:text-7xl font-bold mb-4 tracking-tighter ${s.highlight ? 'text-lime-400' : 'text-white'}`}>{s.value}</div>
                          <div className="font-mono text-xs text-zinc-500 uppercase tracking-widest mb-2">_{s.label}</div>
                      </div>
                  ))}
              </div>

              {/* Event Feed */}
              <div className="lg:col-span-4 h-full">
                  <EventFeed events={events} isPolling={isPolling} />
              </div>
          </div>
      </div>

      {/* Auction Grid */}
      <div className="max-w-[1920px] mx-auto px-6 py-32">
        <div className="mb-16 border-b border-white/10 pb-8 flex flex-col md:flex-row justify-between items-end">
            <h2 className="text-5xl md:text-7xl font-bold uppercase tracking-tighter">
                System <span className="text-zinc-600">Auctions</span>
            </h2>
        </div>
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

          <div className="flex flex-wrap gap-2">
            {(['all', 'active', 'ended', 'cancelled'] as FilterType[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                id={`filter-${f}`}
                className={`px-6 py-3 font-mono text-sm uppercase tracking-widest font-bold transition-all border ${filter === f ? 'bg-lime-400 text-black border-lime-400' : 'bg-transparent text-zinc-400 border-white/20 hover:border-lime-400 hover:text-white'}`}
              >
                {f}
              </button>
            ))}
            <button
              onClick={loadAuctions}
              disabled={isLoading}
              className="px-6 py-3 bg-transparent border border-white/20 text-zinc-400 hover:border-lime-400 hover:text-white transition-all ml-auto disabled:opacity-50 flex items-center justify-center"
              title="Refresh auctions"
            >
              <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-zinc-900/50 border border-white/10 p-6" style={{ height: 340 }}>
                <div className="shimmer h-44 mb-4" />
                <div className="space-y-4">
                  <div className="shimmer h-6 w-2/3" />
                  <div className="shimmer h-4 w-full" />
                  <div className="shimmer h-12 mt-4" />
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
