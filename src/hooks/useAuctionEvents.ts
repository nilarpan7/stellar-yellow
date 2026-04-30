import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { auctionClient, type BidEvent } from '../lib/contract';

const POLL_INTERVAL_MS = 4000;

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAuctionEvents(auctionId?: number, watchedAddress?: string) {
  const [events, setEvents] = useState<BidEvent[]>([]);
  const [isPolling, setIsPolling] = useState(false);
  const seenHashes = useRef<Set<string>>(new Set());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      // Don't pass a startLedger - let the contract client calculate a valid one
      const newEvents = await auctionClient.getRecentEvents();

      const filtered = auctionId
        ? newEvents.filter(e => e.auctionId === auctionId)
        : newEvents;

      const fresh = filtered.filter(e => !seenHashes.current.has(e.txHash));

      if (fresh.length > 0) {
        fresh.forEach(e => {
          seenHashes.current.add(e.txHash);

          // Toast for new bids
          const isOutbid = watchedAddress && e.bidder !== watchedAddress;
          if (isOutbid) {
            toast(`🔔 You've been outbid! New bid: ${e.amount.toFixed(2)} XLM`, {
              style: { background: '#1d2535', color: '#e2e8f0', border: '1px solid rgba(251,191,36,0.3)' },
            });
          } else {
            toast.success(`New bid: ${e.amount.toFixed(2)} XLM on Auction #${e.auctionId}`, {
              style: { background: '#1d2535', color: '#e2e8f0' },
            });
          }
        });

        setEvents(prev => [...fresh.reverse(), ...prev].slice(0, 100));
      }
    } catch (err) {
      // Silent fail — polling will retry
      console.log('[Events] Polling error (will retry):', err);
    }
  }, [auctionId, watchedAddress]);

  const startPolling = useCallback(() => {
    if (intervalRef.current) return;
    setIsPolling(true);
    fetchEvents(); // immediate first fetch
    intervalRef.current = setInterval(fetchEvents, POLL_INTERVAL_MS);
  }, [fetchEvents]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  useEffect(() => {
    startPolling();
    return () => stopPolling();
  }, [startPolling, stopPolling]);

  return { events, isPolling, fetchEvents };
}
